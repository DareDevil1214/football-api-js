// api/api.js - Corrected for MySQL with proper Swagger handling
const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");
const swaggerUi = require("swagger-ui-express");

// Import MySQL modules (NOT MongoDB)
const { connectDB, Article } = require('./database');
const { scrapeArticleContent } = require('./scraper');

// Connect to MySQL
connectDB();

// Load swagger documentation - make this optional in case file doesn't exist
let swaggerDocument = {};
try {
  swaggerDocument = require('../swagger.json');
} catch (error) {
  console.log('⚠️  swagger.json not found, creating basic API docs');
  swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "Football TV News API",
      version: "1.0.0",
      description: "Football news scraping and storage API with MySQL database"
    },
    servers: [
      {
        url: "/api",
        description: "API Server"
      }
    ],
    paths: {
      "/news": {
        get: {
          summary: "Get list of news sources",
          responses: {
            "200": {
              description: "List of available news sources"
            }
          }
        }
      },
      "/news/90mins": {
        get: {
          summary: "Get news from 90mins",
          responses: {
            "200": {
              description: "Array of news articles from 90mins"
            }
          }
        }
      },
      "/scrape/{source}": {
        post: {
          summary: "Scrape and store articles from a source",
          parameters: [
            {
              name: "source",
              in: "path",
              required: true,
              schema: {
                type: "string",
                enum: ["90mins", "onefootball", "espn", "goal", "fourfourtwo-epl", "fourfourtwo-laliga", "fourfourtwo-ucl", "fourfourtwo-bundesliga"]
              }
            }
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    limit: {
                      type: "integer",
                      default: 5
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Scraping results"
            }
          }
        }
      },
      "/articles": {
        get: {
          summary: "Get stored articles from database",
          parameters: [
            {
              name: "source",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 }
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 }
            }
          ],
          responses: {
            "200": {
              description: "Paginated list of articles"
            }
          }
        }
      },
      "/health": {
        get: {
          summary: "Health check endpoint",
          responses: {
            "200": {
              description: "API health status and database statistics"
            }
          }
        }
      }
    }
  };
}

const app = express();
const router = express.Router();

// Enable JSON body parsing for POST requests
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Keep all your existing arrays and variables exactly as they are
const news_array_ninenine = [];
const news_array_onefootball = [];
const news_array_espn = [];
const news_array_goaldotcom = [];
const news_array_fourfourtwo_epl = [];
const news_array_fourfourtwo_laliga = [];
const news_array_fourfourtwo_ucl = [];
const news_array_fourfourtwo_bundesliga = [];

const news_websites = [
  { title: "90mins" },
  { title: "One Football" },
  { title: "ESPN" },
  { title: "GOAL" },
  { title: "FourFourtwo" },
];

// Keep all your existing endpoints exactly as they are
router.get("/news", (req, res) => {
  res.json(news_websites);
});

router.get("/news/90mins", (req, res) => {
  news_array_ninenine.length = 0;
  
  axios
    .get("https://www.90min.com/categories/football-news")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      const validUrlPatterns = [
        /^https:\/\/www\.90min\.com\/[a-z0-9-]+$/,
        /^https:\/\/www\.90min\.com\/features\/[a-z0-9-]+$/,
      ];

      $("a", html).each(function () {
        const title = $(this).find("header").find("h3").text();
        const url = $(this).attr("href");
        const isValidUrl = validUrlPatterns.some((pattern) =>
          pattern.test(url)
        );
        if (isValidUrl && title !== "") {
          news_array_ninenine.push({
            title,
            url,
          });
        }
      });

      res.json(news_array_ninenine);
    })
    .catch((err) => {
      console.error('90mins scraping error:', err);
      res.status(500).json({ error: "Failed to fetch 90mins news" });
    });
});

router.get("/news/onefootball", (req, res) => {
  news_array_onefootball.length = 0;
  
  axios
    .get("https://onefootball.com/en/home")
    .then((response) => {
      const html1 = response.data;
      const $ = cheerio.load(html1);
      $("li", html1).each(function () {
        const title = $(this).find("a").eq(1).find("p").eq(0).text();
        const url =
          "https://onefootball.com" + $(this).find("a").eq(1).attr("href");
        const img = $(this).find("img").attr("src");

        if (title !== "") {
          news_array_onefootball.push({
            title,
            url,
            img,
          });
        }
      });
      res.json(news_array_onefootball);
    })
    .catch((err) => {
      console.error('OneFootball scraping error:', err);
      res.status(500).json({ error: "Failed to fetch OneFootball news" });
    });
});

router.get("/news/espn", (req, res) => {
  news_array_espn.length = 0;
  
  axios
    .get("https://www.espn.in/football/")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("a", html).each(function () {
        const title = $(this).find("h2").text();
        const url = "https://www.espn.in" + $(this).attr("href");
        const img = $(this).find("img").attr("data-default-src");

        if (url.includes("story") && title !== "") {
          news_array_espn.push({
            title,
            url,
            img,
          });
        }
      });
      res.json(news_array_espn);
    })
    .catch((err) => {
      console.error('ESPN scraping error:', err);
      res.status(500).json({ error: "Failed to fetch ESPN news" });
    });
});

