# FIAP X — Contextos Delimitados

## 1. Visão geral

Para a solução proposta, o domínio será dividido em dois contextos principais de aplicação.

```text
Gestão de Vídeos
       |
       v
Processamento de Vídeos
```

Autenticação, armazenamento, mensageria, cache e notificação são capacidades técnicas/genéricas e não serão tratados como bounded contexts independentes.

---

# 2. Contexto: Gestão de Vídeos

## Responsabilidade

Gerenciar a relação do usuário com seus vídeos.

Responsabilidades:

- registrar um novo vídeo;
- associar vídeo ao usuário;
- fornecer upload;
- listar vídeos;
- consultar status;
- disponibilizar download;
- impedir acesso a vídeos de outro usuário.

## Entidades/conceitos

```text
Video
VideoId
VideoStatus
UserId
ProcessingResult
```

## Operações

```text
RegisterVideo
ListUserVideos
GetVideo
GetVideoDownload
```

## Implementação

```text
Video API
```

---

# 3. Contexto: Processamento de Vídeos

## Responsabilidade

Transformar o vídeo original em um pacote de imagens.

Responsabilidades:

- aceitar solicitações da fila;
- iniciar processamento;
- obter vídeo;
- extrair imagens;
- gerar ZIP;
- salvar resultado;
- concluir processamento;
- registrar falha.

## Conceitos

```text
VideoProcessing
ExtractedImage
ProcessingResult
ProcessingFailure
```

## Operações

```text
ProcessVideo
ExtractImages
CreateResultPackage
CompleteProcessing
FailProcessing
```

## Implementação

```text
Video Processor
```

---

# 4. Relação entre contextos

```mermaid
flowchart LR
    VM[Gestão de Vídeos]
    VP[Processamento de Vídeos]

    VM -->|Vídeo registrado e enviado| VP
    VP -->|Atualiza resultado e status| VM
```

O relacionamento é assíncrono no início do processamento.

O contexto de Gestão não chama o Processor para aguardar uma resposta.

---

# 5. Capacidades genéricas

## Identidade e Acesso

Responsável por:

- usuário;
- senha;
- token.

Implementação:

```text
Amazon Cognito
```

## Armazenamento

Implementação:

```text
Amazon S3
```

Não é domínio de negócio.

## Mensageria

Implementação:

```text
Amazon SQS
```

Não é domínio de negócio.

## Persistência

Implementação:

```text
Amazon RDS PostgreSQL
```

## Cache

Implementação:

```text
Redis
```

## Notificação

Implementação:

```text
Amazon SNS
```

---

# 6. Limites que não serão criados

Não serão criados bounded contexts específicos para:

- autenticação;
- cache;
- armazenamento;
- mensageria;
- notificação;
- observabilidade.

Essas responsabilidades não justificam serviços de domínio separados para a entrega.
