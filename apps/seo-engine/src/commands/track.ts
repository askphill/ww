import chalk from 'chalk';
import ora from 'ora';
import type { TrackOptions } from '../types/index.js';
import { getDatabase } from '../db/schema.js';
import { fetchGscDataForUrls } from '../services/gsc.js';

export async function trackCommand(options: { all: boolean; period: string }): Promise<void> {
  const spinner = ora('Loading published articles...').start();

  try {
    const db = getDatabase();

    const trackOptions: TrackOptions = {
      all: options.all,
      period: parseInt(options.period, 10),
    };

    // Get published articles
    const articles = db
      .prepare(`
        SELECT id, slug, title, target_keyword, published_at
        FROM articles
        WHERE status = 'published'
        ${trackOptions.all ? '' : 'AND published_at >= date("now", "-30 days")'}
        ORDER BY published_at DESC
      `)
      .all() as Array<{ id: number; slug: string; title: string; target_keyword: string; published_at: string }>;

    if (articles.length === 0) {
      spinner.warn('No published articles found');
      db.close();
      return;
    }

    spinner.succeed(`Found ${chalk.green(articles.length)} published articles`);
    spinner.start('Fetching performance data from GSC...');

    const articleUrls = articles.map((a) => `/blog/${a.slug}`);
    const performanceData = await fetchGscDataForUrls(articleUrls, trackOptions.period);

    // Store performance data
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO article_performance (article_id, date, impressions, clicks, avg_position)
      VALUES (?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];

    for (const article of articles) {
      const articlePath = `/blog/${article.slug}`;
      const data = performanceData.get(articlePath);
      if (data) {
        insertStmt.run(article.id, today, data.impressions, data.clicks, data.avgPosition);
      }
    }

    spinner.succeed('Performance data updated');

    // Display performance summary
    console.log('\n' + chalk.bold('Article Performance Summary:'));
    console.log(chalk.dim('─'.repeat(80)));

    for (const article of articles) {
      const perf = db
        .prepare(`
          SELECT
            SUM(impressions) as total_impressions,
            SUM(clicks) as total_clicks,
            AVG(avg_position) as avg_position
          FROM article_performance
          WHERE article_id = ?
          AND date >= date('now', '-' || ? || ' days')
        `)
        .get(article.id, trackOptions.period) as { total_impressions: number | null; total_clicks: number | null; avg_position: number | null } | undefined;

      console.log(`\n  ${chalk.cyan(article.title)}`);
      console.log(`  ${chalk.dim(`/blog/${article.slug}`)}`);

      if (perf && perf.total_impressions !== null) {
        const ctr = perf.total_clicks && perf.total_impressions
          ? ((perf.total_clicks / perf.total_impressions) * 100).toFixed(2)
          : '0';
        console.log(
          `  Impressions: ${chalk.white(perf.total_impressions)} | ` +
          `Clicks: ${chalk.green(perf.total_clicks ?? 0)} | ` +
          `CTR: ${chalk.yellow(ctr + '%')} | ` +
          `Avg Position: ${chalk.blue((perf.avg_position ?? 0).toFixed(1))}`
        );
      } else {
        console.log(chalk.dim('  No data available yet'));
      }
    }

    db.close();
  } catch (error) {
    spinner.fail('Failed to track article performance');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
