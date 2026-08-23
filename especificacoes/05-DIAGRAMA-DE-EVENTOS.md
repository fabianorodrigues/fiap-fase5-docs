# FIAP X — Diagrama de Eventos

## 1. Eventos principais

```mermaid
flowchart LR
    A[VideoRegistered]
    B[ObjectCreated]
    C[VideoProcessingStarted]
    D[VideoProcessingCompleted]
    E[VideoProcessingFailed]
    F[ErrorNotificationSent]

    A --> B
    B --> C
    C -->|sucesso| D
    C -->|falha| E
    E --> F
```

## 2. Sequência de sucesso

```mermaid
sequenceDiagram
    actor User as Usuário
    participant KC as Keycloak
    participant API as VideoManagementService
    participant DB as PostgreSQL
    participant MINIO as MinIO
    participant MQ as RabbitMQ
    participant PROC as VideoProcessingService
    participant REDIS as Redis

    User->>KC: Login
    KC-->>User: JWT

    User->>API: POST /videos + JWT
    API->>DB: INSERT RECEBIDO
    API-->>User: videoId + uploadUrl

    User->>MINIO: Upload MP4
    MINIO->>MQ: ObjectCreated
    MQ->>PROC: processamento

    PROC->>MQ: VideoProcessingStarted
    MQ->>API: evento
    API->>DB: PROCESSANDO
    API->>REDIS: invalidar cache

    PROC->>MINIO: Download MP4
    PROC->>PROC: FFmpeg + ZIP
    PROC->>MINIO: Upload resultado.zip

    PROC->>MQ: VideoProcessingCompleted
    MQ->>API: evento
    API->>DB: CONCLUIDO + result key
    API->>REDIS: invalidar cache

    User->>API: GET /videos/{id}
    API-->>User: CONCLUIDO
```

## 3. Sequência de falha

```mermaid
sequenceDiagram
    participant MQ as RabbitMQ
    participant PROC as VideoProcessingService
    participant API as VideoManagementService
    participant DB as PostgreSQL
    participant MAIL as Mailpit

    MQ->>PROC: Processar vídeo
    PROC->>PROC: Falha no FFmpeg
    PROC->>MQ: VideoProcessingFailed
    MQ->>API: Evento de falha
    API->>DB: Status ERRO
    API->>MAIL: Enviar e-mail
```

## 4. Semântica

A solução assume entrega `at-least-once`.

Consequência:
- mensagens podem ser repetidas;
- consumidores devem ser idempotentes.
