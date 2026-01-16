import chalk from 'chalk';
import ora from 'ora';
import type {FetchOptions} from '../types/index.js';
import {initializeDatabase} from '../db/schema.js';
import {fetchGscData} from '../services/gsc.js';

export async function fetchCommand(options: {
  days: string;
  country: string;
}): Promise<void> {
  const spinner = ora('Initializing database...').start();

  try {
    const db = initializeDatabase();
    spinner.succeed('Database initialized');

    const fetchOptions: FetchOptions = {
      days: parseInt(options.days, 10),
      country: options.country,
    };

    spinner.start(
      `Fetching GSC data for ${fetchOptions.country} (last ${fetchOptions.days} days)...`,
    );

    const data = await fetchGscData(fetchOptions);

    if (data.length === 0) {
      spinner.warn('No data found for the specified parameters');
      return;
    }

    // Insert data into database
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO gsc_queries (query, country, clicks, impressions, ctr, position, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((rows: typeof data) => {
      for (const row of rows) {
        insertStmt.run(
          row.query,
          fetchOptions.country,
          row.clicks,
          row.impressions,
          row.ctr,
          row.position,
          row.date,
        );
      }
    });

    insertMany(data);

    spinner.succeed(`Fetched and stored ${chalk.green(data.length)} queries`);

    // Show top queries
    console.log('\n' + chalk.bold('Top 10 queries by impressions:'));
    const topQueries = db
      .prepare(
        `
        SELECT query, SUM(impressions) as total_impressions, AVG(position) as avg_position
        FROM gsc_queries
        WHERE country = ?
        GROUP BY query
        ORDER BY total_impressions DESC
        LIMIT 10
      `,
      )
      .all(fetchOptions.country) as Array<{
      query: string;
      total_impressions: number;
      avg_position: number;
    }>;

    topQueries.forEach((q, i) => {
      console.log(
        `  ${i + 1}. ${chalk.cyan(q.query)} - ${q.total_impressions} impressions (avg pos: ${q.avg_position.toFixed(1)})`,
      );
    });

    db.close();
  } catch (error) {
    spinner.fail('Failed to fetch GSC data');
    console.error(
      chalk.red(error instanceof Error ? error.message : 'Unknown error'),
    );
    process.exit(1);
  }
}
