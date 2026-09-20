# RabbitMQ

## Topologia

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 30, "rankSpacing": 44}} }%%
flowchart LR
    classDef api fill:#512BD4,color:#fff,stroke:#39208A
    classDef worker fill:#1F7A5A,color:#fff,stroke:#0F4A35
    classDef broker fill:#FF6600,color:#fff,stroke:#B34700
    classDef store fill:#2563EB,color:#fff,stroke:#1E3A8A
    classDef dlq fill:#3F3F46,color:#fff,stroke:#18181B
    classDef retry fill:#FFF8E1,color:#2F2500,stroke:#A06A00

    MINIO["MinIO<br/>ObjectCreated"]:::store
    PX["video.processing.exchange"]:::broker
    PQ["video.processing"]:::broker
    PRX["video.processing.retry.exchange"]:::retry
    PRQ["video.processing.retry"]:::retry
    PDLX["video.processing.dlx"]:::dlq
    PDLQ["video.processing.dlq"]:::dlq
    WORKER["Processing Worker"]:::worker

    EVX["video.events"]:::broker
    SQ["video.status-updates"]:::broker
    SRX["video.status.retry.exchange"]:::retry
    SRQ["video.status-updates.retry"]:::retry
    SDLX["video.status.dlx"]:::dlq
    SDLQ["video.status-updates.dlq"]:::dlq
    API["Management API"]:::api

    MINIO -->|video.uploaded| PX
    PX --> PQ
    PQ --> WORKER
    WORKER -->|falha transitória| PRX
    PRX --> PRQ
    PRQ -->|TTL / DLX| PX
    PQ -->|falha terminal| PDLX
    PDLX --> PDLQ

    WORKER -->|started/completed/failed| EVX
    EVX --> SQ
    SQ --> API
    API -->|falha transitória| SRX
    SRX --> SRQ
    SRQ -->|TTL / DLX| EVX
    SQ -->|contrato inválido ou retry esgotado| SDLX
    SDLX --> SDLQ
```

## Exchanges, filas e routing keys

| Exchange | Routing key | Fila | Uso |
| --- | --- | --- | --- |
| `video.processing.exchange` | `video.uploaded` | `video.processing` | Entrada do Worker |
| `video.processing.retry.exchange` | `video.uploaded` | `video.processing.retry` | Retry de processamento |
| `video.processing.dlx` | `video.processing.dlq` | `video.processing.dlq` | Falhas terminais de processamento |
| `video.events` | `video.processing.started` | `video.status-updates` | Status `PROCESSANDO` |
| `video.events` | `video.processing.completed` | `video.status-updates` | Status `CONCLUIDO` |
| `video.events` | `video.processing.failed` | `video.status-updates` | Status `ERRO` |
| `video.status.retry.exchange` | `video.processing.*` | `video.status-updates.retry` | Retry de status |
| `video.status.dlx` | `video.status.dlq` | `video.status-updates.dlq` | DLQ de status |

As filas são duráveis e do tipo quorum no ambiente integrado.

## Garantias implementadas

| Mecanismo | Confirmação na implementação |
| --- | --- |
| Entrega `at-least-once` | Policies RabbitMQ com `dead-letter-strategy: at-least-once` |
| ACK manual | Consumers usam `autoAck: false` |
| Prefetch | Configurável por `RABBITMQ_PREFETCH`, padrão efetivo `1` |
| Mensagens persistentes | Publicações de eventos/retry usam `Persistent = true`; MinIO usa delivery mode `2` |
| Publisher confirms | Canais de publicação criados com confirmações habilitadas |
| Retry | Reenvio para exchange de retry com header de tentativa e expiração |
| DLQ | `video.processing.dlq` e `video.status-updates.dlq` |

## Observações operacionais

As filas de retry usam expiração da mensagem para atrasar a reentrega. Ao expirar, a policy envia a mensagem de volta para a exchange principal.

No Compose local existe apenas um broker RabbitMQ. Quorum queues melhoram durabilidade e semântica de dead-lettering, mas não representam alta disponibilidade real sem cluster.
