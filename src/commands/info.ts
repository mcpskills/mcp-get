import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { api } from '../lib/api.js';
import { getInstalledServer } from '../lib/config.js';
import { formatServerDetail, formatInstallConfig, error, info } from '../lib/ui.js';

export const infoCommand = new Command('info')
  .alias('show')
  .alias('view')
  .description('Show detailed information about an MCP server')
  .argument('<name>', 'MCP server name')
  .option('--json', 'Output as JSON')
  .action(async (name: string, options: { json?: boolean }) => {
    const spinner = ora();

    try {
      spinner.start(`Fetching info for ${chalk.cyan(name)}...`);

      const response = await api.getServer(name);

      spinner.stop();

      if (response.error || !response.data) {
        error(response.message || `MCP server '${name}' not found`);
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(response.data, null, 2));
        return;
      }

      console.log(formatServerDetail(response.data));

      // Check if installed
      const installed = getInstalledServer(name);
      if (installed) {
        console.log('\n' + chalk.green('✓') + ` Installed: v${installed.version}`);
        console.log('');
        console.log(formatInstallConfig(installed.config));

        if (response.data.latest_version && installed.version !== response.data.latest_version) {
          info(`Update available: ${installed.version} → ${response.data.latest_version}`);
        }
      }
    } catch (err) {
      spinner.fail('Failed to fetch server info');
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  });
