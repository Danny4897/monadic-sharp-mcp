# MonadicSharp MCP Server

This is a **Model Context Protocol (MCP)** server for **MonadicSharp**, a C# library for Railway-Oriented Programming (ROP) and robust AI agent development.

This MCP server provides Claude with:
1.  **Expert Knowledge**: Access to MonadicSharp documentation and patterns (`rop-basics`, `ai-patterns`) via Resources.
2.  **Code Generation**: A tool to generate idiomatic MonadicSharp snippets (`generate_monadic_snippet`).

## Installation

### Prerequisites
- Node.js (v18+)
- Claude Desktop App

### Setup

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/monadic-sharp-mcp.git
    cd monadic-sharp-mcp
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the server:
    ```bash
    npm run build
    ```
    *(Note: You can also run it directly with `npx tsx index.ts`)*

## Configuration

Add the following to your Claude Desktop configuration file:

- **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "monadic-sharp": {
      "command": "node",
      "args": [
        "/path/to/monadic-sharp-mcp/dist/index.js"
      ]
    }
  }
}
```

**Note:** If you haven't built it, you can use `tsx` directly (requires `tsx` installed globally or full path):

```json
{
  "mcpServers": {
    "monadic-sharp": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/path/to/monadic-sharp-mcp/index.ts"
      ]
    }
  }
}
```

## Features

### Resources
- `monadic-sharp://rop-basics`: Core ROP concepts (Bind, Map, Match, Result<T>).
- `monadic-sharp://ai-patterns`: AI Agent patterns (AgentResult, AiError, Retry Logic).

### Tools
- `generate_monadic_snippet`: Generates starter code for repositories, controllers, or AI steps.

## License
MIT
