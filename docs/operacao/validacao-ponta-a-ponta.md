# Validação Ponta a Ponta

## Roteiro curto de demonstração

1. Subir o ambiente pelo `fiapx-infra`.
2. Validar containers com `docker compose ps`.
3. Abrir Swagger em `http://localhost:8080/swagger`.
4. Abrir Keycloak em `http://localhost:8081`.
5. Confirmar os usuários DEMO no realm `fiapx`.
6. Abrir MinIO Console em `http://localhost:9001`.
7. Abrir RabbitMQ Management em `http://localhost:15672`.
8. Importar a Collection e o Environment Postman do `fiapx-video-management`.
9. Configurar `videoFilePath` com um `.mp4`.
10. Autenticar no Keycloak.
11. Enviar `POST /videos`.
12. Fazer upload com a `uploadUrl`.
13. Consultar `GET /videos/{videoId}` até `CONCLUIDO`.
14. Chamar `GET /videos/{videoId}/download`.
15. Baixar `resultado.zip` e validar os frames PNG.
16. Enviar um arquivo inválido com extensão `.mp4` para provocar erro controlado.
17. Validar status `ERRO`, DLQ e e-mail no Mailpit.

## Postman

Arquivos versionados no repositório `fiapx-video-management`:

```text
postman/fiapx-video-management.postman_collection.json
postman/fiapx-video-management.local.postman_environment.json
```

A Collection valida:

- login real no Keycloak;
- token com claims esperadas;
- `/health`;
- criação do vídeo;
- upload real no MinIO;
- listagem e detalhe por usuário;
- caminho de cache;
- bloqueio de download antes de `CONCLUIDO`;
- respostas `400`, `401`, `404` e isolamento entre usuários.

## Script E2E integrado

No repositório `fiapx-infra`:

```powershell
.\scripts\e2e-rabbitmq.ps1 -EnvFile .\.env.example -BootstrapUsers
```

Modo por imagens:

```powershell
.\scripts\e2e-rabbitmq.ps1 -EnvFile .\.env -ImageOnly -SkipBuild -BootstrapUsers
```

O script cria vídeos sintéticos, autentica, envia uploads, baixa ZIP, exercita retry/DLQ, valida consumidores e grava evidências em:

```text
artifacts/e2e-rabbitmq-results.json
```

## Rastreabilidade dos requisitos

| ID | Requisito | Evidência na implementação |
| --- | --- | --- |
| RF01 | Processar mais de um vídeo ao mesmo tempo | `video-processing-service` escala por múltiplos consumidores da fila `video.processing` |
| RF02 | Não perder solicitações em picos | RabbitMQ durable/quorum, mensagens persistentes, ACK manual, retry e DLQ |
| RF03 | Proteger por usuário e senha | Keycloak + JWT Bearer com `sub` e `email` obrigatórios |
| RF04 | Listar status por usuário | `GET /videos` filtra por `userId` do token |
| RF05 | Notificar erro | Evento `video.processing.failed` atualiza `ERRO` e aciona SMTP/Mailpit |
| RT01 | Persistir dados | PostgreSQL guarda metadados e status |
| RT02 | Permitir escalabilidade | Worker stateless e competing consumers |
| RT03 | Versionar no GitHub | Três repositórios de aplicação e repositório de docs no GitHub |
| RT04 | Possuir testes | xUnit nos repositórios Management e Processing, CI executa testes |
| RT05 | Possuir CI/CD | GitHub Actions, GHCR e runners self-hosted para deploy local |

## Requisitos não confirmados

Não foi identificado front-end próprio, e ele também não é exigido pela especificação atual da solução. A operação prevista é por Postman/cURL.
