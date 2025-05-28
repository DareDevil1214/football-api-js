// api/scraper.js - Article content scraping logic
const axios = require('axios');
const cheerio = require('cheerio');

// Generic article scraper function
async function scrapeArticleContent(url, source) {
  try {
    console.log(`Scraping ${source} article: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000, // 15 second timeout
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    let title, image, description, content, publishedAt;

    // Source-specific scraping logic
    switch (source) {
      case '90mins':
        title = $('h1').first().text().trim() || 
                $('title').text().replace(' | 90min', '').trim();
        
        image = $('figure img').first().attr('src') || 
                $('img[data-src]').first().attr('data-src') ||
                $('meta[property="og:image"]').attr('content');
        
        description = $('meta[name="description"]').attr('content') || 
                     $('meta[property="og:description"]').attr('content') ||
                     $('.article-summary').text().trim();
        
        content = $('.article-content p, .article-body p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        
        // Try to find published date
        publishedAt = $('time').attr('datetime') || 
                     $('meta[property="article:published_time"]').attr('content');
        break;
        
      case 'onefootball':
        title = $('h1').first().text().trim() ||
                $('title').text().replace(' | OneFootball', '').trim();
        
        image = $('img[data-testid="ArticleImage"]').attr('src') || 
                $('.hero-image img').attr('src') ||
                $('meta[property="og:image"]').attr('content');
        
        description = $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content');
        
        content = $('.article-body p, .content p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        
        publishedAt = $('time').attr('datetime');
        break;
        
      case 'espn':
        title = $('h1').first().text().trim() ||
                $('title').text().replace(' - ESPN', '').trim();
        
        image = $('.media-wrapper img').first().attr('src') || 
                $('.article-header img').attr('src') ||
                $('meta[property="og:image"]').attr('content');
        
        description = $('meta[name="description"]').attr('content') ||
                     $('.article-meta .description').text().trim();
        
        content = $('.story-body p, .article-body p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        
        publishedAt = $('time').attr('datetime') ||
                     $('.timestamp').attr('data-date');
        break;
        
      case 'goal':
        title = $('h1').first().text().trim() ||
                $('title').text().replace(' | Goal.com', '').trim();
        
        image = $('.hero-image img').first().attr('src') || 
                $('.article-image img').attr('src') ||
                $('meta[property="og:image"]').attr('content');
        
        description = $('meta[name="description"]').attr('content') ||
                     $('.article-summary').text().trim();
        
        content = $('.article-body p, .entry-content p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        
        publishedAt = $('time').attr('datetime');
        break;
        
      case 'fourfourtwo-epl':
      case 'fourfourtwo-laliga':
      case 'fourfourtwo-ucl':
      case 'fourfourtwo-bundesliga':
        title = $('h1').first().text().trim() ||
                $('title').text().replace(' | FourFourTwo', '').trim();
        
        image = $('.hero-image img').first().attr('src') || 
                $('.article-hero img').attr('src') ||
                $('.lead-image img').attr('src') ||
                $('meta[property="og:image"]').attr('content');
        
        description = $('meta[name="description"]').attr('content') ||
                     $('.standfirst').text().trim() ||
                     $('.synopsis').text().trim();
        
        content = $('.article-body p, .text p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        
        publishedAt = $('time').attr('datetime') ||
                     $('.publish-date').text().trim();
        break;
        
      default:
        // Generic fallback scraping
        title = $('h1').first().text().trim() || 
                $('title').text().trim();
        
        image = $('meta[property="og:image"]').attr('content') || 
                $('img').first().attr('src');
        
        description = $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content');
        
        content = $('article p, .content p, .post-content p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        
        publishedAt = $('time').attr('datetime');
    }

    // Clean up and validate data
    title = title ? cleanText(title) : 'No title found';
    description = description ? cleanText(description) : null;
    content = content ? cleanText(content) : null;
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      image = new URL(image, baseUrl).href;
    }
    
    // Parse published date
    let parsedDate = null;
    if (publishedAt) {
      parsedDate = new Date(publishedAt);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null;
      }
    }

    const result = {
      title,
      image,
      description,
      content,
      publishedAt: parsedDate
    };
    
    console.log(`Successfully scraped: ${title.substring(0, 50)}...`);
    return result;
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
    
    return null;
  }
}

// Helper function to clean text
function cleanText(text) {
  if (!text) return null;
  
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim()
    .substring(0, text.length > 10000 ? 10000 : text.length); // Limit length
}

// Function to test scraping on a single URL
async function testScraping(url, source) {
  console.log(`\n=== Testing scraping for ${source} ===`);
  console.log(`URL: ${url}`);
  
  const result = await scrapeArticleContent(url, source);
  
  if (result) {
    console.log(`✅ Title: ${result.title}`);
    console.log(`✅ Image: ${result.image ? 'Found' : 'Not found'}`);
    console.log(`✅ Description: ${result.description ? result.description.substring(0, 100) + '...' : 'Not found'}`);
    console.log(`✅ Content Length: ${result.content ? result.content.length : 0} characters`);
    console.log(`✅ Published: ${result.publishedAt || 'Not found'}`);
  } else {
    console.log('❌ Scraping failed');
  }
  
  return result;
}

module.exports = {
  scrapeArticleContent,
  testScraping
};