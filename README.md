# mcp-get

The package manager for MCP (Model Context Protocol) servers. Install MCP servers for Claude Desktop and other MCP-compatible AI applications.

## Installation

```bash
npm install -g mcp-get
```

## Quick Start

```bash
# Search for MCP servers
mcp-get search github

# Install an MCP server
mcp-get install filesystem

# List installed servers
mcp-get list

# Show server information
mcp-get info github

# Remove a server
mcp-get remove filesystem
```

## Popular MCP Servers

| Server | Description | Install |
|--------|-------------|---------|
| `filesystem` | Secure file system access | `mcp-get install filesystem` |
| `github` | GitHub integration | `mcp-get install github` |
| `memory` | Persistent memory storage | `mcp-get install memory` |
| `brave-search` | Web search | `mcp-get install brave-search` |
| `fetch` | HTTP requests | `mcp-get install fetch` |
| `git` | Git repository tools | `mcp-get install git` |

## Commands

### `mcp-get install <name>`

Install an MCP server by name.

```bash
mcp-get install github
mcp-get install filesystem
```

### `mcp-get search <query>`

Search for MCP servers matching a query.

```bash
mcp-get search database
mcp-get search file
```

### `mcp-get list`

List all installed MCP servers.

```bash
mcp-get list
```

### `mcp-get info <name>`

Show detailed information about an MCP server.

```bash
mcp-get info github
```

### `mcp-get remove <name>`

Remove an installed MCP server.

```bash
mcp-get remove github
```

### `mcp-get update [name]`

Update installed MCP servers.

```bash
mcp-get update          # Update all
mcp-get update github   # Update specific server
```

## Configuration

mcp-get automatically configures your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

After installation, restart Claude Desktop to activate the MCP server.

## API

mcp-get uses the MCPSkills registry API at `https://api.mcpskills.dev/api/v1`

## Links

- **Website:** [mcpskills.pages.dev](https://mcpskills.pages.dev)
- **API:** [api.mcpskills.dev](https://api.mcpskills.dev/api/v1)
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **GitHub:** [github.com/mcpskills/mcp-get](https://github.com/mcpskills/mcp-get)

## License

MIT
