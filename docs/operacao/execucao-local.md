# Execução Local

## Pré-requisitos

- Docker Desktop com Docker Compose.
- Git e PowerShell.
- Os três repositórios clonados no mesmo diretório pai:

```text
C:\Projetos\fiap-fase5\
  fiapx-infra\
  fiapx-video-management\
  fiapx-video-processing\
```

## Subir ambiente integrado

No repositório `fiapx-infra`:

```powershell
Copy-Item .env.example .env
```

Para compilar os repositórios irmãos e subir a stack:

```powershell
docker compose `
  --env-file .env `
  -f docker-compose.yml `
  -f docker-compose.dev.yml `
  up -d --build
```

Para usar imagens já existentes em `VIDEO_MANAGEMENT_IMAGE` e `VIDEO_PROCESSING_IMAGE`:

```powershell
docker compose `
  --env-file .env `
  -f docker-compose.yml `
  up -d
```

## URLs locais

| Serviço | URL |
| --- | --- |
| Video Management API | `http://localhost:8080` |
| Swagger | `http://localhost:8080/swagger` |
| Keycloak | `http://localhost:8081` |
| MinIO API | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |
| RabbitMQ Management | `http://localhost:15672` |
| Mailpit | `http://localhost:8025` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Swagger é habilitado pela aplicação quando o ambiente está em `Development`, como nos Compose atuais.

## Health rápido

```powershell
docker compose --env-file .env -f docker-compose.yml ps
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8081/realms/fiapx
Invoke-RestMethod http://localhost:9000/minio/health/ready
Invoke-WebRequest http://localhost:8025 -UseBasicParsing
```

## Escalar o Worker

```powershell
docker compose `
  --env-file .env `
  -f docker-compose.yml `
  -f docker-compose.dev.yml `
  up -d --scale video-processing-service=3
```

Valide os consumidores:

```powershell
docker compose --env-file .env -f docker-compose.yml exec rabbitmq `
  rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers
```

A fila `video.processing` deve ter consumidores quando o Worker está ativo.

## Documentação local

No repositório `fiap-fase5-docs`:

```powershell
docker run --rm `
  -p 127.0.0.1:8000:8000 `
  -v "${PWD}:/docs" `
  squidfunk/mkdocs-material:9.7.6 `
  serve -a 0.0.0.0:8000
```

Abrir:

```text
http://127.0.0.1:8000/fiap-fase5-docs/
```
