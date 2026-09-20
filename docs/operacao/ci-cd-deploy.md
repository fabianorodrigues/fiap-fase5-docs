# CI/CD e Deploy

## Estratégia geral

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 34, "rankSpacing": 46}} }%%
flowchart LR
    classDef client fill:#EFEFEF,color:#222,stroke:#999
    classDef api fill:#512BD4,color:#fff,stroke:#39208A
    classDef worker fill:#1F7A5A,color:#fff,stroke:#0F4A35
    classDef broker fill:#FF6600,color:#fff,stroke:#B34700
    classDef store fill:#2563EB,color:#fff,stroke:#1E3A8A
    classDef tool fill:#3F3F46,color:#fff,stroke:#18181B

    DEV([Desenvolvedor]):::client
    GH["GitHub<br/>repositórios"]:::store
    CI["CI<br/>GitHub-hosted"]:::api
    GHCR[("GHCR<br/>imagens SHA")]:::store
    CD["CD<br/>workflow_run"]:::broker
    GUARD["Guard<br/>anti-stale"]:::tool
    RUNNER["Self-hosted runner<br/>Windows"]:::worker
    INFRA["DEPLOY_INFRA_PATH"]:::tool
    COMPOSE["Docker Compose<br/>local"]:::worker

    DEV -->|push / PR| GH
    GH --> CI
    CI -->|build/test/validate| CI
    CI -->|serviços| GHCR
    CI -->|success em main| CD
    CD --> GUARD
    GUARD --> RUNNER
    RUNNER --> INFRA
    INFRA --> COMPOSE
```

## Repositório Infra

CI:

- roda em `ubuntu-24.04`;
- valida Compose, JSON versionado, scripts PowerShell, `.env.example`, imagens e topologia esperada.

CD:

- dispara por `workflow_run` após CI aprovado em `push` na `main`;
- usa `head_sha` do CI;
- consulta o HEAD atual da `main` para evitar deploy de commit ultrapassado;
- executa no runner self-hosted Windows com label `fiap-fase5`;
- usa `DEPLOY_INFRA_PATH` como working copy operacional;
- sobe dependências, reconcilia RabbitMQ/MinIO, roda migrations, recria Management e Processing preservando escala detectada do Worker.

## Repositórios dos serviços

CI de `fiapx-video-management` e `fiapx-video-processing`:

- restore, build e testes xUnit;
- coverage Cobertura com badge;
- build Docker;
- publicação no GHCR em `push` na `main`.

As imagens publicadas recebem tag com o SHA do commit e também `latest`. O deploy usa a tag por SHA como referência operacional.

CD dos serviços:

- dispara por `workflow_run` depois do CI aprovado;
- valida que `DEPLOY_IMAGE` termina com `DEPLOY_SHA`;
- usa lock global `Global\FiapXDeployLock`;
- atualiza apenas o serviço alvo no Compose da Infra;
- persiste `VIDEO_MANAGEMENT_IMAGE` ou `VIDEO_PROCESSING_IMAGE` no `.env` somente após validação.

## Ordem em ambiente vazio

1. `fiapx-infra`.
2. `fiapx-video-management`.
3. `fiapx-video-processing`.

A Infra cria as dependências e pode usar imagens de bootstrap quando o `.env` ainda não existe. Depois, cada serviço atualiza sua própria imagem de forma independente.

## Configuração manual necessária

Em cada repositório, configure:

```text
Settings > Secrets and variables > Actions > Variables
DEPLOY_INFRA_PATH=C:\Projetos\fiap-fase5\fiapx-infra
```

Runners esperados:

| Repositório | Runner name |
| --- | --- |
| `fiapx-infra` | `fiapx-infra-deploy` |
| `fiapx-video-management` | `fiapx-management-deploy` |
| `fiapx-video-processing` | `fiapx-processing-deploy` |

Labels:

```text
self-hosted
Windows
X64
fiap-fase5
```

Tokens, PATs e secrets reais não devem ser documentados nem versionados.
