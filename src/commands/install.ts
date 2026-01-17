import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { installServer, installFromConfig } from '../lib/installer.js';
import { getClaudeConfigPath, getPlatformName } from '../lib/paths.js';
import { getConfig } from '../lib/config.js';
import { formatInstallConfig, success, error, info, warning } from '../lib/ui.js';

export const installCommand = new Command('install')
  .description('Install an MCP server from the registry')
  .argument('<name>', 'MCP server name')
  .option('-v, --version <version>', 'Specific version to install', 'latest')
  .option('-f, --force', 'Force reinstall if already installed')
  .option('-e, --env <key=value...>', 'Set environment variables')
  .option('--no-config', 'Do not modify Claude Desktop config')
  .action(async (name: string, options: {
    version: string;
    force?: boolean;
    env?: string[];
    config?: boolean;
  }) => {
    const spinner = ora();

    try {
      // Parse name@version format
      let serverName = name;
      let version = options.version;

      if (name.includes('@') && !name.startsWith('@')) {
        const parts = name.split('@');
        serverName = parts[0]!;
        version = parts[1] || 'latest';
      }

      // Parse environment variables
      const envVars: Record<string, string> = {};
      if (options.env) {
        for (const envStr of options.env) {
          const [key, ...valueParts] = envStr.split('=');
          if (key) {
            envVars[key] = valueParts.join('=');
          }
        }
      }

      spinner.start(`Installing ${chalk.cyan(serverName)}@${chalk.gray(version)}...`);

      const result = await installServer(serverName, version, {
        force: options.force,
        env: Object.keys(envVars).length > 0 ? envVars : undefined
      });

      if (result.success) {
        spinner.succeed(`Installed ${chalk.cyan(result.name)}@${chalk.green(result.version)}`);

        // Show required environment variables
        if (result.requiredEnv.length > 0) {
          console.log('');
          warning('Required environment variables:');
          for (const envVar of result.requiredEnv) {
            console.log(`  ${chalk.yellow(envVar)} - not set`);
          }
          console.log('');
          info(`Set these in your environment or use: mcp-get install ${serverName} --env ${result.requiredEnv[0]}=<value>`);
        }

        // Show config info
        console.log('');
        info(`Config updated: ${getClaudeConfigPath()}`);
        console.log('');
        success(`Restart Claude Desktop to activate ${result.name}!`);

      } else {
        spinner.fail(`Failed to install ${serverName}`);
        error(result.error || 'Unknown error');
        process.exit(1);
      }
    } catch (err) {
      spinner.fail('Installation failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
