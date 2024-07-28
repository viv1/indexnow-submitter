# IndexNow Submitter

IndexNow Submitter is a powerful and flexible TypeScript/JavaScript module for submitting URLs to search engines using the IndexNow protocol. It provides features such as caching, analytics, sitemap parsing, and more, making it an essential tool for SEO professionals and web developers.

## Table of Contents

1. [Installation](#installation)
2. [Prerequisites](#prerequisites)
3. [Features](#features)
4. [Usage](#usage)
   - [As a Module](#as-a-module)
   - [As a CLI Tool](#as-a-cli-tool)
5. [Configuration Options](#configuration-options)
6. [API Reference](#api-reference)
7. [CLI Commands](#cli-commands)
8. [Caching](#caching)
9. [Analytics](#analytics)
10. [Sitemap Parsing](#sitemap-parsing)
11. [Error Handling and Logging](#error-handling-and-logging)
12. [Development](#development)
13. [Contributing](#contributing)
14. [License](#license)

## Installation

You can install IndexNow Submitter using npm:

```bash
npm install indexnow-submitter
```

### Usage in TypeScript Projects

When you build the IndexNow Submitter project, it generates two main files in the `dist` directory:

- `dist/index.js`: The compiled JavaScript file
- `dist/index.d.ts`: The TypeScript declaration file

To use IndexNow Submitter in your TypeScript project:

1. Install the package as shown in the Installation section above.

2. In your TypeScript file, import the `IndexNowSubmitter` class:

```typescript
import { IndexNowSubmitter } from 'indexnow-submitter';
```

3. TypeScript will automatically use the declaration file (`index.d.ts`) to provide type information and autocompletion for the `IndexNowSubmitter` class and its methods.

Example usage in a TypeScript file:

```typescript
import { IndexNowSubmitter } from 'indexnow-submitter';

async function submitUrls() {
  const submitter = new IndexNowSubmitter({
    key: 'your-api-key',
    host: 'your-website.com'
  });

  try {
    await submitter.submitSingleUrl('https://your-website.com/new-page');
    console.log('URL submitted successfully');
  } catch (error) {
    console.error('Error submitting URL:', error);
  }
}

submitUrls();
```

This setup allows you to take full advantage of TypeScript's static typing and tooling support while using the IndexNow Submitter module.

## Prerequisites

- Node.js 14 or higher
- npm (usually comes with Node.js)
- A valid IndexNow API key
- A website domain that you own and want to submit URLs for
- For TypeScript projects: TypeScript 4.x or higher

## Features

- Submit single URLs or batches of URLs to search engines using the IndexNow protocol
- Parse and submit URLs from sitemaps
- Instance-based caching to avoid resubmitting recently submitted URLs
- Analytics to track submission statistics
- Rate limiting to comply with search engine submission guidelines
- Configurable options for search engine, API key, host, batch size, and more
- Command-line interface (CLI) for easy use in scripts and automation
- TypeScript support for improved developer experience
- Comprehensive logging for debugging and monitoring
- Modular architecture for easy extension and customization

## Usage

### As a Module

```typescript
const IndexNowSubmitter = require()'indexnow-submitter').IndexNowSubmitter; // Supports CommonJS
// import { IndexNowSubmitter } from 'indexnow-submitter'; // Also supports ES6


const submitter = new IndexNowSubmitter({
  engine: 'api.indexnow.org',
  key: 'your-api-key',
  host: 'your-website.com',
  keyPath: 'https://your-website.com/your-api-key.txt'
});

// Submit a single URL
submitter.submitSingleUrl('https://your-website.com/new-page')
  .then(() => console.log('URL submitted successfully'))
  .catch(error => console.error('Error submitting URL:', error));

// Submit multiple URLs
submitter.submitUrls(['https://your-website.com/page1', 'https://your-website.com/page2'])
  .then(() => console.log('URLs submitted successfully'))
  .catch(error => console.error('Error submitting URLs:', error));

// Submit URLs from a sitemap
submitter.submitFromSitemap('https://your-website.com/sitemap.xml')
  .then(() => console.log('Sitemap URLs submitted successfully'))
  .catch(error => console.error('Error submitting sitemap URLs:', error));

// Get analytics
const analytics = submitter.getAnalytics();
console.log('Submission analytics:', analytics);
```

### As a CLI Tool

```bash
# Submit a single URL
INDEXNOW_KEY=your-api-key INDEXNOW_HOST=your-website.com npx indexnow-submitter submit https://your-website.com/new-page

# Submit URLs from a file
INDEXNOW_KEY=your-api-key INDEXNOW_HOST=your-website.com npx indexnow-submitter submit-file urls.txt

# Submit URLs from a sitemap
INDEXNOW_KEY=your-api-key INDEXNOW_HOST=your-website.com npx indexnow-submitter submit-sitemap https://your-website.com/sitemap.xml

# Submit URLs from a sitemap, only those modified since a specific date
INDEXNOW_KEY=your-api-key INDEXNOW_HOST=your-website.com npx indexnow-submitter submit-sitemap https://your-website.com/sitemap.xml --modified-since 2023-01-01
```

## Configuration Options

| Option | CLI Flag | Description | Default |
|--------|----------|-------------|---------|
| engine | -e, --engine | Search engine domain | api.indexnow.org |
| key | -k, --key | IndexNow API key | (from INDEXNOW_KEY env variable) |
| host | -h, --host | Your website host | (from INDEXNOW_HOST env variable) |
| keyPath | -p, --key-path | IndexNow API key path | https://{host}/{key}.txt |
| batchSize | -b, --batch-size | Batch size for URL submission | 100 |
| rateLimit | -r, --rate-limit | Delay between batches in milliseconds | 1000 |
| cacheTTL | -c, --cache-ttl | Cache TTL in seconds | 86400 (24 hours) |

## API Reference

### `IndexNowSubmitter`

The main class for interacting with the IndexNow protocol.

#### Constructor

```typescript
constructor(config: Partial<Config> = {})
```

Creates a new instance of IndexNowSubmitter with the given configuration.

#### Methods

| Method | Description |
|--------|-------------|
| `submitSingleUrl(url: string): Promise<void>` | Submits a single URL to the search engine |
| `submitUrls(urls: string[]): Promise<void>` | Submits multiple URLs to the search engine |
| `submitFromSitemap(sitemapUrl: string, modifiedSince?: Date): Promise<void>` | Submits URLs from a sitemap |
| `getAnalytics(): Analytics` | Returns the current analytics data |

### `Config`

Configuration interface for IndexNowSubmitter.

```typescript
interface Config {
  engine: string;
  key: string;
  host: string;
  keyPath: string;
  batchSize: number;
  rateLimit: number;
  cacheTTL: number;
}
```

### `Analytics`

Interface for analytics data.

```typescript
interface Analytics {
  totalSubmissions: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  averageResponseTime: number;
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `submit <url>` | Submit a single URL |
| `submit-file <file>` | Submit URLs from a file, with each url in a single line |
| `submit-sitemap <url>` | Submit URLs from a sitemap |

### Global Options

All CLI commands support the following options:

```
-e, --engine <engine>       Search engine domain
-k, --key <key>             IndexNow API key
-h, --host <host>           Your website host
-p, --key-path <key-path>   IndexNow API key path
-b, --batch-size <size>     Batch size for URL submission
-r, --rate-limit <delay>    Delay between batches in milliseconds
-c, --cache-ttl <ttl>       Cache TTL in seconds
```

## Caching

IndexNow Submitter uses an in-memory cache to avoid resubmitting recently submitted URLs. The cache is bound to an instance of IndexNowSubmitter and is not global. This means that each instance of IndexNowSubmitter has its own separate cache.

The cache TTL (Time To Live) can be configured using the `cacheTTL` option. By default, submitted URLs are cached for 24 hours.

Example of how caching works with multiple instances:

```typescript
import { IndexNowSubmitter } from 'indexnow-submitter';

const submitter1 = new IndexNowSubmitter({
  key: 'your-api-key-1',
  host: 'website1.com',
  cacheTTL: 3600 // 1 hour
});

const submitter2 = new IndexNowSubmitter({
  key: 'your-api-key-2',
  host: 'website2.com',
  cacheTTL: 7200 // 2 hours
});

// This URL will be cached for 1 hour in submitter1's cache
await submitter1.submitSingleUrl('https://website1.com/page1');

// This URL will be cached for 2 hours in submitter2's cache
await submitter2.submitSingleUrl('https://website2.com/page1');

// This will not be submitted again as it's still in submitter1's cache
await submitter1.submitSingleUrl('https://website1.com/page1');

// This will be submitted as it's not in submitter2's cache
await submitter2.submitSingleUrl('https://website1.com/page1');
```

In this example, each submitter instance has its own cache, allowing you to manage different websites or API keys independently.

## Analytics

The module provides basic analytics on URL submissions. You can access these analytics using the `getAnalytics()` method, which returns an object with the following properties:

- `totalSubmissions`: Total number of URL submissions attempted
- `successfulSubmissions`: Number of successful URL submissions
- `failedSubmissions`: Number of failed URL submissions
- `averageResponseTime`: Average response time for submissions in milliseconds

Analytics are specific to each instance of IndexNowSubmitter, allowing you to track performance for different configurations separately.

## Sitemap Parsing

IndexNow Submitter can parse XML sitemaps and submit the URLs found within them. When using the `submitFromSitemap` method or the `submit-sitemap` CLI command, you can optionally specify a `modifiedSince` date to only submit URLs that have been modified since that date.

Example:

```typescript
const submitter = new IndexNowSubmitter({
  key: 'your-api-key',
  host: 'your-website.com'
});

// Submit all URLs from the sitemap
await submitter.submitFromSitemap('https://your-website.com/sitemap.xml');

// Submit only URLs modified since January 1, 2023
const modifiedSince = new Date('2023-01-01');
await submitter.submitFromSitemap('https://your-website.com/sitemap.xml', modifiedSince);
```

## Error Handling and Logging

The module uses Winston for logging. Logs are written to both the console and a file named `indexnow.log`. The log level is set to `info` by default, which logs all successful operations and errors.

Error handling is implemented throughout the module. In case of errors during submission, the module will log the error and throw an exception, which you can catch and handle in your application.

Example of error handling:

```typescript
const submitter = new IndexNowSubmitter({
  key: 'your-api-key',
  host: 'your-website.com'
});

try {
  await submitter.submitSingleUrl('https://your-website.com/new-page');
  console.log('URL submitted successfully');
} catch (error) {
  console.error('Error submitting URL:', error);
  // Handle the error (e.g., retry, notify admin, etc.)
}
```

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request, or raise any issue that you encounter.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
