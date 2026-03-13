# Configurar MCP en Cursor

## Paso 1 — Crear la estructura de carpetas y el archivo MCP

Abre la terminal integrada de Cursor y ejecuta esto:

Crear la carpeta .cursor en la raíz del proyecto

**mkdir .cursor**

Luego crea el archivo **.cursor/mcp.json** con este contenido exacto, sustituyendo solo el token:
json{
  "mcpServers": {

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

    "duckduckgo-search": {
      "command": "npx",
      "args": ["-y", "duckduckgo-mcp-server"]
    }

  }
}
Fíjate que en Windows las rutas usan \\ doble barra invertida dentro de JSON — esto es porque en JSON la barra invertida \ es un carácter especial que necesita escaparse. Si pones solo \ el archivo JSON será inválido y los servidores no arrancarán.

## Paso 2 — Verificar que funciona

Cierra Cursor completamente y vuélvelo a abrir. Esto es importante porque Cursor lee el archivo mcp.json solo al arrancar. Una vez abierto ve a **File → Preferences → Cursor Settings** y busca la sección MCP en el menú izquierdo. Deberías ver tus cuatro servidores listados. Si aparecen en verde están activos y funcionando. Si alguno aparece en rojo, el problema más común es o bien el token mal copiado o bien las barras invertidas en la ruta.

## Paso 3 — Probar que realmente funcionan

Una vez todo esté en verde, abre el chat con Ctrl+L y prueba cada servidor con una pregunta concreta. Para filesystem puedes preguntarle "lista todos los archivos JS de mi proyecto". Para GitHub puedes decirle "muéstrame los últimos commits de mi repositorio". Para DuckDuckGo prueba "busca las últimas novedades de Tailwind CSS". Para Fetch puedes pedirle "obtén el contenido de esta URL" con cualquier URL pública.

## Explicacion de casos que es util en un proyecto real

MCP en proyectos reales — Cuándo tiene sentido y cuándo no
Para entender cuándo MCP aporta valor real, primero hay que entender el problema que resuelve. Sin MCP, la IA vive en una burbuja — tú le copias código, le pegas errores, le describes contexto, y ella te responde. Tú eres el intermediario entre la IA y el mundo real. MCP elimina ese intermediario.

**Caso 1 — Proyecto con base de datos**

Imagina que estás desarrollando una aplicación con PostgreSQL y tienes un bug en producción. Un usuario reporta que sus tareas no se guardan correctamente. Sin MCP tendrías que ir a tu cliente de base de datos, lanzar queries manualmente, copiar los resultados y pegárselos a la IA para que los analice. Con el servidor MCP de PostgreSQL configurado en Cursor, simplemente escribes en el chat "analiza la tabla de tareas del usuario con id 42 y dime si hay inconsistencias" y la IA lanza la query, recibe los datos y te da un diagnóstico directo. El flujo pasa de ser 5 pasos manuales a 1 instrucción en lenguaje natural.

**Caso 2 — Gestión del repositorio durante el desarrollo**

Este es especialmente relevante para tu situación en prácticas. Imagina que terminas una feature en TaskFlow y quieres documentarla bien en GitHub. Con el servidor MCP de GitHub configurado, puedes decirle a Cursor "crea un issue describiendo la funcionalidad de filtrado de tareas que acabo de implementar" o "genera un Pull Request con una descripción detallada de los cambios en app.js". La IA conoce tu código gracias al servidor filesystem, conoce tu repositorio gracias al servidor GitHub, y puede conectar ambas cosas para generar documentación técnica precisa sin que tú escribas nada manualmente.

**Caso 3 — Proyectos que consumen APIs externas**

Supón que TaskFlow en el futuro va a conectarse con una API REST para sincronizar tareas. Durante el desarrollo necesitas constantemente verificar qué devuelve esa API, si los datos tienen el formato correcto, si hay errores en los endpoints. Con el servidor MCP de Fetch configurado, puedes pedirle a Cursor "haz una petición GET a este endpoint y dime si la respuesta tiene la estructura que necesito para renderizarla en mi lista de tareas". La IA ejecuta la petición real, analiza la respuesta y te dice exactamente cómo mapear esos datos a tu código, todo sin cambiar de herramienta.

**Caso 4 — Proyectos grandes con mucha documentación técnica**

En empresas reales es muy común tener documentación dispersa — Confluence, Notion, Google Drive, Slack. Sin MCP, cada vez que necesitas contexto tienes que buscarlo manualmente y pegárselo a la IA. Con los servidores MCP de Notion o Google Drive configurados, la IA puede buscar directamente en tu documentación interna. Imagina decirle "según nuestra documentación de arquitectura, cómo debería estructurar este nuevo módulo" y que ella lea los docs reales de tu empresa antes de responderte.

**Caso 5 — Tu proyecto TaskFlow específicamente**

En tu caso concreto, la combinación que configuraste tiene un flujo muy práctico. El servidor filesystem lee tu código real cuando le haces preguntas, el servidor GitHub gestiona tu historial y te ayuda a documentar, y DuckDuckGo te permite buscar soluciones técnicas sin salir de Cursor. El resultado es que Cursor deja de ser un asistente que responde preguntas y se convierte en un agente que actúa — lee, busca, modifica y documenta dentro de tu flujo de trabajo real.