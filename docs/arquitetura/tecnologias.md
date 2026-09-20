# Tecnologias

## Stack confirmada

| Categoria | Tecnologia | Uso |
| --- | --- | --- |
| Runtime | .NET 10 | API e Worker |
| API | ASP.NET Core Minimal APIs | Endpoints HTTP de vídeo |
| Persistência | PostgreSQL 17 | Fonte de verdade dos metadados |
| ORM | Entity Framework Core | Modelo `Video`, migrations e repositório |
| Cache | Redis 8 | Cache best-effort de listagem e detalhe |
| Mensageria | RabbitMQ 4.1 | Processamento assíncrono, retry e DLQ |
| Objetos | MinIO | Bucket `videos`, originais e resultados |
| Identidade | Keycloak 26.7 | Realm `fiapx`, JWT e usuários DEMO |
| E-mail local | Mailpit | Evidência de notificação de falha |
| Vídeo | FFmpeg | Extração de 1 frame por segundo |
| Empacotamento | ZIP | `resultado.zip` com PNGs |
| Entrega local | Docker Compose | Ambiente integrado e Compose isolado |
| CI/CD | GitHub Actions + GHCR | Build, testes, imagens e deploy local |
| Documentação | MkDocs Material | Site estático publicado no GitHub Pages |

## Versões e imagens

As versões são definidas nos Dockerfiles, Compose e workflows dos repositórios:

- API: `mcr.microsoft.com/dotnet/aspnet:10.0` no runtime.
- Worker: `mcr.microsoft.com/dotnet/runtime:10.0` no runtime e instalação de `ffmpeg`.
- PostgreSQL: `postgres:17-alpine`.
- Redis: `redis:8-alpine`.
- RabbitMQ: `rabbitmq:4.1.8-management`.
- Keycloak: `quay.io/keycloak/keycloak:26.7.1`.
- Mailpit: `axllent/mailpit:v1.22.3`.
- MinIO e MinIO Client: imagens fixadas por digest no Compose integrado.

## O que não foi encontrado

A implementação atual não usa:

- Kubernetes;
- API Gateway;
- Kafka;
- front-end próprio;
- banco compartilhado entre Management e Worker;
- processamento síncrono dentro da API;
- provider cloud obrigatório.