router.get("/news/goal", (req, res) => {
  news_array_goaldotcom.length = 0;
  
  axios
    .get("https://www.goal.com/en-in/news")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      $("li", html).each(function () {
        const wordsToRemove = ["Getty", "Images", "/Goal"];
        const pattern = new RegExp(
          `^\\s+|(${wordsToRemove.join("|")}|[^a-zA-Z0-9\\s\\-.])`,
          "gi"
        );
        const url = "https://goal.com" + $(this).find("a").attr("href");
        const title = $(this).find("h3").text();
        const news_img = $(this).find("img").attr("src");
        const modifiedTitle = title.replace(pattern, "");
        const modifiedTitle2 = modifiedTitle.replace("CC", "");
        const modifiedTitle3 = modifiedTitle2.replace(
          "IG-leomessiIG-leomessiDear god",
          ""
        );

        if (url.includes("lists") && title !== "") {
          news_array_goaldotcom.push({
            url,
            modifiedTitle3,
            news_img,
          });
        }
      });
      res.json(news_array_goaldotcom);
    })
    .catch((err) => {
      console.error('Goal.com scraping error:', err);
      res.status(500).json({ error: "Failed to fetch Goal.com news" });
    });
});

router.get("/news/fourfourtwo/epl", (req, res) => {
  news_array_fourfourtwo_epl.length = 0;
  
  axios
    .get("https://www.fourfourtwo.com/premier-league")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(".small", html).each(function (index, element) {
        const url = $(element).find("a").attr("href");
        const title = $(element).find("h3.article-name").text();
        const imgSplitted = $(element).find("img").attr("data-srcset");
        const img = imgSplitted ? imgSplitted.split(" ") : null;
        const news_img = img ? img[0] : null;
        const short_desc = $(element).find("p.synopsis").text()?.trim();
        if (!url || !title) {
          return;
        }
        news_array_fourfourtwo_epl.push({
          url,
          title,
          news_img,
          short_desc,
        });
      });

      res.json(news_array_fourfourtwo_epl);
    })
    .catch((err) => {
      console.error('FourFourTwo EPL scraping error:', err);
      res.status(500).json({ error: "Failed to fetch FourFourTwo EPL news" });
    });
});

router.get("/news/fourfourtwo/laliga", (req, res) => {
  news_array_fourfourtwo_laliga.length = 0;
  
  axios
    .get("https://www.fourfourtwo.com/la-liga")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(".small", html).each(function (index, element) {
        const url = $(element).find("a").attr("href");
        const title = $(element).find("h3.article-name").text();
        const imgSplitted = $(element).find("img").attr("data-srcset");
        const img = imgSplitted ? imgSplitted.split(" ") : null;
        const news_img = img ? img[0] : null;
        const short_descc = $(element).find("p.synopsis").text()?.trim();
        const short_desc = short_descc?.replace(/^La Liga\n|IN THE MAG\n/g, "");
        if (!url || !title) {
          return;
        }
        news_array_fourfourtwo_laliga.push({
          url,
          title,
          news_img,
          short_desc,
        });
      });

      res.json(news_array_fourfourtwo_laliga);
    })
    .catch((err) => {
      console.error('FourFourTwo La Liga scraping error:', err);
      res.status(500).json({ error: "Failed to fetch FourFourTwo La Liga news" });
    });
});

router.get("/news/fourfourtwo/ucl", (req, res) => {
  news_array_fourfourtwo_ucl.length = 0;
  
  axios
    .get("https://www.fourfourtwo.com/champions-league")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(".small", html).each(function (index, element) {
        const url = $(element).find("a").attr("href");
        const title = $(element).find("h3.article-name").text();
        const imgSplitted = $(element).find("img").attr("data-srcset");
        const img = imgSplitted ? imgSplitted.split(" ") : null;
        const news_img = img ? img[0] : null;
        const short_descc = $(element).find("p.synopsis").text()?.trim();
        const short_desc = short_descc?.replace(
          /^La Liga\n|IN THE MAG\n|HOW TO WATCH\n/g,
          ""
        );
        if (!url || !title) {
          return;
        }
        news_array_fourfourtwo_ucl.push({
          url,
          title,
          news_img,
          short_desc,
        });
      });

      res.json(news_array_fourfourtwo_ucl);
    })
    .catch((err) => {
      console.error('FourFourTwo UCL scraping error:', err);
      res.status(500).json({ error: "Failed to fetch FourFourTwo UCL news" });
    });
});

