# FIAP X — Rastreabilidade dos Requisitos

## Objetivo

Demonstrar de maneira objetiva onde cada requisito obrigatório é atendido.

| ID | Requisito | Solução | Evidência esperada |
|---|---|---|---|
| RF01 | Processar mais de um vídeo ao mesmo tempo | SQS + múltiplas tasks do Video Processor no ECS | dois vídeos sendo processados simultaneamente |
| RF02 | Não perder requisições em picos | SQS + retry + DLQ | backlog na fila enquanto workers estão ocupados |
| RF03 | Proteção por usuário e senha | Amazon Cognito + JWT + API Gateway | chamada sem token retorna 401 |
| RF04 | Listagem de status dos vídeos do usuário | `GET /videos` + PostgreSQL + Redis | usuário consulta somente seus vídeos |
| RF05 | Usuário pode ser notificado em caso de erro | Amazon SNS | e-mail de erro durante demonstração |
| RT01 | Persistir dados | Amazon RDS PostgreSQL | registros de vídeo/status persistidos |
| RT02 | Arquitetura escalável | Lambda + SQS + ECS horizontal | execução de mais de um worker |
| RT03 | Versionamento GitHub | GitHub | repositório da solução |
| RT04 | Testes | xUnit + testes de integração | pipeline executa testes |
| RT05 | CI/CD | GitHub Actions | workflows de API e Processor |

---

# Cenários mínimos de demonstração

## Cenário 1 — Autenticação

```text
Sem JWT
→ API
→ 401
```

Depois:

```text
Login
→ JWT
→ API
→ sucesso
```

---

## Cenário 2 — Processamento completo

```text
Registrar vídeo
→ Upload
→ SQS
→ PROCESSANDO
→ CONCLUIDO
→ Download ZIP
```

---

## Cenário 3 — Concorrência

Enviar pelo menos dois vídeos e utilizar duas instâncias do Processor.

Evidenciar em logs:

```text
videoId A - PROCESSANDO
videoId B - PROCESSANDO
```

com períodos sobrepostos.

---

## Cenário 4 — Pico

Inserir mais mensagens do que workers disponíveis.

Demonstrar que:

```text
mensagens aguardam na SQS
```

e são processadas posteriormente.

---

## Cenário 5 — Isolamento de usuário

```text
Usuário A possui Video X
Usuário B consulta Video X
→ 404
```

---

## Cenário 6 — Erro

Forçar um vídeo inválido ou falha controlada.

Resultado:

```text
Status = ERRO
SNS acionado
log registrado
```

---

# Checklist antes da entrega

- [ ] Autenticação por usuário e senha funcionando
- [ ] JWT protegendo endpoints
- [ ] Upload por presigned URL
- [ ] Vídeo original no S3
- [ ] Evento chegando à SQS
- [ ] Video Processor consumindo fila
- [ ] Dois vídeos processados simultaneamente
- [ ] Mensagens aguardando fila quando necessário
- [ ] DLQ configurada
- [ ] PostgreSQL persistindo status
- [ ] Redis sendo utilizado
- [ ] ZIP sendo criado
- [ ] Resultado armazenado no S3
- [ ] Listagem por usuário funcionando
- [ ] Download somente para CONCLUIDO
- [ ] SNS notificando falha
- [ ] Secrets Manager utilizado
- [ ] Testes automatizados
- [ ] GitHub Actions
- [ ] Código no GitHub
- [ ] Documentação de arquitetura
- [ ] Script/migration de banco
