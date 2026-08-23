# FIAP X — Contratos e Modelo de Dados

## 1. API HTTP

Todos os endpoints de vídeo exigem:

```http
Authorization: Bearer {jwt}
```

### POST /videos

Request:

```json
{
  "fileName": "video.mp4",
  "contentType": "video/mp4"
}
```

Response:

```json
{
  "videoId": "b520d892-2591-4910-a79c-94fb01e24670",
  "status": "RECEBIDO",
  "uploadUrl": "http://minio/...",
  "expiresInSeconds": 900
}
```

### GET /videos

Retorna somente vídeos do usuário autenticado.

### GET /videos/{videoId}

Se não existir ou pertencer a outro usuário:

```http
404 Not Found
```

### GET /videos/{videoId}/download

Disponível somente para `CONCLUIDO`.

Caso contrário:

```http
409 Conflict
```

## 2. RabbitMQ

### Solicitação de processamento

Fila:

```text
video.processing
```

Configuração:

```text
durable = true
persistent messages = true
manual acknowledgement = true
```

### Eventos publicados pelo VideoProcessingService

Exchange:

```text
video.events
```

Eventos:

```text
VideoProcessingStarted
VideoProcessingCompleted
VideoProcessingFailed
```

Exemplo de conclusão:

```json
{
  "eventId": "uuid",
  "eventType": "VideoProcessingCompleted",
  "videoId": "uuid",
  "userId": "keycloak-sub",
  "resultObjectKey": "results/keycloak-sub/uuid/resultado.zip",
  "occurredAt": "2026-08-23T12:00:30Z"
}
```

Queue consumida pela VideoManagementService:

```text
video.status-updates
```

## 3. MinIO

Vídeo original:

```text
videos/{userId}/{videoId}/original.mp4
```

Resultado:

```text
results/{userId}/{videoId}/resultado.zip
```

Buckets privados; upload/download via URLs temporárias.

## 4. PostgreSQL

```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    original_object_key VARCHAR(500) NOT NULL,
    result_object_key VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    error_message VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL,
    processing_started_at TIMESTAMPTZ,
    processing_finished_at TIMESTAMPTZ
);

CREATE INDEX ix_videos_user_created
    ON videos (user_id, created_at DESC);
```

O e-mail é capturado do JWT no momento do registro.

## 5. Redis

Chaves:

```text
video:{userId}:{videoId}
videos:{userId}
```

TTL inicial:

```text
30 segundos
```

Redis não é fonte de verdade.
