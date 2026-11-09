# SparkTask MCP

Endpoint Streamable HTTP (stateless):

```text
POST /api/mcp
```

## Autenticação

| Cabeçalho | Obrigatório | Uso |
|-----------|-------------|-----|
| `x-api-key` | sim | Chave `spk_…` criada em **Perfil → MCP / agentes** |
| `x-spark-group-id` | não | Só se quiser validar; deve ser o mesmo grupo da chave |

O **grupo** fica atrelado à chave na criação (melhor para Claude Desktop, que aceita `x-api-key` nativamente).

## Tools

| Tool | Escopo |
|------|--------|
| `whoami` | — |
| `list_projects` | `projects:read` |
| `list_tasks` | `tasks:read` — filtros: status, projectId, ownerId, mine, search, updatedFrom/To, finishedFrom/To, dueBefore/After, orderBy, order, limit |
| `get_task` | `tasks:read` |
| `create_task` | `tasks:write` |
| `update_task_status` | `tasks:write` |
| `start_execution` | `executions:write` |
| `pause_execution` | `executions:write` |
| `finish_execution` | `executions:write` |

## Claude Desktop (`mcp-remote`)

```json
{
  "mcpServers": {
    "sparktask": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://SEU_DOMINIO/api/mcp",
        "--header",
        "x-api-key:spk_SUA_CHAVE"
      ]
    }
  }
}
```

Reinicie o Claude após salvar `claude_desktop_config.json`.

## Teste rápido (curl)

```bash
curl -s https://SEU_DOMINIO/api/mcp \
  -H "content-type: application/json" \
  -H "accept: application/json" \
  -H "x-api-key: spk_…" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"whoami\",\"arguments\":{}}}"
```

## Migração

Rodar `npm run db:migrate` (ou `db:push`) para criar a tabela `mcp_access_key`.
