import { homedir, platform } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

// Claude Desktop config paths by platform
export function getClaudeConfigPath(): string {
  const home = homedir();
  const os = platform();

  if (os === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }

  if (os === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  }

  // Linux and others
  return join(home, '.config', 'claude', 'claude_desktop_config.json');
}

// MCP servers installation path
export function getMcpServersPath(): string {
  const home = homedir();
  return join(home, '.mcp-servers');
}

export function getServerPath(serverName: string): string {
  return join(getMcpServersPath(), serverName);
}

export function getConfigPath(): string {
  return join(homedir(), '.mcpgetrc');
}

export function getCachePath(): string {
  return join(homedir(), '.cache', 'mcp-get');
}

export function getTempPath(): string {
  return join(homedir(), '.cache', 'mcp-get', 'tmp');
}

export function claudeConfigExists(): boolean {
  return existsSync(getClaudeConfigPath());
}

export function getPlatformName(): string {
  const os = platform();
  const names: Record<string, string> = {
    darwin: 'macOS',
    win32: 'Windows',
    linux: 'Linux'
  };
  return names[os] || os;
}
