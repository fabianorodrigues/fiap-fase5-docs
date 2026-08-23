# FIAP X — CI/CD com Docker Compose Local

## 1. Estratégia

```text
Developer
   |
   v
GitHub
   |
   v
GitHub Actions
   |
   +--> CI
   |     ├── restore
   |     ├── build
   |     ├── tests
   |     └── docker build
   |
   +--> CD
         |
         v
 Self-hosted Runner
 máquina local
         |
         v
 docker compose
```

## 2. Continuous Integration

Executada em GitHub-hosted runner.

Fluxo:

```text
checkout
   ↓
dotnet restore
   ↓
dotnet build
   ↓
dotnet test
   ↓
docker build
```

Cada microsserviço deverá ser compilável e testável independentemente.

## 3. Continuous Deployment local

Após merge na `main`:

```text
CI concluído
   ↓
job de deploy
   ↓
self-hosted runner
   ↓
checkout
   ↓
docker compose build
   ↓
docker compose up -d
```

## 4. Pipelines sugeridos

```text
ci-video-management-service.yml
ci-video-processing-service.yml
deploy-local.yml
```

## 5. Proteções

Não executar deploy se:
- build falhar;
- testes falharem;
- imagem Docker falhar.

## 6. Segredos

Não versionar credenciais.

Usar:
- `.env` local fora do Git;
- GitHub Actions Secrets para pipeline.

## 7. Evidência para apresentação

Mostrar:
1. Pull Request;
2. workflow de build/testes;
3. merge;
4. self-hosted runner executando deploy;
5. `docker compose ps`;
6. aplicação atualizada.
