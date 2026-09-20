# Upload e Processamento

## Fluxo de upload

```mermaid
sequenceDiagram
    actor Usuario as Usuário
    participant KC as Keycloak
    participant API as Management API
    participant DB as PostgreSQL
    participant MINIO as MinIO
    participant MQ as RabbitMQ

    Usuario->>KC: Login no realm fiapx
    KC-->>Usuario: Access token JWT
    Usuario->>API: POST /videos
    API->>API: Valida JWT, sub e email
    API->>DB: INSERT status RECEBIDO
    API-->>Usuario: videoId + uploadUrl
    Usuario->>MINIO: PUT original.mp4
    MINIO->>MQ: ObjectCreated / video.uploaded
```

O registro e o upload são desacoplados. A API cria o metadado e a URL temporária; o arquivo é enviado diretamente ao MinIO.

## Chaves de objetos

| Objeto | Caminho confirmado |
| --- | --- |
| Vídeo original | `videos/{userId}/{videoId}/original.mp4` |
| Resultado | `results/{userId}/{videoId}/resultado.zip` |

O Worker rejeita notificações MinIO que não sigam a chave canônica do vídeo original.

## Processamento assíncrono

```mermaid
sequenceDiagram
    participant MQ as RabbitMQ
    participant Worker as Processing Worker
    participant MINIO as MinIO
    participant FFMPEG as FFmpeg
    participant ZIP as ZIP

    MQ->>Worker: video.processing
    Worker->>MQ: video.processing.started
    Worker->>MINIO: GET original.mp4
    Worker->>FFMPEG: Extrair frames fps=1
    FFMPEG-->>Worker: frame_000001.png...
    Worker->>ZIP: Gerar resultado.zip
    Worker->>MINIO: PUT resultado.zip
    Worker->>MQ: video.processing.completed
    Worker->>MQ: ACK da mensagem original
```

O Worker só confirma a mensagem original após concluir o processamento e publicar o evento de conclusão. Em falha transitória, publica a mensagem em retry e confirma a entrega original; em falha terminal, publica evento de falha e envia a mensagem original para DLQ.

## Concorrência

A escala é feita por múltiplas instâncias do `video-processing-service` consumindo a mesma fila `video.processing`.

```powershell
docker compose `
  --env-file .env `
  -f docker-compose.yml `
  -f docker-compose.dev.yml `
  up -d --build --scale video-processing-service=3
```

Como cada Worker não guarda estado local permanente, o RabbitMQ distribui as mensagens entre consumidores concorrentes.
