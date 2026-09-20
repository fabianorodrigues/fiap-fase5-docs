# Decisões Arquiteturais

## Separar Management e Processing

**Contexto:** upload, status e download têm perfil HTTP; extração de frames é CPU/I/O intensiva.

**Decisão:** manter `fiapx-video-management` como API HTTP e `fiapx-video-processing` como Worker sem API HTTP.

**Consequência:** a API continua responsiva e o processamento escala por consumidores RabbitMQ. O trade-off é operar mensageria e eventos de status.

## Processamento assíncrono com RabbitMQ

**Contexto:** picos de upload não devem bloquear requisições nem perder solicitações.

**Decisão:** usar RabbitMQ com filas duráveis quorum, ACK manual, retry e DLQ.

**Consequência:** a solução assume entrega `at-least-once`; consumidores precisam ser idempotentes.

## MinIO como armazenamento de objetos

**Contexto:** vídeos e ZIPs são arquivos, não dados relacionais.

**Decisão:** guardar `original.mp4` e `resultado.zip` em MinIO, com bucket privado e URLs pré-assinadas.

**Consequência:** a API não trafega arquivo pesado no download final. O cliente envia e baixa diretamente do storage.

## PostgreSQL como fonte de verdade

**Contexto:** status, propriedade e metadados precisam sobreviver a restart e suportar isolamento por usuário.

**Decisão:** persistir o domínio de vídeos no PostgreSQL.

**Consequência:** Redis pode falhar sem perda de consistência, pois é apenas cache.

## Redis degradável

**Contexto:** listagem e consulta de vídeos são leituras recorrentes.

**Decisão:** usar Redis para cache de `videos:{userId}` e `video:{userId}:{videoId}` com TTL curto.

**Consequência:** melhora leitura local, mas a aplicação não depende do cache para manter a verdade do domínio.

## FFmpeg para extração de frames

**Contexto:** extrair frames de vídeo é um problema bem resolvido por ferramenta especializada.

**Decisão:** usar FFmpeg com filtro `fps=1` dentro do container do Worker.

**Consequência:** reduz implementação própria de mídia. O runtime do Worker precisa incluir o binário `ffmpeg`.

## Idempotência por resultado válido

**Contexto:** RabbitMQ e MinIO podem entregar eventos mais de uma vez.

**Decisão:** o Worker trata como concluído quando `resultado.zip` já existe e é válido.

**Consequência:** duplicidades não geram resultado final duplicado. Ainda é necessário validar o ZIP para evitar aceitar artefato corrompido.

## Imagens imutáveis por SHA

**Contexto:** CD precisa implantar exatamente o commit aprovado no CI.

**Decisão:** publicar imagens no GHCR com tag de commit SHA e usar essa tag no deploy.

**Consequência:** `latest` pode existir para conveniência, mas não é a referência operacional do CD.

## Self-hosted runners locais

**Contexto:** o ambiente de demonstração é Docker Compose local/acadêmico.

**Decisão:** executar CD em runners self-hosted Windows com acesso ao Docker Desktop e ao diretório `DEPLOY_INFRA_PATH`.

**Consequência:** o deploy fica compatível com ambiente local de apresentação. A disponibilidade do runner passa a fazer parte da operação.
