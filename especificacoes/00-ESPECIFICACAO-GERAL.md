# FIAP X — Especificação Geral do Sistema

## 1. Objetivo

Construir do zero uma nova versão do sistema de processamento de vídeos da FIAP X.

O produto deverá permitir que um usuário autenticado envie um vídeo, acompanhe o processamento e, quando concluído, faça download de um arquivo `.zip` contendo as imagens extraídas do vídeo.

A solução será desenvolvida como entrega acadêmica de Arquitetura de Software e deverá priorizar:

- atendimento integral aos requisitos obrigatórios;
- simplicidade de implementação;
- uso prático de conceitos de arquitetura;
- processamento assíncrono;
- escalabilidade horizontal;
- mensageria;
- persistência;
- cache;
- segurança;
- testes;
- CI/CD.

Não haverá front-end, pois isso não é exigido pelo enunciado. A aplicação será consumida por Postman, cURL ou ferramenta equivalente.

---

# 2. Fonte dos requisitos

## 2.1 Requisitos obrigatórios do enunciado

### RF01 — Processamento concorrente

A nova versão deve processar mais de um vídeo ao mesmo tempo.

### RF02 — Não perda de solicitações em picos

Em caso de picos, o sistema não deve perder uma solicitação de processamento.

### RF03 — Autenticação

O sistema deve ser protegido por usuário e senha.

### RF04 — Listagem de vídeos e status

O usuário deve conseguir consultar a lista de seus vídeos e acompanhar o status de cada processamento.

### RF05 — Notificação de erro

Em caso de erro, o usuário deve poder ser notificado por e-mail ou outro meio de comunicação.

### RT01 — Persistência

O sistema deve persistir os dados necessários para acompanhar os vídeos e seus processamentos.

### RT02 — Escalabilidade

A arquitetura deve permitir escalabilidade.

### RT03 — Versionamento

O projeto deve ser versionado no GitHub.

### RT04 — Qualidade

O projeto deve possuir testes que garantam sua qualidade.

### RT05 — CI/CD

A aplicação deve possuir processo de CI/CD.

---

# 3. Decisões de arquitetura do grupo

Os itens abaixo são decisões propostas para a implementação e não requisitos explícitos do PDF.

## DA01 — Cloud

A solução será executada na AWS, considerando as limitações do AWS Academy.

## DA02 — API

A entrada síncrona será exposta por Amazon API Gateway e executada por uma aplicação .NET em AWS Lambda.

## DA03 — Autenticação

Amazon Cognito será utilizado para usuário, senha e emissão de JWT.

## DA04 — Armazenamento

Amazon S3 armazenará:

- vídeo original;
- arquivo ZIP resultante.

## DA05 — Mensageria

Amazon SQS será utilizada como fila de processamento.

A SQS será responsável por absorver picos e manter solicitações pendentes até que um worker esteja disponível.

## DA06 — Processamento

O processamento será executado por um `Video Processor` em .NET, containerizado com Docker e executado no ECS Fargate.

O FFmpeg será utilizado para extração de imagens.

## DA07 — Banco

Amazon RDS PostgreSQL será utilizado como banco relacional.

## DA08 — Cache

Redis será utilizado obrigatoriamente como cache de consultas de status/listagem.

Preferência:

- Amazon ElastiCache for Redis, se disponível no AWS Academy.

Fallback acadêmico:

- Redis executado em container, sem alterar o contrato da aplicação.

O PostgreSQL continuará sendo a fonte de verdade.

## DA09 — Segredos

AWS Secrets Manager será utilizado para armazenar credenciais de banco.

## DA10 — Notificação

Amazon SNS será utilizado para notificação de falhas.

## DA11 — Observabilidade

CloudWatch Logs será suficiente para a entrega acadêmica.

## DA12 — CI/CD

GitHub Actions será utilizado para:

- build;
- testes;
- empacotamento;
- deploy.

---

# 4. Visão funcional

