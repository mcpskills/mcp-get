#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installCommand } from './commands/install.js';
import { searchCommand } from './commands/search.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { updateCommand } from './commands/update.js';
import { infoCommand } from './commands/info.js';
import { loginCommand, logoutCommand, whoamiCommand } from './commands/login.js';
import { getConfig, setConfigPath } from './lib/config.js';
import { getClaudeConfigPath, getPlatformName, claudeConfigExists } from './lib/paths.js';

const program = new Command();

program
  .name('mcp-get')
  .description('Package manager for MCP (Model Context Protocol) servers')
  .version('0.1.0')
  .configureHelp({
    sortSubcommands: true
  });

// Add commands
program.addCommand(installCommand);
program.addCommand(searchCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);
program.addCommand(updateCommand);
program.addCommand(infoCommand);
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);

// Config command
program
  .command('config')
  .description('Show or modify configuration')
  .option('--api <url>', 'Set API URL')
  .option('--config-path <path>', 'Set Claude Desktop config path')
  .option('--list', 'List all configuration')
  .action((options: { api?: string; configPath?: string; list?: boolean }) => {
    const config = getConfig();

    if (options.list || (!options.api && !options.configPath)) {
      console.log(chalk.bold('\nConfiguration:'));
      console.log(`  Platform:     ${chalk.cyan(getPlatformName())}`);
      console.log(`  Config Path:  ${config.configPath}`);
      console.log(`  Config Exists: ${claudeConfigExists() ? chalk.green('Yes') : chalk.yellow('No')}`);
      console.log(`  API URL:      ${config.apiUrl}`);
      console.log(`  Logged in:    ${config.username ? chalk.green(config.username) : chalk.gray('No')}`);
      return;
    }

    if (options.configPath) {
      setConfigPath(options.configPath);
      console.log(chalk.green('✓') + ` Config path set to ${chalk.cyan(options.configPath)}`);
    }

    if (options.api) {
      const { setApiUrl } = require('./lib/config.js');
      setApiUrl(options.api);
      console.log(chalk.green('✓') + ` API URL set to ${chalk.cyan(options.api)}`);
    }
  });

// Browse command
program
  .command('browse')
  .description('Browse all available MCP servers')
  .option('-c, --category <category>', 'Filter by category')
  .option('--featured', 'Show only featured servers')
  .action(async (options: { category?: string; featured?: boolean }) => {
    const { api } = await import('./lib/api.js');
    const { formatServerList, heading } = await import('./lib/ui.js');
    const ora = (await import('ora')).default;

    const spinner = ora('Loading MCP servers...').start();

    try {
      const result = await api.listServers({
        category: options.category,
        limit: 30
      });

      spinner.stop();

      heading('Available MCP Servers');
      console.log(formatServerList(result.data || []));
      console.log('\n' + chalk.gray('Install with: mcp-get install <name>'));
    } catch (err) {
      spinner.fail('Failed to load servers');
      console.error(err instanceof Error ? err.message : 'Unknown error');
    }
  });

// Status command - show Claude Desktop config status
program
  .command('status')
  .description('Show Claude Desktop configuration status')
  .action(async () => {
    const { listMcpServers, readClaudeConfig } = await import('./lib/claude-config.js');
    const { heading, info, warning, success } = await import('./lib/ui.js');

    heading('Claude Desktop Status');

    const configPath = getClaudeConfigPath();
    console.log(`Config Path: ${chalk.cyan(configPath)}`);

    if (!claudeConfigExists()) {
      warning('Claude Desktop config not found');
      info('Claude Desktop may not be installed or configured');
      return;
    }

    success('Config file exists');

    const servers = await listMcpServers();
    console.log(`\nMCP Servers: ${chalk.cyan(servers.length)}`);

    if (servers.length > 0) {
      console.log('');
      for (const { name, config } of servers) {
        console.log(`  ${chalk.bold(name)}`);
        console.log(`    ${chalk.gray(config.command)} ${chalk.gray(config.args.join(' '))}`);
      }
    }

    console.log('\n' + chalk.gray('Tip: Restart Claude Desktop after making changes'));
  });

// Parse and run
program.parse();
