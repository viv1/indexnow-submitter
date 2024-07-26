# IndexNow Submitter

IndexNow Submitter is a powerful and flexible TypeScript/JavaScript module for submitting URLs to search engines using the IndexNow protocol. It provides features such as caching, analytics, sitemap parsing, and more, making it an essential tool for SEO professionals and web developers.

## Table of Contents

1. [Installation](#installation)
2. [Features](#features)
3. [Usage](#usage)
   - [As a Module](#as-a-module)
   - [As a CLI Tool](#as-a-cli-tool)
4. [Configuration Options](#configuration-options)
5. [API Reference](#api-reference)
6. [CLI Commands](#cli-commands)
7. [Caching](#caching)
8. [Analytics](#analytics)
9. [Sitemap Parsing](#sitemap-parsing)
10. [Error Handling and Logging](#error-handling-and-logging)
11. [Development](#development)
12. [Contributing](#contributing)
13. [License](#license)

## Installation

You can install IndexNow Submitter using npm:

```bash
npm install indexnow-submitter
```

## Features

- Submit single URLs or batches of URLs to search engines using the IndexNow protocol
- Parse and submit URLs from sitemaps
- Built-in caching to avoid resubmitting recently submitted URLs
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
const IndexNowSubmitter = require()'indexnow-submitter').IndexNowSubmitter;

const submitter = new IndexNowSubmitter({
  engine: 'api.indexnow.org',
  key: 'your-api-key',
  keyLocation: 'your-api-key-location',
  host: 'your-website.com'
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
| engine | -e, --engine | Search engine domain | bing.com |
| key | -k, --key | IndexNow API key | (from INDEXNOW_KEY env variable) |
| host | -h, --host | Your website host | (from INDEXNOW_HOST env variable) |
| key-path | -p, --key-path | IndexNow API key path | (from INDEXNOW_PATH env variable) |
| batchSize | -b, --batch-size | Batch size for URL submission | 100 |
| rateLimitDelay | -r, --rate-limit | Delay between batches in milliseconds | 1000 |
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
  batchSize: number;
  rateLimitDelay: number;
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
| `submit-file <file>` | Submit URLs from a file |
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

IndexNow Submitter uses an in-memory cache to avoid resubmitting recently submitted URLs. The cache TTL (Time To Live) can be configured using the `cacheTTL` option. By default, submitted URLs are cached for 24 hours.

## Analytics

The module provides basic analytics on URL submissions. You can access these analytics using the `getAnalytics()` method, which returns an object with the following properties:

- `totalSubmissions`: Total number of URL submissions attempted
- `successfulSubmissions`: Number of successful URL submissions
- `failedSubmissions`: Number of failed URL submissions
- `averageResponseTime`: Average response time for submissions in milliseconds

## Sitemap Parsing

IndexNow Submitter can parse XML sitemaps and submit the URLs found within them. When using the `submitFromSitemap` method or the `submit-sitemap` CLI command, you can optionally specify a `modifiedSince` date to only submit URLs that have been modified since that date.

## Error Handling and Logging

The module uses Winston for logging. Logs are written to both the console and a file named `indexnow.log`. The log level is set to `info` by default, which logs all successful operations and errors.

Error handling is implemented throughout the module. In case of errors during submission, the module will log the error and throw an exception, which you can catch and handle in your application.

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

