<section class="fiapx-hero" markdown="1">
<p class="fiapx-eyebrow">FIAP X - Fase 5</p>

# Arquitetura FIAP X

<p class="fiapx-lead">
Documentação publicável da solução de processamento assíncrono de vídeos da FIAP X.
A solução permite que um usuário autenticado envie um vídeo MP4, acompanhe o status
e baixe um `resultado.zip` com frames PNG extraídos pelo FFmpeg.
</p>

<div class="fiapx-pill-row">
  <span>.NET 10</span>
  <span>Keycloak</span>
  <span>PostgreSQL</span>
  <span>Redis</span>
  <span>MinIO</span>
  <span>RabbitMQ</span>
  <span>FFmpeg</span>
  <span>Docker Compose</span>
</div>
</section>

## Visão rápida

O FIAP X não possui front-end próprio. A jornada é executada por Postman ou cURL: o usuário autentica no Keycloak, chama a API de gestão, envia o arquivo diretamente ao MinIO por URL pré-assinada e acompanha o status até o processamento terminar.

```mermaid
flowchart LR
    USER([Cliente / Postman])
    KC[Keycloak]
    API[Video Management Service]
    PG[(PostgreSQL)]
    REDIS[(Redis)]
    MINIO[(MinIO bucket videos)]
    MQ[RabbitMQ]
    WORKER[Video Processing Service]
    FFMPEG[FFmpeg]
    MAIL[Mailpit]

    USER -->|login| KC
    KC -->|JWT| USER
    USER -->|POST /videos| API
    API --> PG
    API -. cache .-> REDIS
    API -->|presigned upload/download| MINIO
    USER -->|PUT original.mp4| MINIO
    MINIO -->|ObjectCreated video.uploaded| MQ
    MQ -->|video.processing| WORKER
    WORKER --> FFMPEG
    WORKER -->|resultado.zip| MINIO
    WORKER -->|started/completed/failed| MQ
    MQ -->|video.status-updates| API
    API -. falha .-> MAIL
```

## Repositórios

<table class="fiapx-repos">
  <thead>
    <tr>
      <th>Repositório</th>
      <th>Responsabilidade</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>fiapx-infra</code></td>
      <td>Compose integrado, PostgreSQL, Redis, RabbitMQ, MinIO, Keycloak, Mailpit, bootstrap, health checks e deploy da stack.</td>
    </tr>
    <tr>
      <td><code>fiapx-video-management</code></td>
      <td>API HTTP, JWT, registro de vídeos, URLs pré-assinadas, status, cache, download e notificação de erro.</td>
    </tr>
    <tr>
      <td><code>fiapx-video-processing</code></td>
      <td>Worker assíncrono, consumo RabbitMQ, download MinIO, FFmpeg, ZIP, upload de resultado, retry, DLQ e eventos de status.</td>
    </tr>
  </tbody>
</table>

Links:

- [fiapx-infra](https://github.com/fabianorodrigues/fiapx-infra)
- [fiapx-video-management](https://github.com/fabianorodrigues/fiapx-video-management)
- [fiapx-video-processing](https://github.com/fabianorodrigues/fiapx-video-processing)
- [fiap-fase5-docs](https://github.com/fabianorodrigues/fiap-fase5-docs)

## Caminhos de leitura

<div class="fiapx-nav-grid">
  <a class="fiapx-card" href="arquitetura/visao-geral/">
    <div>
      <h3>Entender a arquitetura</h3>
      <p>Comece pela visão geral, componentes e comunicação entre serviços.</p>
    </div>
    <span class="fiapx-card__action">Abrir arquitetura</span>
  </a>
  <a class="fiapx-card" href="fluxos/upload-processamento/">
    <div>
      <h3>Seguir o fluxo principal</h3>
      <p>Veja upload, processamento assíncrono, sucesso e erro.</p>
    </div>
    <span class="fiapx-card__action">Abrir fluxos</span>
  </a>
  <a class="fiapx-card" href="operacao/validacao-ponta-a-ponta/">
    <div>
      <h3>Validar a entrega</h3>
      <p>Use o roteiro de demonstração e a rastreabilidade dos requisitos.</p>
    </div>
    <span class="fiapx-card__action">Abrir validação</span>
  </a>
</div>

## Estados do vídeo

```mermaid
stateDiagram-v2
    [*] --> RECEBIDO: POST /videos
    RECEBIDO --> PROCESSANDO: video.processing.started
    PROCESSANDO --> CONCLUIDO: video.processing.completed
    PROCESSANDO --> ERRO: video.processing.failed
    RECEBIDO --> CONCLUIDO: completed idempotente
    RECEBIDO --> ERRO: failed idempotente
```

O PostgreSQL é a fonte de verdade dos estados. O Redis é usado como cache degradável para listagem e detalhe.
