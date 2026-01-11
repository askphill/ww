#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load environment variables (app-level first, then root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { fetchCommand } from './commands/fetch.js';
import { analyzeCommand } from './commands/analyze.js';
import { generateCommand } from './commands/generate.js';
import { trackCommand } from './commands/track.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('seo-engine')
  .description('SEO Content Engine for Wakey - Generate AI-powered SEO articles')
  .version('0.1.0');

program
  .command('fetch')
  .description('Fetch Google Search Console data')
  .option('-d, --days <number>', 'Number of days to fetch', '30')
  .option('-c, --country <code>', 'Country code filter', 'NL')
  .action(fetchCommand);

program
  .command('analyze')
  .description('Analyze content opportunities from GSC data')
  .option('-m, --min-impressions <number>', 'Minimum impressions threshold', '100')
  .option('-p, --max-position <number>', 'Maximum position to consider', '20')
  .action(analyzeCommand);

program
  .command('generate')
  .description('Generate article drafts using Claude')
  .option('-t, --topic <string>', 'Topic or keyword for article')
  .option('-p, --product <handle>', 'Related product handle')
  .option('--dry-run', 'Preview without saving', false)
  .action(generateCommand);

program
  .command('track')
  .description('Track published article performance')
  .option('-a, --all', 'Track all published articles', false)
  .option('--period <number>', 'Days to track', '7')
  .action(trackCommand);

program
  .command('sync')
  .description('Sync Shopify products to local database')
  .action(syncCommand);

program.parse();
