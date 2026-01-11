import chalk from 'chalk';
import ora from 'ora';
import type { AnalyzeOptions } from '../types/index.js';
import { getDatabase } from '../db/schema.js';
import { analyzeOpportunities } from '../analyzers/opportunities.js';

export async function analyzeCommand(options: { minImpressions: string; maxPosition: string }): Promise<void> {
  const spinner = ora('Analyzing content opportunities...').start();

  try {
    const db = getDatabase();

    const analyzeOptions: AnalyzeOptions = {
      minImpressions: parseInt(options.minImpressions, 10),
      maxPosition: parseFloat(options.maxPosition),
    };

    const opportunities = await analyzeOpportunities(db, analyzeOptions);

    if (opportunities.length === 0) {
      spinner.warn('No opportunities found matching criteria');
      db.close();
      return;
    }

    // Store opportunities in database
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO opportunities
      (keyword, impressions_30d, clicks_30d, current_position, related_product_id, opportunity_score, status)
      VALUES (?, ?, ?, ?, ?, ?, 'identified')
    `);

    const insertMany = db.transaction((opps: typeof opportunities) => {
      for (const opp of opps) {
        insertStmt.run(
          opp.keyword,
          opp.impressions30d,
          opp.clicks30d,
          opp.currentPosition,
          opp.relatedProductId,
          opp.opportunityScore
        );
      }
    });

    insertMany(opportunities);

    spinner.succeed(`Found ${chalk.green(opportunities.length)} content opportunities`);

    // Display opportunities
    console.log('\n' + chalk.bold('Top Content Opportunities:'));
    console.log(chalk.dim('─'.repeat(80)));

    opportunities.slice(0, 15).forEach((opp, i) => {
      const scoreColor = opp.opportunityScore >= 70 ? chalk.green : opp.opportunityScore >= 40 ? chalk.yellow : chalk.red;
      console.log(
        `  ${chalk.dim(`${i + 1}.`)} ${chalk.cyan(opp.keyword)}`
      );
      console.log(
        `     Impressions: ${chalk.white(opp.impressions30d)} | Position: ${chalk.white(opp.currentPosition.toFixed(1))} | Score: ${scoreColor(opp.opportunityScore.toFixed(0))}`
      );
      if (opp.relatedProductId) {
        console.log(`     Related product: ${chalk.magenta(opp.relatedProductId)}`);
      }
      console.log();
    });

    db.close();
  } catch (error) {
    spinner.fail('Failed to analyze opportunities');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