O fluxo principal é:

```text
Autenticar
   ↓
Registrar vídeo
   ↓
Receber URL de upload
   ↓
Enviar vídeo ao S3
   ↓
Enfileirar processamento
   ↓
Processar vídeo
   ↓
Extrair imagens
   ↓
Gerar ZIP
   ↓
Persistir resultado/status
   ↓
Consultar status
   ↓
Baixar ZIP
```

Em caso de falha:

```text
Falha de processamento
        ↓
Status = ERRO
        ↓
Persistência da falha
        ↓
Notificação ao usuário
```

---

# 5. Estados do processamento

A solução utilizará quatro estados:

```text
RECEBIDO
   ↓
PROCESSANDO
   ├────────→ CONCLUIDO
   └────────→ ERRO
```

## RECEBIDO

A solicitação foi registrada e o sistema aguarda ou iniciou o processamento assíncrono.

## PROCESSANDO

O worker está processando o vídeo.

## CONCLUIDO

O processamento terminou e o ZIP está disponível.

## ERRO

O processamento falhou.

---

# 6. Regras de negócio

## RN01 — Propriedade do vídeo

Todo vídeo pertence a exatamente um usuário.

## RN02 — Isolamento

Um usuário só pode listar, consultar e baixar seus próprios vídeos.

## RN03 — Identidade confiável

O identificador do usuário deverá ser obtido do JWT emitido pelo Cognito.

O cliente não poderá informar um `userId` para determinar a propriedade do vídeo.

## RN04 — Processamento assíncrono

O envio do vídeo não deverá aguardar o processamento terminar.

## RN05 — Concorrência

Vídeos diferentes podem ser processados simultaneamente por diferentes instâncias do Video Processor.

## RN06 — Persistência

O status do processamento deve ser persistido no PostgreSQL.

## RN07 — Download

O resultado somente poderá ser disponibilizado quando:

```text
Status = CONCLUIDO
```

## RN08 — Falha

Quando o processamento falhar:

```text
Status = ERRO
```

e uma descrição da falha deverá ser persistida.

## RN09 — Mensagem durável

Uma solicitação ainda não processada deverá permanecer na SQS.

## RN10 — Idempotência

Uma mensagem repetida da SQS não deverá gerar múltiplos resultados finais para o mesmo vídeo.

---

# 7. Regra de processamento da V1

Como decisão de implementação para tornar a entrega objetiva:

- entrada principal: MP4;
- extração: 1 imagem por segundo;
- formato das imagens: PNG;
- saída: um arquivo ZIP.

Essa regra poderá evoluir posteriormente, mas não será parametrizável nesta versão.

---

# 8. APIs previstas

```text
POST /videos
GET  /videos
GET  /videos/{videoId}
GET  /videos/{videoId}/download
```

`POST /videos` registra a solicitação e retorna uma URL pré-assinada para upload no S3.

---

# 9. Componentes desenvolvidos

A solução terá apenas dois componentes de aplicação.

## Video API

Responsável por:

- autenticação/autorização na entrada;
- registro do vídeo;
- geração de URL de upload;
- listagem;
- consulta de status;
- geração de URL de download;
- PostgreSQL;
- Redis.

## Video Processor

Responsável por:

- consumo da SQS;
- download do vídeo;
- processamento com FFmpeg;
- geração do ZIP;
- upload do resultado;
- atualização de status;
- notificação de falha.

---

# 10. Componentes que não serão criados

Para evitar complexidade desnecessária, não haverá:

- front-end;
- Kubernetes/EKS;
- Kafka;
- RabbitMQ;
- Saga Pattern;
- Outbox Pattern;
- service mesh;
- API BFF;
- serviço próprio de autenticação;
- serviço próprio de notificação;
- múltiplos bancos;
- DynamoDB;
- Prometheus;
- Grafana;
- tracing distribuído avançado.

Esses itens não são necessários para comprovar os requisitos obrigatórios desta entrega.
