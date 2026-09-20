# Fluxo de Sucesso

## Sequência completa

```mermaid
%%{init: {"theme": "base", "themeVariables": {"actorBkg": "#EFEFEF", "actorBorder": "#999999", "actorTextColor": "#222222", "activationBkgColor": "#E8F1F8", "activationBorderColor": "#3F6075", "signalColor": "#627282", "signalTextColor": "#1F2933", "labelBoxBkgColor": "#EEF4F2", "labelBoxBorderColor": "#00897B", "labelTextColor": "#1F2933", "noteBkgColor": "#FFF8E1", "noteBorderColor": "#A06A00", "noteTextColor": "#2F2500"}, "sequence": {"diagramMarginX": 24, "diagramMarginY": 18, "actorMargin": 42, "messageMargin": 34}} }%%
sequenceDiagram
    actor User as Usuário
    participant KC as Keycloak
    participant API as Video Management
    participant DB as PostgreSQL
    participant REDIS as Redis
    participant MINIO as MinIO
    participant MQ as RabbitMQ
    participant PROC as Video Processing
    participant FFMPEG as FFmpeg

    User->>KC: Login com usuário e senha
    KC-->>User: JWT
    User->>API: POST /videos + JWT
    API->>DB: Criar vídeo RECEBIDO
    API->>REDIS: Invalidar lista do usuário
    API-->>User: videoId + uploadUrl
    User->>MINIO: PUT videos/{userId}/{videoId}/original.mp4
    MINIO->>MQ: video.uploaded
    MQ->>PROC: Consumir video.processing
    PROC->>MQ: video.processing.started
    MQ->>API: Evento started
    API->>DB: PROCESSANDO
    API->>REDIS: Invalidar cache
    PROC->>MINIO: Baixar original.mp4
    PROC->>FFMPEG: fps=1
    FFMPEG-->>PROC: Frames PNG
    PROC->>PROC: Gerar resultado.zip
    PROC->>MINIO: PUT results/{userId}/{videoId}/resultado.zip
    PROC->>MQ: video.processing.completed
    MQ->>API: Evento completed
    API->>DB: CONCLUIDO + resultObjectKey
    API->>REDIS: Invalidar cache
    User->>API: GET /videos/{videoId}
    API-->>User: CONCLUIDO
    User->>API: GET /videos/{videoId}/download
    API-->>User: downloadUrl
    User->>MINIO: GET resultado.zip
```

## Estados

```text
RECEBIDO -> PROCESSANDO -> CONCLUIDO
```

O `resultObjectKey` persistido no PostgreSQL aponta para:

```text
results/{userId}/{videoId}/resultado.zip
```

## Resultado

O ZIP contém frames PNG gerados com nomes estáveis:

```text
frame_000001.png
frame_000002.png
...
```

O empacotador valida que o ZIP não está vazio, que os nomes seguem o padrão esperado e que cada entrada começa com assinatura PNG válida.
