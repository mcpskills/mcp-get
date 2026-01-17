import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { getClaudeConfigPath } from './paths.js';
import type { ClaudeDesktopConfig, MCPInstallConfig } from '../types.js';

export async function readClaudeConfig(): Promise<ClaudeDesktopConfig> {
  const configPath = getClaudeConfigPath();

  if (!existsSync(configPath)) {
    return { mcpServers: {} };
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { mcpServers: {} };
  }
}

export async function writeClaudeConfig(config: ClaudeDesktopConfig): Promise<void> {
  const configPath = getClaudeConfigPath();

  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function addMcpServer(
  name: string,
  installConfig: MCPInstallConfig
): Promise<void> {
  const config = await readClaudeConfig();

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers[name] = {
    command: installConfig.command,
    args: installConfig.args.length > 0 ? installConfig.args : undefined,
    env: Object.keys(installConfig.env).length > 0 ? installConfig.env : undefined
  };

  await writeClaudeConfig(config);
}

export async function removeMcpServer(name: string): Promise<boolean> {
  const config = await readClaudeConfig();

  if (!config.mcpServers || !config.mcpServers[name]) {
    return false;
  }

  delete config.mcpServers[name];
  await writeClaudeConfig(config);
  return true;
}

export async function getMcpServer(name: string): Promise<MCPInstallConfig | null> {
  const config = await readClaudeConfig();

  if (!config.mcpServers || !config.mcpServers[name]) {
    return null;
  }

  const server = config.mcpServers[name];
  return {
    command: server.command,
    args: server.args || [],
    env: server.env || {}
  };
}

export async function listMcpServers(): Promise<Array<{ name: string; config: MCPInstallConfig }>> {
  const config = await readClaudeConfig();

  if (!config.mcpServers) {
    return [];
  }

  return Object.entries(config.mcpServers).map(([name, server]) => ({
    name,
    config: {
      command: server.command,
      args: server.args || [],
      env: server.env || {}
    }
  }));
}

export function resolveEnvVariables(env: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    // Check if value is an environment variable reference like ${VAR_NAME}
    const match = value.match(/^\$\{(.+)\}$/);
    if (match) {
      const envVar = match[1];
      resolved[key] = process.env[envVar!] || value;
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

export function getRequiredEnvVars(env: Record<string, string>): string[] {
  const required: string[] = [];

  for (const value of Object.values(env)) {
    const match = value.match(/^\$\{(.+)\}$/);
    if (match && !process.env[match[1]!]) {
      required.push(match[1]!);
    }
  }

  return required;
}
