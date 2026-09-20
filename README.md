# fiap-fase5-docs

Documentação de arquitetura da solução FIAP X - Pós-graduação em Arquitetura de Software, FIAP Fase 5.

**Documentação publicada:** <https://fabianorodrigues.github.io/fiap-fase5-docs/>

## Estrutura

| Item | Conteúdo |
| --- | --- |
| `docs/` | Páginas publicadas pelo MkDocs |
| `mkdocs.yml` | Navegação, tema Material e extensões Markdown |
| `requirements-docs.txt` | Dependências da documentação |
| `.github/workflows/docs.yml` | Build e publicação no GitHub Pages |

## Rodar localmente com Docker

```powershell
docker run --rm `
  -p 127.0.0.1:8000:8000 `
  -v "${PWD}:/docs" `
  squidfunk/mkdocs-material:9.7.6 `
  serve -a 0.0.0.0:8000
```

O site fica disponível em <http://127.0.0.1:8000/fiap-fase5-docs/>.

## Validar build

```powershell
docker run --rm `
  -v "${PWD}:/docs" `
  squidfunk/mkdocs-material:9.7.6 `
  build --strict --site-dir /tmp/fiap-fase5-docs-site
```

## Publicação

O workflow `docs.yml` executa `mkdocs build --strict` e publica com `mkdocs gh-deploy --force`.

No GitHub, configure:

| Campo | Valor |
| --- | --- |
| Settings > Pages > Source | Deploy from a branch |
| Branch | `gh-pages` |
| Folder | `/` |

Tecnologia utilizada: MkDocs Material.
