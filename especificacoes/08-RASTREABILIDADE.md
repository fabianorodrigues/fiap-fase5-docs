# FIAP X — Rastreabilidade dos Requisitos

| ID | Requisito | Implementação | Evidência |
|---|---|---|---|
| RF01 | Processar mais de um vídeo ao mesmo tempo | RabbitMQ + múltiplos VideoProcessingServices | `--scale video-processing-service=2` e logs concorrentes |
| RF02 | Não perder requisição em picos | RabbitMQ durable + mensagens persistentes + ack + retry/DLQ | mensagens aguardando na fila |
| RF03 | Usuário e senha | Keycloak + JWT | login e chamada sem token retornando 401 |
| RF04 | Listagem de status por usuário | VideoManagementService + PostgreSQL + Redis | `GET /videos` com isolamento |
| RF05 | Notificação em erro | evento de falha + SMTP/Mailpit | e-mail visível no Mailpit |
| RT01 | Persistência | PostgreSQL | dados mantidos após restart das aplicações |
| RT02 | Arquitetura escalável | Processor stateless + competing consumers | múltiplas instâncias do Processor |
| RT03 | GitHub | repositório Git | link do repositório |
| RT04 | Testes | xUnit | testes executados no pipeline |
| RT05 | CI/CD | GitHub Actions + self-hosted runner | workflow de build/test/deploy |

## Cenários mínimos de demonstração

### Segurança
```text
GET /videos sem JWT
→ 401
```

### Fluxo completo
```text
POST /videos
→ upload MinIO
→ RabbitMQ
→ VideoProcessingService
→ ZIP MinIO
→ CONCLUIDO
→ download
```

### Concorrência
```bash
docker compose up -d --scale video-processing-service=2
```

### Pico
Enviar mais vídeos que o número de workers e mostrar backlog no RabbitMQ.

### Isolamento
Usuário B tentando consultar vídeo do Usuário A deve receber `404`.

### Erro
Provocar falha e mostrar:
```text
Status = ERRO
VideoProcessingFailed
e-mail no Mailpit
```

### CI/CD
Mostrar:
```text
PR -> build/test -> merge -> deploy local automático
```

## Checklist final

- [ ] Keycloak configurado
- [ ] dois usuários de demonstração
- [ ] JWT validado na VideoManagementService
- [ ] PostgreSQL persistente
- [ ] Redis utilizado
- [ ] MinIO privado
- [ ] upload por URL temporária
- [ ] RabbitMQ durable
- [ ] retry/DLQ
- [ ] VideoProcessingService com FFmpeg
- [ ] ZIP gerado
- [ ] eventos de status
- [ ] listagem por usuário
- [ ] notificação de erro
- [ ] dois processors simultâneos
- [ ] testes automatizados
- [ ] GitHub Actions
- [ ] self-hosted runner
- [ ] Docker Compose
