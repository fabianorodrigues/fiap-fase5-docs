# FIAP X — Linguagem Ubíqua

## Objetivo

Estabelecer os termos que devem ser utilizados de forma consistente no código, documentação, testes, APIs e comunicação do grupo.

---

# Termos de negócio

| Termo | Definição |
|---|---|
| Usuário | Pessoa autenticada que envia e consulta vídeos. |
| Vídeo | Conteúdo enviado pelo usuário para processamento. |
| Vídeo Original | Arquivo recebido antes do processamento. |
| VideoId | Identificador único de um vídeo dentro do sistema. |
| Processamento de Vídeo | Execução que transforma um vídeo em um conjunto de imagens e gera o pacote final. |
| Imagem Extraída | Imagem produzida a partir de um ponto do vídeo. |
| Resultado | Produto final de um processamento concluído. |
| Pacote de Resultado | Arquivo ZIP contendo as imagens extraídas. |
| Status do Vídeo | Estado atual do processamento de um vídeo. |
| Recebido | Solicitação registrada e disponível para seguir no fluxo. |
| Processando | Vídeo sendo processado. |
| Concluído | Processamento finalizado com resultado disponível. |
| Erro | Processamento não concluído com sucesso. |
| Notificação de Erro | Comunicação enviada ao usuário indicando falha. |
| Download do Resultado | Obtenção do ZIP de um vídeo concluído. |

---

# Estados oficiais

Os nomes de negócio são:

```text
RECEBIDO
PROCESSANDO
CONCLUIDO
ERRO
```

Esses nomes deverão ser utilizados de maneira consistente em:

- API;
- banco;
- testes;
- documentação;
- logs de negócio.

---

# Termos técnicos

Os seguintes termos pertencem à implementação, e não ao domínio:

| Termo | Significado técnico |
|---|---|
| Presigned URL | URL temporária que permite upload/download diretamente no S3. |
| Queue | Fila utilizada para desacoplar recebimento e processamento. |
| Worker / Video Processor | Processo responsável por consumir a fila e processar vídeos. |
| DLQ | Fila usada após falhas repetidas de processamento. |
| Cache | Cópia temporária de dados para acelerar consultas. |
| Object Key | Caminho lógico de um arquivo dentro do S3. |

---

# Regras de nomenclatura

## No código

Preferir inglês:

```text
Video
VideoId
VideoStatus
VideoProcessor
ProcessingResult
OriginalObjectKey
ResultObjectKey
```

## Na documentação de negócio

Preferir português:

```text
Vídeo
Processamento
Resultado
Status
Usuário
```

## Evitar termos genéricos

Evitar nomes como:

```text
Arquivo
Item
Processo
Registro
Objeto
Job
```

quando existir um termo mais específico do domínio.
