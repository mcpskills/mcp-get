import Conf from 'conf';
import { getClaudeConfigPath } from './paths.js';
import type { Config, InstalledServer } from '../types.js';

const DEFAULT_API_URL = 'https://api.mcpskills.dev';

interface StoreSchema {
  token?: string;
  username?: string;
  apiUrl: string;
  configPath: string;
  installedServers: Record<string, InstalledServer>;
}

const config = new Conf<StoreSchema>({
  projectName: 'mcp-get',
  defaults: {
    apiUrl: DEFAULT_API_URL,
    configPath: getClaudeConfigPath(),
    installedServers: {}
  }
});

export function getConfig(): Config {
  return {
    token: config.get('token'),
    username: config.get('username'),
    apiUrl: config.get('apiUrl'),
    configPath: config.get('configPath')
  };
}

export function setToken(token: string, username: string): void {
  config.set('token', token);
  config.set('username', username);
}

export function clearToken(): void {
  config.delete('token');
  config.delete('username');
}

export function setApiUrl(url: string): void {
  config.set('apiUrl', url);
}

export function setConfigPath(path: string): void {
  config.set('configPath', path);
}

export function getInstalledServers(): Record<string, InstalledServer> {
  return config.get('installedServers');
}

export function addInstalledServer(server: InstalledServer): void {
  const servers = getInstalledServers();
  servers[server.name] = server;
  config.set('installedServers', servers);
}

export function removeInstalledServer(name: string): void {
  const servers = getInstalledServers();
  delete servers[name];
  config.set('installedServers', servers);
}

export function getInstalledServer(name: string): InstalledServer | undefined {
  const servers = getInstalledServers();
  return servers[name];
}

export function isAuthenticated(): boolean {
  return !!config.get('token');
}

export { config };
