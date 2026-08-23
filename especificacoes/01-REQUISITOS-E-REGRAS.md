# FIAP X — Requisitos e Regras

## 1. Requisitos funcionais

### RF01 — Processamento concorrente
A solução deve permitir que mais de um vídeo seja processado simultaneamente.

**Implementação:** múltiplas instâncias do `VideoProcessingService` consumindo a mesma fila RabbitMQ.

### RF02 — Absorção de picos
Quando a quantidade de vídeos recebidos for maior que a capacidade instantânea de processamento, nenhuma solicitação poderá ser perdida.

**Implementação:** RabbitMQ com fila durável, mensagens persistentes, acknowledgements manuais e retry/DLQ.

### RF03 — Autenticação
O sistema deve exigir usuário e senha.

**Implementação:** Keycloak. A VideoManagementService aceitará somente JWT válido.

### RF04 — Status por usuário
Um usuário deve conseguir visualizar seus vídeos e o status de cada processamento.

**Implementação:** `GET /videos`, sempre filtrado pelo usuário autenticado.

### RF05 — Notificação de falha
Em caso de erro, o usuário poderá ser notificado.

**Implementação:** e-mail SMTP enviado pela VideoManagementService após consumir `VideoProcessingFailed`. No ambiente local, o Mailpit receberá os e-mails.

## 2. Requisitos técnicos

### RT01 — Persistência
PostgreSQL será a fonte de verdade dos vídeos e seus estados.

### RT02 — Escalabilidade
O VideoProcessingService será stateless em relação à execução e poderá ter múltiplas réplicas.

```bash
docker compose up -d --scale video-processing-service=3
```

### RT03 — GitHub
Todo o código deverá ser versionado em GitHub.

### RT04 — Qualidade
Os dois microsserviços deverão possuir testes automatizados.

### RT05 — CI/CD
GitHub Actions será utilizado para CI.

O deploy local será realizado por GitHub Actions usando um self-hosted runner instalado na máquina que executa Docker Compose.

## 3. Regras de negócio

### RN01 — Propriedade
Cada vídeo pertence a exatamente um usuário.

### RN02 — Usuário autenticado
O `userId` será o claim `sub` do JWT emitido pelo Keycloak.

### RN03 — Isolamento
O usuário somente poderá consultar ou baixar vídeos cujo `user_id` seja igual ao seu `sub`.

### RN04 — Processamento assíncrono
O upload não deverá aguardar a extração das imagens.

### RN05 — Resultado
O ZIP somente poderá ser baixado quando o status for `CONCLUIDO`.

### RN06 — Erro
Um processamento que falhar deverá terminar com status `ERRO` e possuir uma mensagem sanitizada.

### RN07 — Idempotência
Mensagens duplicadas não poderão gerar resultados finais duplicados.

### RN08 — Cache
Redis é cache. PostgreSQL continua sendo a fonte de verdade.

## 4. Estados

```text
RECEBIDO
   |
   v
PROCESSANDO
   |
   +------> CONCLUIDO
   |
   +------> ERRO
```

## 5. Regra da V1

Decisão da solução:
- entrada: MP4;
- extração: 1 imagem por segundo;
- imagens: PNG;
- saída: `resultado.zip`.

Essa regra é decisão de implementação, não requisito explícito do enunciado.
