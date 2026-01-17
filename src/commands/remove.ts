import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { removeServer } from '../lib/installer.js';
import { getInstalledServer } from '../lib/config.js';
import { getClaudeConfigPath } from '../lib/paths.js';
import { success, error, warning, info } from '../lib/ui.js';

export const removeCommand = new Command('remove')
  .alias('uninstall')
  .alias('rm')
  .description('Remove an installed MCP server')
  .argument('<name>', 'MCP server name to remove')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (name: string, options: { yes?: boolean }) => {
    const spinner = ora();

    try {
      // Check if server is installed
      const installed = getInstalledServer(name);
      if (!installed) {
        error(`MCP server '${name}' is not installed`);
        process.exit(1);
      }

      // Confirm removal
      if (!options.yes) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Remove ${chalk.cyan(name)}@${chalk.gray(installed.version)}?`,
          default: false
        }]);

        if (!confirm) {
          warning('Removal cancelled');
          return;
        }
      }

      spinner.start(`Removing ${chalk.cyan(name)}...`);

      const result = await removeServer(name);

      if (result.success) {
        spinner.succeed(`Removed ${chalk.cyan(name)}`);
        info(`Updated: ${getClaudeConfigPath()}`);
        success('Restart Claude Desktop to apply changes');
      } else {
        spinner.fail(`Failed to remove ${name}`);
        error(result.error || 'Unknown error');
        process.exit(1);
      }
    } catch (err) {
      spinner.fail('Removal failed');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
