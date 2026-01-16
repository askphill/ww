import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import type {GenerateOptions} from '../types/index.js';
import {getDatabase} from '../db/schema.js';
import {generateArticle} from '../services/claude.js';
import {buildMdxArticle} from '../generators/article.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../../website/app/content/blog',
);

export async function generateCommand(options: {
  topic?: string;
  product?: string;
  dryRun: boolean;
}): Promise<void> {
  if (!options.topic) {
    console.error(chalk.red('Error: --topic is required'));
    console.log(
      chalk.dim(
        'Usage: seo-engine generate --topic "natuurlijke deodorant" [--product deodorant]',
      ),
    );
    process.exit(1);
  }

  const spinner = ora('Preparing article generation...').start();

  try {
    const db = getDatabase();

    const generateOptions: GenerateOptions = {
      topic: options.topic,
      product: options.product,
      dryRun: options.dryRun,
    };

    // Get related product if specified
    let relatedProduct: {
      id: string;
      handle: string;
      title: string;
      description: string;
    } | null = null;
    if (generateOptions.product) {
      const result = db
        .prepare('SELECT * FROM products WHERE handle = ?')
        .get(generateOptions.product) as
        | {id: string; handle: string; title: string; description: string}
        | undefined;

      if (result) {
        relatedProduct = result;
      } else {
        spinner.warn(
          `Product "${generateOptions.product}" not found. Run 'seo-engine sync' first.`,
        );
      }
    }

    spinner.text = 'Generating article with Claude...';

    const articleContent = await generateArticle(
      generateOptions.topic,
      relatedProduct,
    );

    spinner.succeed('Article generated');

    // Build the MDX file
    const mdxContent = buildMdxArticle(articleContent);

    if (generateOptions.dryRun) {
      console.log('\n' + chalk.bold.yellow('=== DRY RUN - Preview Only ==='));
      console.log('\n' + chalk.bold('Article Title:'));
      console.log(`  ${chalk.cyan(articleContent.frontmatter.title)}`);
      console.log('\n' + chalk.bold('Slug:'));
      console.log(`  ${chalk.cyan(articleContent.frontmatter.slug)}`);
      console.log('\n' + chalk.bold('Description:'));
      console.log(`  ${articleContent.frontmatter.description}`);
      console.log('\n' + chalk.bold('Tags:'));
      console.log(`  ${articleContent.frontmatter.tags.join(', ')}`);
      console.log('\n' + chalk.bold('Content Preview (first 500 chars):'));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(mdxContent.slice(0, 500) + '...');
      console.log(chalk.dim('─'.repeat(60)));
      console.log('\n' + chalk.yellow('No files were written (dry run mode)'));
    } else {
      // Ensure blog directory exists
      await fs.mkdir(BLOG_OUTPUT_DIR, {recursive: true});

      const filePath = path.join(
        BLOG_OUTPUT_DIR,
        `${articleContent.frontmatter.slug}.mdx`,
      );
      await fs.writeFile(filePath, mdxContent, 'utf-8');

      // Store in database
      const now = new Date().toISOString();
      db.prepare(
        `
        INSERT INTO articles (slug, title, target_keyword, related_product_id, status, mdx_path, generated_at)
        VALUES (?, ?, ?, ?, 'draft', ?, ?)
      `,
      ).run(
        articleContent.frontmatter.slug,
        articleContent.frontmatter.title,
        generateOptions.topic,
        relatedProduct?.id ?? null,
        filePath,
        now,
      );

      console.log('\n' + chalk.green.bold('Article created successfully!'));
      console.log(`  ${chalk.bold('File:')} ${chalk.cyan(filePath)}`);
      console.log(`  ${chalk.bold('Status:')} draft`);
      console.log(
        `\n  Preview at: ${chalk.underline(`http://localhost:3000/blog/${articleContent.frontmatter.slug}`)}`,
      );
    }

    db.close();
  } catch (error) {
    spinner.fail('Failed to generate article');
    console.error(
      chalk.red(error instanceof Error ? error.message : 'Unknown error'),
    );
    process.exit(1);
  }
}
