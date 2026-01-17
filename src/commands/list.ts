import { Command } from 'commander';
import chalk from 'chalk';
import { getInstalledServers } from '../lib/config.js';
import { listMcpServers } from '../lib/claude-config.js';
import { getClaudeConfigPath, claudeConfigExists } from '../lib/paths.js';
import { formatInstalledServerList, heading, info, warning } from '../lib/ui.js';
import type { InstalledServer } from '../types.js';

export const listCommand = new Command('list')
  .alias('ls')
  .description('List installed MCP servers')
  .option('--json', 'Output as JSON')
  .option('--config', 'Show servers from Claude Desktop config')
  .action(async (options: { json?: boolean; config?: boolean }) => {
    if (options.config) {
      // List servers from Claude Desktop config
      if (!claudeConfigExists()) {
        warning('Claude Desktop config not found');
        info(`Expected at: ${getClaudeConfigPath()}`);
        return;
      }

      const servers = await listMcpServers();

      if (options.json) {
        console.log(JSON.stringify(servers, null, 2));
        return;
      }

      heading('MCP Servers in Claude Desktop Config');

      if (servers.length === 0) {
        warning('No MCP servers configured');
        info(`Install servers with: ${chalk.green('mcp-get install <name>')}`);
        return;
      }

      for (const { name, config } of servers) {
        console.log(chalk.bold.cyan(name));
        console.log(chalk.gray(`   ${config.command} ${config.args.join(' ')}`));
        if (Object.keys(config.env).length > 0) {
          console.log(chalk.gray(`   env: ${Object.keys(config.env).join(', ')}`));
        }
        console.log('');
      }

      console.log(chalk.gray(`Config file: ${getClaudeConfigPath()}`));
      return;
    }

    // List servers from mcp-get tracking
    const servers = getInstalledServers();
    const serverList = Object.values(servers);

    if (options.json) {
      console.log(JSON.stringify(serverList, null, 2));
      return;
    }

    heading('Installed MCP Servers');

    console.log(formatInstalledServerList(serverList));

    if (serverList.length > 0) {
      console.log('\n' + chalk.gray(`Config file: ${getClaudeConfigPath()}`));
    } else {
      info(`Install servers with: ${chalk.green('mcp-get install <name>')}`);
    }
  });
