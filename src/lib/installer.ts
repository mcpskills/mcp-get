import { api } from './api.js';
import { getConfig, addInstalledServer, removeInstalledServer, getInstalledServer } from './config.js';
import { addMcpServer, removeMcpServer, getRequiredEnvVars } from './claude-config.js';
import type { InstalledServer, DownloadResponse, MCPInstallConfig } from '../types.js';

export interface InstallResult {
  success: boolean;
  name: string;
  version: string;
  config: MCPInstallConfig;
  requiredEnv: string[];
  error?: string;
}

export async function installServer(
  name: string,
  version: string = 'latest',
  options?: { force?: boolean; env?: Record<string, string> }
): Promise<InstallResult> {
  // Check if already installed
  const existing = getInstalledServer(name);
  if (existing && !options?.force) {
    return {
      success: false,
      name,
      version: existing.version,
      config: existing.config,
      requiredEnv: [],
      error: `${name}@${existing.version} is already installed. Use --force to reinstall.`
    };
  }

  // Fetch download info
  const downloadResponse = await api.downloadServer(name, version);

  if (downloadResponse.error || !downloadResponse.data) {
    return {
      success: false,
      name,
      version,
      config: { command: '', args: [], env: {} },
      requiredEnv: [],
      error: downloadResponse.message || `Failed to fetch MCP server: ${name}`
    };
  }

  const downloadData = downloadResponse.data as DownloadResponse;
  const actualVersion = downloadData.version;

  // Build install config
  let installConfig = downloadData.install_config;

  // Override with user-provided env vars
  if (options?.env) {
    installConfig = {
      ...installConfig,
      env: { ...installConfig.env, ...options.env }
    };
  }

  // Check for required environment variables
  const requiredEnv = getRequiredEnvVars(installConfig.env);

  // Add to Claude Desktop config
  await addMcpServer(name, installConfig);

  // Record installation
  const installedServer: InstalledServer = {
    name,
    version: actualVersion,
    config: installConfig,
    installedAt: new Date().toISOString(),
    source: 'registry'
  };

  addInstalledServer(installedServer);

  return {
    success: true,
    name,
    version: actualVersion,
    config: installConfig,
    requiredEnv
  };
}

export async function removeServer(name: string): Promise<{ success: boolean; error?: string }> {
  const existing = getInstalledServer(name);

  if (!existing) {
    return { success: false, error: `MCP server '${name}' is not installed` };
  }

  // Remove from Claude Desktop config
  await removeMcpServer(name);

  // Remove from installed list
  removeInstalledServer(name);

  return { success: true };
}

export async function updateServer(name: string): Promise<InstallResult> {
  const existing = getInstalledServer(name);

  if (!existing) {
    return {
      success: false,
      name,
      version: '',
      config: { command: '', args: [], env: {} },
      requiredEnv: [],
      error: `MCP server '${name}' is not installed`
    };
  }

  // Get latest version info
  const serverResponse = await api.getServer(name);
  if (serverResponse.error || !serverResponse.data) {
    return {
      success: false,
      name,
      version: existing.version,
      config: existing.config,
      requiredEnv: [],
      error: serverResponse.message || `Failed to fetch server info`
    };
  }

  const latestVersion = serverResponse.data.latest_version;

  if (!latestVersion) {
    return {
      success: false,
      name,
      version: existing.version,
      config: existing.config,
      requiredEnv: [],
      error: 'No versions available'
    };
  }

  if (existing.version === latestVersion) {
    return {
      success: true,
      name,
      version: existing.version,
      config: existing.config,
      requiredEnv: [],
      error: 'Already at latest version'
    };
  }

  // Install new version
  return installServer(name, 'latest', { force: true });
}

export async function installFromConfig(
  name: string,
  config: MCPInstallConfig
): Promise<InstallResult> {
  // Check for required environment variables
  const requiredEnv = getRequiredEnvVars(config.env);

  // Add to Claude Desktop config
  await addMcpServer(name, config);

  // Record installation
  const installedServer: InstalledServer = {
    name,
    version: 'custom',
    config,
    installedAt: new Date().toISOString(),
    source: 'local'
  };

  addInstalledServer(installedServer);

  return {
    success: true,
    name,
    version: 'custom',
    config,
    requiredEnv
  };
}
