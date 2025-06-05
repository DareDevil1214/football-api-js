const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeArticleContent(url, source) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });
    
    const $ = cheerio.load(response.data);
    let title, image, description, content, publishedAt;

    switch (source) {
      case '90mins':
        title = $('h1').first().text().trim() || $('title').text().replace(' | 90min', '').trim();
        image = $('figure img').first().attr('src') || $('meta[property="og:image"]').attr('content');
        description = $('meta[name="description"]').attr('content');
        content = $('.article-content p, .article-body p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        publishedAt = $('time').attr('datetime');
        break;
        
      case 'onefootball':
        title = $('h1').first().text().trim() || $('title').text().replace(' | OneFootball', '').trim();
        image = $('img[data-testid="ArticleImage"]').attr('src') || $('meta[property="og:image"]').attr('content');
        description = $('meta[name="description"]').attr('content');
        content = $('.article-body p, .content p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        publishedAt = $('time').attr('datetime');
        break;
        
      case 'espn':
        title = $('h1').first().text().trim() || $('title').text().replace(' - ESPN', '').trim();
        image = $('.media-wrapper img').first().attr('src') || $('meta[property="og:image"]').attr('content');
        description = $('meta[name="description"]').attr('content');
        content = $('.story-body p, .article-body p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        publishedAt = $('time').attr('datetime');
        break;
        
      case 'goal':
        title = $('h1').first().text().trim() || $('title').text().replace(' | Goal.com', '').trim();
        image = $('.hero-image img').first().attr('src') || $('meta[property="og:image"]').attr('content');
        description = $('meta[name="description"]').attr('content');
        content = $('.article-body p, .entry-content p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        publishedAt = $('time').attr('datetime');
        break;
        
      case 'fourfourtwo-epl':
      case 'fourfourtwo-laliga':
      case 'fourfourtwo-ucl':
      case 'fourfourtwo-bundesliga':
        title = $('h1').first().text().trim() || $('title').text().replace(' | FourFourTwo', '').trim();
        image = $('.hero-image img').first().attr('src') || $('meta[property="og:image"]').attr('content');
        description = $('meta[name="description"]').attr('content');
        content = $('.article-body p, .text p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        publishedAt = $('time').attr('datetime');
        break;
        
      default:
        title = $('h1').first().text().trim() || $('title').text().trim();
        image = $('meta[property="og:image"]').attr('content');
        description = $('meta[name="description"]').attr('content');
        content = $('article p, .content p, .post-content p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        publishedAt = $('time').attr('datetime');
    }

    title = title ? cleanText(title) : 'No title found';
    description = description ? cleanText(description) : null;
    content = content ? cleanText(content) : null;
    
    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      image = new URL(image, baseUrl).href;
    }
    
    let parsedDate = null;
    if (publishedAt) {
      parsedDate = new Date(publishedAt);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null;
      }
    }

    return {
      title,
      image,
      description,
      content,
      publishedAt: parsedDate
    };
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

function cleanText(text) {
  if (!text) return null;
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .substring(0, text.length > 10000 ? 10000 : text.length);
}

module.exports = {
  scrapeArticleContent
};