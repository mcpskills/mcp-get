import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { updateServer } from '../lib/installer.js';
import { getInstalledServers, getInstalledServer } from '../lib/config.js';
import { getClaudeConfigPath } from '../lib/paths.js';
import { success, error, info, warning } from '../lib/ui.js';

export const updateCommand = new Command('update')
  .alias('upgrade')
  .description('Update installed MCP server(s) to latest version')
  .argument('[name]', 'MCP server name to update (updates all if not specified)')
  .option('--check', 'Only check for updates, do not install')
  .action(async (name: string | undefined, options: { check?: boolean }) => {
    const spinner = ora();

    try {
      if (name) {
        // Update single server
        const installed = getInstalledServer(name);
        if (!installed) {
          error(`MCP server '${name}' is not installed`);
          process.exit(1);
        }

        spinner.start(`Checking for updates to ${chalk.cyan(name)}...`);

        const result = await updateServer(name);

        if (result.success) {
          if (result.error === 'Already at latest version') {
            spinner.info(`${chalk.cyan(name)} is already at the latest version (${result.version})`);
          } else {
            spinner.succeed(`Updated ${chalk.cyan(name)} to ${chalk.green(result.version)}`);
            info(`Updated: ${getClaudeConfigPath()}`);
            success('Restart Claude Desktop to apply changes');
          }
        } else {
          spinner.fail(`Failed to update ${name}`);
          error(result.error || 'Unknown error');
          process.exit(1);
        }
      } else {
        // Update all servers
        const servers = getInstalledServers();
        const serverList = Object.values(servers);

        if (serverList.length === 0) {
          warning('No MCP servers installed');
          return;
        }

        spinner.start('Checking for updates...');

        let updatedCount = 0;
        let errorCount = 0;

        for (const server of serverList) {
          spinner.text = `Checking ${chalk.cyan(server.name)}...`;

          const result = await updateServer(server.name);

          if (result.success) {
            if (result.error !== 'Already at latest version') {
              updatedCount++;
              success(`Updated ${chalk.cyan(server.name)} to ${chalk.green(result.version)}`);
            }
          } else {
            errorCount++;
            warning(`Failed to update ${server.name}: ${result.error}`);
          }
        }

        spinner.stop();

        if (updatedCount === 0 && errorCount === 0) {
          info('All MCP servers are up to date!');
        } else {
          if (updatedCount > 0) {
            info(`Updated: ${getClaudeConfigPath()}`);
            success(`Updated ${updatedCount} server(s). Restart Claude Desktop to apply changes.`);
          }
          if (errorCount > 0) {
            warning(`Failed to update ${errorCount} server(s)`);
          }
        }
      }
    } catch (err) {
      spinner.fail('Update failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
