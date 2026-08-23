# FIAP X — Visão Geral da Solução

## 1. Objetivo

Construir do zero a nova versão do sistema de processamento de vídeos da FIAP X.

O usuário autenticado deverá conseguir enviar um vídeo, acompanhar o status do processamento e, ao final, baixar um arquivo ZIP contendo as imagens extraídas.

A solução será executada localmente com Docker Compose e terá foco em simplicidade, separação de responsabilidades e demonstração dos conceitos de arquitetura exigidos no Hackathon.

Não haverá front-end. A aplicação será utilizada por Postman ou cURL.

## 2. Requisitos obrigatórios

### Funcionais

- processar mais de um vídeo ao mesmo tempo;
- não perder solicitações em momentos de pico;
- proteger o sistema por usuário e senha;
- listar os vídeos e seus respectivos status por usuário;
- permitir notificação do usuário em caso de erro.

### Técnicos

- persistir os dados;
- permitir escalabilidade;
- versionar o projeto no GitHub;
- possuir testes;
- possuir CI/CD.

## 3. Arquitetura definida

```text
                         Keycloak
                            |
                           JWT
                            |
                            v
Postman --------------> VideoManagementService
                         |   |   \
                         |   |    \
                         v   v     v
                   PostgreSQL Redis MinIO
                                      |
                               Object Created
                                      |
                                      v
                                  RabbitMQ
                                      |
                                      v
                              VideoProcessingService
                              .NET + FFmpeg
                                      |
                                      v
                                    MinIO
```

Para completar o fluxo de status sem compartilhar o banco entre os microsserviços:

```text
VideoProcessingService
      |
      | eventos de processamento
      v
   RabbitMQ
      |
      v
  VideoManagementService
      |
      +--> PostgreSQL
      +--> Redis
```

Para atender à notificação de erro com o mínimo de infraestrutura adicional:

```text
VideoManagementService
   |
   | falha recebida
   v
 SMTP / Mailpit
```

O Mailpit será usado somente como servidor SMTP local para demonstração acadêmica.

## 4. Microsserviços

A solução terá dois microsserviços desenvolvidos pelo grupo.

### VideoManagementService

Responsável por:
- endpoints HTTP;
- autorização;
- registro do vídeo;
- listagem e consulta de status;
- geração de URLs para upload/download;
- persistência do domínio de vídeos;
- cache;
- consumo dos eventos de processamento;
- notificação de erro.

### VideoProcessingService

Responsável por:
- consumir solicitações no RabbitMQ;
- obter o vídeo no MinIO;
- processar com FFmpeg;
- gerar o ZIP;
- armazenar o resultado no MinIO;
- publicar eventos de início, conclusão e falha.

## 5. Infraestrutura local

Containers do Docker Compose:

```text
video-management-service
video-processing-service
keycloak
postgres
redis
minio
rabbitmq
mailpit
```

Somente `video-management-service` e `video-processing-service` são aplicações desenvolvidas pelo grupo.

## 6. Decisões de simplificação

Não serão utilizados:
- AWS;
- Kubernetes;
- API Gateway;
- Kafka;
- Saga Pattern;
- Outbox Pattern;
- service mesh;
- múltiplos bancos de domínio;
- microserviço próprio de autenticação;
- microserviço próprio de notificação;
- Prometheus/Grafana;
- front-end.
