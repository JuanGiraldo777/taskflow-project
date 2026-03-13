# Configurar MCP en GitHub Copilot (VS Code)

## Requisitos previos

Antes de empezar necesitas tener VS Code en versión **1.99 o posterior** — es el requisito mínimo para que MCP funcione con Copilot. Puedes comprobarlo en `Help → About`. También necesitas tener instalada la extensión de **GitHub Copilot** desde el marketplace de VS Code.

---

## Paso 1 — Crear el archivo de configuración

Crea la carpeta `.vscode` en la raíz de tu proyecto si no la tienes ya, y dentro crea el archivo `mcp.json`. La ruta final debe quedar así:

```
proyecto_practicas_CE/
└── .vscode/
    └── mcp.json
```

El formato es prácticamente idéntico al que ya configuraste en Cursor. La **única diferencia estructural** es que en VS Code la clave raíz se llama `"servers"` en lugar de `"mcpServers"`.

```json
{
  "servers": {

    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\jjbui\\Desktop\\DAM\\proyecto_practicas_CE"
      ]
    },

    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "tu-token-aqui"
      }
    },

    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },

    "duckduckgo-search": {
      "command": "npx",
      "args": ["-y", "duckduckgo-mcp-server"]
    }

  }
}
```

---

## Paso 2 — Proteger las credenciales en `.gitignore`

Antes de hacer cualquier commit, añade esta línea a tu `.gitignore`. El archivo `mcp.json` contiene tu token real de GitHub y no debe subirse nunca al repositorio.

```
.vscode/mcp.json
```

Tu `.gitignore` debería tener ahora estas dos entradas juntas, una para Cursor y otra para VS Code:

```
.cursor/mcp.json
.vscode/mcp.json
```

---

## Paso 3 — Arrancar los servidores

Una vez guardado el archivo, VS Code detectará la configuración automáticamente y mostrará un botón **"Start"** en la parte superior del propio archivo `mcp.json`. Haz clic en él para que VS Code descubra e inicialice todos los servidores. Si alguno falla en este punto, lo más probable es un token mal copiado o un problema con la ruta en Windows — recuerda que las barras invertidas deben ir dobles `\\` dentro de JSON.

---

## Paso 4 — Usar los servidores con Copilot

Abre Copilot Chat con `Ctrl+Alt+I`. Una vez abierto, selecciona el modo **Agent** en el desplegable inferior del chat — este es el modo equivalente al chat contextual de Cursor, y es el único desde el que la IA puede usar activamente las herramientas MCP. Verás un icono de herramientas donde puedes activar o desactivar cada servidor individualmente.

A partir de aquí puedes usar los servidores exactamente igual que en Cursor. Por ejemplo, puedes pedirle al chat cosas como `"lista todos los archivos JS de mi proyecto"` para probar filesystem, o `"busca las últimas novedades de Tailwind CSS"` para probar DuckDuckGo.

---

## Diferencias entre Cursor y VS Code + Copilot

| | Cursor | VS Code + Copilot |
|---|---|---|
| Archivo de config | `.cursor/mcp.json` | `.vscode/mcp.json` |
| Clave raíz del JSON | `"mcpServers"` | `"servers"` |
| Soporte MCP | Nativo desde el inicio | Desde versión 1.99 |
| Modo para usar MCP | Chat / Composer | Modo Agent |

---

## Alternativa visual — instalar servidores desde el marketplace

Si prefieres no editar JSON manualmente, puedes abrir la vista de Extensiones con `Ctrl+Shift+X` y buscar `@mcp` para ver un catálogo de servidores disponibles e instalarlos directamente desde la interfaz. Es especialmente útil cuando quieras explorar servidores nuevos en el futuro.