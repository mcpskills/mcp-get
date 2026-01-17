import chalk from 'chalk';
import type { PackageResponse, InstalledServer, MCPInstallConfig } from '../types.js';

export function formatServer(server: PackageResponse, index?: number): string {
  const lines: string[] = [];

  const prefix = index !== undefined ? `${chalk.gray(`${index + 1}.`)} ` : '';
  const name = chalk.bold.cyan(server.name);
  const version = server.latest_version ? chalk.gray(`@${server.latest_version}`) : '';
  const verified = server.verified ? chalk.green(' ✓') : '';
  const featured = server.featured ? chalk.yellow(' ★') : '';

  lines.push(`${prefix}${name}${version}${verified}${featured}`);

  if (server.description) {
    const desc = server.description.length > 80
      ? server.description.slice(0, 77) + '...'
      : server.description;
    lines.push(chalk.gray(`   ${desc}`));
  }

  const meta: string[] = [];
  if (server.author) {
    meta.push(`by ${chalk.blue(server.author.username)}`);
  }
  if (server.downloads > 0) {
    meta.push(`${formatNumber(server.downloads)} downloads`);
  }
  if (server.rating) {
    meta.push(`${server.rating.toFixed(1)}★`);
  }

  if (meta.length > 0) {
    lines.push(chalk.gray(`   ${meta.join(' • ')}`));
  }

  return lines.join('\n');
}

export function formatServerList(servers: PackageResponse[]): string {
  if (servers.length === 0) {
    return chalk.yellow('No MCP servers found.');
  }

  return servers.map((server, i) => formatServer(server, i)).join('\n\n');
}

export function formatInstalledServer(server: InstalledServer): string {
  const name = chalk.bold.cyan(server.name);
  const version = chalk.gray(`@${server.version}`);
  const command = chalk.gray(`${server.config.command} ${server.config.args.join(' ')}`);

  return `${name}${version}\n   ${command}`;
}

export function formatInstalledServerList(servers: InstalledServer[]): string {
  if (servers.length === 0) {
    return chalk.yellow('No MCP servers installed.');
  }

  return servers.map(formatInstalledServer).join('\n\n');
}

export function formatServerDetail(server: PackageResponse): string {
  const lines: string[] = [];

  // Header
  const verified = server.verified ? chalk.green(' ✓ Verified') : '';
  const featured = server.featured ? chalk.yellow(' ★ Featured') : '';
  lines.push(chalk.bold.cyan(server.name) + chalk.gray(`@${server.latest_version || 'unknown'}`) + verified + featured);
  lines.push('');

  // Description
  if (server.description) {
    lines.push(server.description);
    lines.push('');
  }

  // Metadata table
  lines.push(chalk.bold('Details:'));
  if (server.author) {
    lines.push(`  Author:     ${chalk.blue(server.author.username)} (${server.author.trust_tier})`);
  }
  lines.push(`  License:    ${server.license}`);
  lines.push(`  Downloads:  ${formatNumber(server.downloads)}`);
  if (server.rating) {
    lines.push(`  Rating:     ${server.rating.toFixed(1)} ★ (${server.rating_count} ratings)`);
  }
  if (server.category) {
    lines.push(`  Category:   ${server.category}`);
  }
  if (server.repository) {
    lines.push(`  Repository: ${chalk.underline(server.repository)}`);
  }
  if (server.homepage) {
    lines.push(`  Homepage:   ${chalk.underline(server.homepage)}`);
  }

  // Keywords
  if (server.keywords && server.keywords.length > 0) {
    lines.push('');
    lines.push(chalk.bold('Keywords:'));
    lines.push(`  ${server.keywords.map(k => chalk.gray(k)).join(', ')}`);
  }

  // Install command
  lines.push('');
  lines.push(chalk.bold('Install:'));
  lines.push(`  ${chalk.green('mcp-get install ' + server.name)}`);

  return lines.join('\n');
}

export function formatInstallConfig(config: MCPInstallConfig): string {
  const lines: string[] = [];

  lines.push(chalk.bold('Configuration for claude_desktop_config.json:'));
  lines.push('');
  lines.push(chalk.gray(JSON.stringify({
    command: config.command,
    args: config.args.length > 0 ? config.args : undefined,
    env: Object.keys(config.env).length > 0 ? config.env : undefined
  }, null, 2)));

  return lines.join('\n');
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function success(message: string): void {
  console.log(chalk.green('✓') + ' ' + message);
}

export function error(message: string): void {
  console.error(chalk.red('✗') + ' ' + message);
}

export function warning(message: string): void {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ') + ' ' + message);
}

export function heading(text: string): void {
  console.log('\n' + chalk.bold(text) + '\n');
}
