# Comunicação e Integração

## Mapa de comunicação

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 34, "rankSpacing": 46}} }%%
flowchart LR
    classDef client fill:#EFEFEF,color:#222,stroke:#999
    classDef api fill:#512BD4,color:#fff,stroke:#39208A
    classDef worker fill:#1F7A5A,color:#fff,stroke:#0F4A35
    classDef broker fill:#FF6600,color:#fff,stroke:#B34700
    classDef store fill:#2563EB,color:#fff,stroke:#1E3A8A
    classDef auth fill:#6D28D9,color:#fff,stroke:#4C1D95
    classDef mail fill:#3F3F46,color:#fff,stroke:#18181B

    USER([Cliente]):::client
    KC["Keycloak<br/>OIDC"]:::auth
    API["Management API<br/>HTTP"]:::api
    PG[("PostgreSQL<br/>SQL")]:::store
    REDIS[("Redis<br/>cache")]:::store
    MINIO[("MinIO<br/>S3")]:::store
    MQ["RabbitMQ<br/>AMQP"]:::broker
    WORKER["Processing Worker<br/>.NET"]:::worker
    MAIL["Mailpit<br/>SMTP"]:::mail

    USER -->|HTTP token password grant| KC
    USER -->|HTTP JWT| API
    API -->|SQL| PG
    API -. Redis protocol .-> REDIS
    API -->|S3 presigned URL| MINIO
    USER -->|HTTP PUT direto| MINIO
    MINIO -->|AMQP event| MQ
    WORKER -->|AMQP consume manual ACK| MQ
    WORKER -->|S3 GET/PUT| MINIO
    WORKER -->|AMQP publish confirms| MQ
    API -->|AMQP consume manual ACK| MQ
    API -. SMTP .-> MAIL
```

## Contratos HTTP

Todos os endpoints `/videos` exigem `Authorization: Bearer <access_token>`.

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/health` | Health check da API |
| `POST` | `/videos` | Cria registro `RECEBIDO` e retorna `uploadUrl` |
| `GET` | `/videos` | Lista vídeos do usuário autenticado |
| `GET` | `/videos/{videoId}` | Consulta status e metadados do vídeo |
| `GET` | `/videos/{videoId}/download` | Retorna `downloadUrl` quando status é `CONCLUIDO` |

Restrições confirmadas:

- `POST /videos` aceita apenas `fileName` com extensão `.mp4`.
- `contentType` deve ser `video/mp4`.
- Download antes de `CONCLUIDO` retorna conflito.
- Vídeos inexistentes ou de outro usuário retornam `404`.

## Eventos entre serviços

| Origem | Destino | Canal | Evento |
| --- | --- | --- | --- |
| MinIO | RabbitMQ | `video.processing.exchange` | `video.uploaded` |
| RabbitMQ | Worker | `video.processing` | Notificação MinIO `ObjectCreated` |
| Worker | RabbitMQ | `video.events` | `video.processing.started` |
| Worker | RabbitMQ | `video.events` | `video.processing.completed` |
| Worker | RabbitMQ | `video.events` | `video.processing.failed` |
| RabbitMQ | API | `video.status-updates` | Eventos de status |

## Semântica

A solução opera com entrega `at-least-once`. Por isso, consumidores precisam aceitar duplicidade:

- o Worker verifica se `resultado.zip` já existe e é válido antes de processar e antes de fazer upload;
- a API trata eventos repetidos como idempotentes quando o estado já reflete o evento;
- ACK manual só ocorre após o tratamento ou publicação de retry;
- falhas terminais seguem para DLQ.
