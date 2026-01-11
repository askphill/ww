import chalk from 'chalk';
import ora from 'ora';
import { initializeDatabase } from '../db/schema.js';
import { fetchShopifyProducts } from '../services/shopify.js';

export async function syncCommand(): Promise<void> {
  const spinner = ora('Connecting to Shopify...').start();

  try {
    const db = initializeDatabase();

    spinner.text = 'Fetching products from Shopify...';
    const products = await fetchShopifyProducts();

    if (products.length === 0) {
      spinner.warn('No products found in Shopify');
      db.close();
      return;
    }

    spinner.text = 'Syncing products to local database...';

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO products (id, handle, title, description, tags, synced_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    const insertMany = db.transaction((prods: typeof products) => {
      for (const product of prods) {
        insertStmt.run(
          product.id,
          product.handle,
          product.title,
          product.description,
          JSON.stringify(product.tags),
          now
        );
      }
    });

    insertMany(products);

    spinner.succeed(`Synced ${chalk.green(products.length)} products`);

    // Display synced products
    console.log('\n' + chalk.bold('Synced Products:'));
    console.log(chalk.dim('─'.repeat(60)));

    products.forEach((product, i) => {
      console.log(`  ${i + 1}. ${chalk.cyan(product.title)}`);
      console.log(`     Handle: ${chalk.dim(product.handle)}`);
      if (product.tags.length > 0) {
        console.log(`     Tags: ${chalk.dim(product.tags.join(', '))}`);
      }
      console.log();
    });

    db.close();
  } catch (error) {
    spinner.fail('Failed to sync products');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
