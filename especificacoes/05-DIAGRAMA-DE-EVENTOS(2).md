# FIAP X — Diagrama de Eventos do Sistema

## 1. Objetivo

Representar os principais acontecimentos do fluxo, sem transformar toda alteração interna em evento de integração.

---

# 2. Fluxo de eventos

```mermaid
flowchart LR
    U[Usuário autenticado]

    A[Vídeo Registrado]
    B[Vídeo Enviado]
    C[Processamento Solicitado]
    D[Processamento Iniciado]
    E[Processamento Concluído]
    F[Processamento Falhou]
    G[Resultado Disponível]
    H[Usuário Notificado]

    U -->|Registra vídeo| A
    A -->|Upload| B
    B -->|S3 ObjectCreated → SQS| C
    C -->|Worker consome| D

    D -->|Sucesso| E
    E --> G

    D -->|Erro| F
    F --> H
```

---

# 3. Eventos de negócio

## Vídeo Registrado

O sistema criou um `VideoId`, associou o vídeo ao usuário e definiu:

```text
Status = RECEBIDO
```

## Processamento Iniciado

O Video Processor assumiu o processamento.

```text
Status = PROCESSANDO
```

## Processamento Concluído

O ZIP foi criado e armazenado.

```text
Status = CONCLUIDO
```

## Processamento Falhou

A execução não conseguiu produzir o resultado.

```text
Status = ERRO
```

## Resultado Disponível

O vídeo possui um `resultObjectKey` válido e pode ser baixado.

---

# 4. Evento técnico de integração

A comunicação assíncrona principal será:

```text
S3 ObjectCreated
       ↓
      SQS
       ↓
Video Processor
```

Não será criado um Event Bus genérico.

O evento nativo do S3 é suficiente para sinalizar que existe um vídeo pronto para processamento.

---

# 5. Fluxo de sucesso

```mermaid
sequenceDiagram
    actor User as Usuário
    participant API as Video API
    participant S3 as Amazon S3
    participant SQS as Amazon SQS
    participant Worker as Video Processor
    participant DB as PostgreSQL

    User->>API: Registrar vídeo
    API->>DB: INSERT status RECEBIDO
    API-->>User: videoId + presigned upload URL

    User->>S3: Upload do vídeo
    S3->>SQS: ObjectCreated
    SQS->>Worker: Mensagem

    Worker->>DB: Status PROCESSANDO
    Worker->>S3: Download vídeo
    Worker->>Worker: FFmpeg + ZIP
    Worker->>S3: Upload resultado.zip
    Worker->>DB: Status CONCLUIDO

    User->>API: Consultar status
    API->>DB: Consultar vídeo
    API-->>User: CONCLUIDO
```

---

# 6. Fluxo de falha

```mermaid
sequenceDiagram
    participant SQS as Amazon SQS
    participant Worker as Video Processor
    participant DB as PostgreSQL
    participant SNS as Amazon SNS

    SQS->>Worker: Solicitação de processamento
    Worker->>DB: Status PROCESSANDO
    Worker->>Worker: Falha
    Worker->>DB: Status ERRO
    Worker->>SNS: Publicar notificação
    Worker--xSQS: Processamento não confirmado
```

A SQS poderá realizar nova tentativa.

Após atingir o limite definido, a mensagem será enviada para DLQ.
