import { IndexNowSubmitter } from '../src/index';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

const mock = new MockAdapter(axios);

describe('IndexNowSubmitter', () => {
  let submitter: IndexNowSubmitter;
  const defaultConfig = {
    engine: 'test.com',
    key: 'test-key-1234',
    keyLocation: 'https://test-host.com/test-key-1234.txt',
    host: 'test-host.com',
    batchSize: 100,
    rateLimitDelay: 1000,
    cacheTTL: 86400 // 24 hours
  };

  beforeEach(() => {
    submitter = new IndexNowSubmitter(defaultConfig);
    mock.reset();
  });

  afterEach(() => {
    jest.clearAllMocks(); 
  });

  test('submitSingleUrl should submit a URL', async () => {
    mock.onPost('https://test.com/IndexNow').reply(200);
    await submitter.submitSingleUrl('https://test-host.com/page1');
    expect(mock.history.post.length).toBe(1);

    const request = mock.history.post[0];
    const payload = JSON.parse(request.data);
    expect(payload.keyLocation).toBeDefined();
    expect(payload.keyPath).toBeUndefined();
    expect(request.headers!['Content-Type']).toBe('application/json; charset=utf-8');
  });

  test('submitUrls should submit multiple URLs in batches', async () => {
    const urls = Array.from({ length: 350 }, (_, i) => `https://test-host.com/page${i + 1}`);
    mock.onPost('https://test.com/IndexNow').reply(200);

    await submitter.submitUrls(urls);

    expect(mock.history.post.length).toBe(4); // 4 batches expected (350/100 = 3.5 -> 4)
  });

  test('submitUrls should cache URLs', async () => {
    const urls = ['https://test-host.com/page1'];
    mock.onPost('https://test.com/IndexNow').reply(200);

    await submitter.submitUrls(urls);
    await submitter.submitUrls(urls); // Submit again

    expect(mock.history.post.length).toBe(1); // Should only submit once due to caching
  });
  
  test('submitUrls should respect rate limiting', async () => {
    const urls = Array.from({ length: 250 }, (_, i) => `https://test-host.com/page${i + 1}`);
    mock.onPost('https://test.com/IndexNow').reply(200);
    const delaySpy = jest.spyOn(submitter, 'delay');

    await submitter.submitUrls(urls);

    expect(delaySpy).toHaveBeenCalledTimes(2); // 2 delays expected for 3 batches
  });

  test('submitFromSitemap should fetch and submit URLs from a sitemap', async () => {
    const sitemapUrl = 'https://test-host.com/sitemap.xml';
    const sitemapContent = `
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://test-host.com/page1</loc></url>
        <url><loc>https://test-host.com/page2</loc></url>
      </urlset>
    `;
    mock.onGet(sitemapUrl).reply(200, sitemapContent);
    mock.onPost('https://test.com/IndexNow').reply(200);

    await submitter.submitFromSitemap(sitemapUrl);

    expect(mock.history.get.length).toBe(1);
    expect(mock.history.post.length).toBe(1);
  });

  describe('IndexNowSubmitter - Error Handling', () => {
    test('submitBatch should handle network errors', async () => {
      const urls = ['https://test-host.com/page1'];
      mock.onPost('https://test.com/IndexNow').networkError();
    
      // Instead of spying on console.error, check for the rejection with expected error
      await expect(submitter.submitUrls(urls)).rejects.toThrow('Network Error');
    });
    

    test('submitFromSitemap should handle invalid sitemaps', async () => {
      const sitemapUrl = 'https://test-host.com/invalid-sitemap.xml';
      mock.onGet(sitemapUrl).reply(200, 'Invalid XML');
    
      // Expect the function to throw a specific error message
      await expect(submitter.submitFromSitemap(sitemapUrl)).rejects.toThrow('Non-whitespace before first tag.'); 
    });
    

    test('submitUrls should handle invalid URLs', async () => {
      const invalidUrls = ['not-a-url', 'ftp://example.com'];
      mock.onPost('https://test.com/IndexNow').reply(200); // Should not be called

      await submitter.submitUrls(invalidUrls); // Should not throw an error for now
    });

    test('constructor should throw if required config is missing', () => {
      expect(() => {
        new IndexNowSubmitter({ key: '', host: '' });
      }).toThrow('Missing required config: key, host');

      expect(() => {
        new IndexNowSubmitter({ key: 'some-key-1234' }); // Missing host
      }).toThrow('Missing required config: host');

      expect(() => {
        new IndexNowSubmitter({ host: 'some-host' }); // Missing key
      }).toThrow('Missing required config: key');
    });

    test('constructor should throw for invalid key format', () => {
      expect(() => {
        new IndexNowSubmitter({ key: 'short', host: 'example.com' });
      }).toThrow('Invalid key format');

      expect(() => {
        new IndexNowSubmitter({ key: 'invalid!key@chars', host: 'example.com' });
      }).toThrow('Invalid key format');
    });

    test('constructor should throw if batchSize exceeds 10000', () => {
      expect(() => {
        new IndexNowSubmitter({ key: 'valid-key-1234', host: 'example.com', batchSize: 20000 });
      }).toThrow('batchSize cannot exceed 10000');
    });


  });

  describe('IndexNowSubmitter - HTTP Status Handling', () => {
    test('should treat 202 Accepted as success', async () => {
      mock.onPost('https://test.com/IndexNow').reply(202);
      await submitter.submitSingleUrl('https://test-host.com/page1');
      const analytics = submitter.getAnalytics();
      expect(analytics.successfulSubmissions).toBe(1);
    });

    test('should retry on 429 with exponential backoff', async () => {
      let callCount = 0;
      mock.onPost('https://test.com/IndexNow').reply(() => {
        callCount++;
        if (callCount < 3) return [429];
        return [200];
      });
      const delaySpy = jest.spyOn(submitter, 'delay').mockResolvedValue();

      await submitter.submitSingleUrl('https://test-host.com/page1');

      expect(callCount).toBe(3);
      expect(delaySpy).toHaveBeenCalledWith(1000); // 2^0 * 1000
      expect(delaySpy).toHaveBeenCalledWith(2000); // 2^1 * 1000
    });

    test('should fail after max retries on persistent 429', async () => {
      mock.onPost('https://test.com/IndexNow').reply(429);
      jest.spyOn(submitter, 'delay').mockResolvedValue();

      await expect(submitter.submitUrls(['https://test-host.com/page1']))
        .rejects.toThrow('Rate limited: max retries exceeded');
    });

    test('should throw on 4xx errors (e.g. 403 Forbidden)', async () => {
      mock.onPost('https://test.com/IndexNow').reply(403);

      await expect(submitter.submitUrls(['https://test-host.com/page1']))
        .rejects.toThrow('Submission failed with status 403');
    });
  });

  describe('IndexNowSubmitter - Edge Cases', () => {
    test('submitUrls with no URLs shouldx not make requests', async () => {
      await submitter.submitUrls([]);
      expect(mock.history.post.length).toBe(0);
    });

    test('submitFromSitemap with no URLs in sitemap should not make requests', async () => {
      const sitemapUrl = 'https://test-host.com/empty-sitemap.xml';
      mock.onGet(sitemapUrl).reply(200, `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset> 
      `);
      
      await submitter.submitFromSitemap(sitemapUrl); // Should not throw an error
      expect(mock.history.post.length).toBe(0); // No requests should be made
    });    
    
    test('submitFromSitemap with modifiedSince should filter URLs', async () => {
      const sitemapUrl = 'https://test-host.com/sitemap.xml';
      const sitemapContent = `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://test-host.com/page1</loc><lastmod>2024-07-20</lastmod></url>
          <url><loc>https://test-host.com/page2</loc><lastmod>2024-07-25</lastmod></url>
          <url><loc>https://test-host.com/page3</loc><lastmod>2024-07-15</lastmod></url>
        </urlset>
      `;
    
      mock.onGet(sitemapUrl).reply(200, sitemapContent);
      mock.onPost('https://test.com/IndexNow').reply(200);
    
      const modifiedSince = new Date('2024-07-22'); // Filter URLs modified on or after this date
      await submitter.submitFromSitemap(sitemapUrl, modifiedSince);
    
      expect(mock.history.post.length).toBe(1);
      const submittedUrls = JSON.parse(mock.history.post[0].data).urlList;
      expect(submittedUrls).toEqual([
        'https://test-host.com/page2' // Only page2 should be submitted
      ]);
    });    
  });

});