router.get("/news/fourfourtwo/bundesliga", (req, res) => {
  news_array_fourfourtwo_bundesliga.length = 0;
  
  axios
    .get("https://www.fourfourtwo.com/bundesliga")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(".small", html).each(function (index, element) {
        const url = $(element).find("a").attr("href");
        const title = $(element).find("h3.article-name").text();
        const imgSplitted = $(element).find("img").attr("data-srcset");
        const img = imgSplitted ? imgSplitted.split(" ") : null;
        const news_img = img ? img[0] : null;
        const short_descc = $(element).find("p.synopsis").text()?.trim();
        const short_desc = short_descc?.replace(
          /^La Liga\n|IN THE MAG\n|HOW TO WATCH\n|EXCLUSIVE\n/g,
          ""
        );
        if (!url || !title) {
          return;
        }
        news_array_fourfourtwo_bundesliga.push({
          url,
          title,
          news_img,
          short_desc,
        });
      });

      res.json(news_array_fourfourtwo_bundesliga);
    })
    .catch((err) => {
      console.error('FourFourTwo Bundesliga scraping error:', err);
      res.status(500).json({ error: "Failed to fetch FourFourTwo Bundesliga news" });
    });
});

// NEW ENDPOINTS FOR MYSQL DATABASE

// Scraping endpoint - FIXED for MySQL
router.post("/scrape/:source", async (req, res) => {
  const { source } = req.params;
  const { limit = 5 } = req.body;
  
  try {
    let articles = [];
    
    // Get articles from your existing arrays
    switch (source) {
      case '90mins':
        articles = news_array_ninenine.slice(0, limit);
        break;
      case 'onefootball':
        articles = news_array_onefootball.slice(0, limit);
        break;
      case 'espn':
        articles = news_array_espn.slice(0, limit);
        break;
      case 'goal':
        articles = news_array_goaldotcom.slice(0, limit);
        break;
      case 'fourfourtwo-epl':
        articles = news_array_fourfourtwo_epl.slice(0, limit);
        break;
      case 'fourfourtwo-laliga':
        articles = news_array_fourfourtwo_laliga.slice(0, limit);
        break;
      case 'fourfourtwo-ucl':
        articles = news_array_fourfourtwo_ucl.slice(0, limit);
        break;
      case 'fourfourtwo-bundesliga':
        articles = news_array_fourfourtwo_bundesliga.slice(0, limit);
        break;
      default:
        return res.status(400).json({ error: 'Invalid source' });
    }
    
    if (articles.length === 0) {
      return res.json({ 
        message: 'No articles found. Try calling the basic endpoint first to populate articles.',
        hint: `Call GET /api/news/${source} first, then try scraping again.`,
        source,
        scraped: 0 
      });
    }
    
    const scrapedArticles = [];
    
    // Process articles one by one to avoid overwhelming servers
    for (const article of articles) {
      try {
        // Check if already exists in database (MySQL method)
        const existingArticle = await Article.findOne({ url: article.url });
        if (existingArticle) {
          scrapedArticles.push(existingArticle);
          continue;
        }
        
        // Scrape full content
        console.log(`Scraping: ${article.url}`);
        const scrapedContent = await scrapeArticleContent(article.url, source);
        
        if (scrapedContent) {
          // Save to MySQL (NOT MongoDB)
          const articleData = {
            source: source,
            title: scrapedContent.title || article.title,
            url: article.url,
            image: scrapedContent.image || article.img || article.news_img,
            description: scrapedContent.description,
            content: scrapedContent.content,
            originalTitle: article.title || article.modifiedTitle3,
            publishedAt: scrapedContent.publishedAt,
            category: source.includes('epl') ? 'epl' : 
                     source.includes('laliga') ? 'laliga' :
                     source.includes('ucl') ? 'ucl' :
                     source.includes('bundesliga') ? 'bundesliga' : 'general'
          };
          
          const savedArticle = await Article.save(articleData);
          scrapedArticles.push(savedArticle);
          console.log(`✅ Saved: ${savedArticle.title.substring(0, 50)}...`);
        }
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ${article.url}:`, error.message);
      }
    }
    
    res.json({
      source,
      totalFound: articles.length,
      scraped: scrapedArticles.length,
      articles: scrapedArticles
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get stored articles from MySQL (NOT MongoDB)
router.get("/articles", async (req, res) => {
  try {
    const { source, category, limit = 20, page = 1 } = req.query;
    const query = {};
    
    if (source) query.source = source;
    if (category) query.category = category;
    
    // MySQL method (not MongoDB)
    const articles = await Article.find(query)
      .sort({ scraped_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-content')
      .exec();
      
    const total = await Article.countDocuments(query);
    
    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article with full content
router.get("/articles/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint - FIXED for MySQL
router.get("/health", async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();
    const recentArticles = await Article.countDocuments({
      scraped_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      status: 'OK',
      database: 'MySQL connected',
      totalArticles,
      articlesLast24h: recentArticles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'MySQL connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Swagger documentation setup
router.use("/docs", swaggerUi.serve);
router.get("/docs", swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Football TV API Documentation"
}));

app.use("/api", router);

// Export both the serverless handler and the Express app
module.exports = app;
module.exports.handler = serverless(app);