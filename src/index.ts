#!/usr/bin/env node

import axios from 'axios';
import { program } from 'commander';
import * as fs from 'fs/promises';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { createLogger, format, transports } from 'winston';
import * as dotenv from 'dotenv';
import NodeCache from 'node-cache';

dotenv.config();

const parseXml = promisify(parseString);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'indexnow.log' })
  ]
});

interface Config {
  engine: string;
  key: string;
  host: string;
  keyPath: string;
  batchSize: number;
  rateLimitDelay: number;
  cacheTTL: number;
}

const defaultConfig: Config = {
  engine: 'api.indexnow.org',
  key: process.env.INDEXNOW_KEY || '',
  keyPath: process.env.INDEXNOW_KEY_PATH || `https://${process.env.INDEXNOW_HOST}/${process.env.INDEXNOW_KEY}.txt`,
  host: process.env.INDEXNOW_HOST || '',
  batchSize: 100,
  rateLimitDelay: 1000,
  cacheTTL: 86400 // 24 hours
};

interface Analytics {
  totalSubmissions: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  averageResponseTime: number;
}

class IndexNowSubmitter {
  private config: Config;
  private cache: NodeCache;
  private analytics: Analytics;

  constructor(config: Partial<Config> = {}) {
    this.config = { ...defaultConfig, ...config };

    const missingConfig = [];
    if (!this.config.key) missingConfig.push('key');
    if (!this.config.host) missingConfig.push('host');

    if (missingConfig.length > 0) {
      throw new Error(`Missing required config: ${missingConfig.join(', ')}`);
    }
  
    this.cache = new NodeCache({ stdTTL: this.config.cacheTTL });
    this.analytics = {
      totalSubmissions: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      averageResponseTime: 0
    };
  }

  public async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async submitBatch(urls: string[]): Promise<void> {
    if (urls.length === 0) return; // Don't submit empty batches

    const endpoint = `https://${this.config.engine}/IndexNow`;
    const payload = {
      host: this.config.host,
      key: this.config.key,
      keyPath: this.config.keyPath,
      urlList: urls
    };

    logger.info(`Submitting batch of ${urls.length} urls`);

    try {
      const startTime = Date.now();
      const response = await axios.post(endpoint, payload);
      const endTime = Date.now();

      this.updateAnalytics(urls.length, endTime - startTime);

      logger.info(`Batch submitted successfully: ${response.status}`);
    } catch (error) {
      this.analytics.totalSubmissions += urls.length;
      this.analytics.failedSubmissions += urls.length;
      logger.error('Error submitting batch:', error);
      throw error;
    }
  }

  private updateAnalytics(urlCount: number, responseTime: number): void {
    this.analytics.totalSubmissions += urlCount;
    this.analytics.successfulSubmissions += urlCount;
    this.analytics.averageResponseTime = 
      (this.analytics.averageResponseTime * (this.analytics.totalSubmissions - urlCount) + responseTime) / 
      this.analytics.totalSubmissions;
  }

  private async processBatch(urls: string[]): Promise<void> {
    for (let i = 0; i < urls.length; i += this.config.batchSize) {
      const batch = urls.slice(i, i + this.config.batchSize);
      await this.submitBatch(batch);
      batch.forEach(url => this.cache.set(url, true));

      // Apply delay if there are more batches to process
      if (i + this.config.batchSize < urls.length) {
        await this.delay(this.config.rateLimitDelay);
      }
    }
  }

  async submitUrls(urls: string[]): Promise<void> {
    const uncachedUrls = urls.filter(url => !this.cache.get(url));
    logger.info(`Submitting ${uncachedUrls.length} uncached URLs`);
    if (uncachedUrls.length > 0) {
      await this.processBatch(uncachedUrls);
    }
  }

  async submitSingleUrl(url: string): Promise<void> {
    logger.info(`Checking cache for URL: ${url}`);
    if (!this.cache.get(url)) {
      await this.submitUrls([url]);
    } else {
      logger.info(`URL ${url} already submitted recently. Skipping.`);
    }
  }

  async submitFromSitemap(sitemapUrl: string, modifiedSince?: Date): Promise<void> {
    try {
      const response = await axios.get(sitemapUrl);
      const result: any = await parseXml(response.data);
  
      const urls = result.urlset?.url?.filter((entry: any) => {
        if (!modifiedSince) return true;
        const lastmod = new Date(entry.lastmod[0]);
        return lastmod >= modifiedSince;
      }).map((entry: any) => entry.loc[0]) || [];
  
      logger.info(`Found ${urls.length} URLs in sitemap`);
      if (urls.length > 0) {
        await this.submitUrls(urls);
      }
    } catch (error) {
      logger.error('Error processing sitemap:', error);
      throw error;
    }
  }

  getAnalytics(): Analytics {
    return { ...this.analytics };
  }
}

async function runCli(): Promise<void> {
  program
    .version('1.0.0')
    .option('-e, --engine <engine>', 'Search engine domain')
    .option('-k, --key <key>', 'IndexNow API key')
    .option('-h, --host <host>', 'Your website host')
    .option('-p, --key-path <key-path>', 'IndexNow API key path')
    .option('-b, --batch-size <size>', 'Batch size for URL submission')
    .option('-r, --rate-limit <delay>', 'Delay between batches in milliseconds')
    .option('-c, --cache-ttl <ttl>', 'Cache TTL in seconds');

  program
    .command('submit <url>')
    .description('Submit a single URL')
    .action(async (url: string) => {
      const submitter = new IndexNowSubmitter(program.opts());
      await submitter.submitSingleUrl(url);
      console.log('Analytics:', submitter.getAnalytics());
    });

  program
    .command('submit-file <file>')
    .description('Submit URLs from a file')
    .action(async (file: string) => {
      const submitter = new IndexNowSubmitter(program.opts());
      const content = await fs.readFile(file, 'utf-8');
      const urls = content.split('\n').filter(url => url.trim() !== '');
      await submitter.submitUrls(urls);
      console.log('Analytics:', submitter.getAnalytics());
    });

  program
    .command('submit-sitemap <url>')
    .option('-d, --modified-since <date>', 'Only submit URLs modified since this date')
    .description('Submit URLs from a sitemap')
    .action(async (url: string, options: { modifiedSince?: string }) => {
      const submitter = new IndexNowSubmitter(program.opts());
      const modifiedSince = options.modifiedSince ? new Date(options.modifiedSince) : undefined;
      await submitter.submitFromSitemap(url, modifiedSince);
      console.log('Analytics:', submitter.getAnalytics());
    });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  runCli().catch(error => {
    logger.error('CLI execution error:', error);
    process.exit(1);
  });
}


export { IndexNowSubmitter, Config, Analytics };