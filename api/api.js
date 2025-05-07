const express = require("express");
const PORT = 8000 || process.env.PORT;
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
// Import swagger document directly instead of requiring it from a file
const swaggerDocument = {
  "openapi": "3.0.0",
  "info": {
    "title": "Football News API",
    "description": "API for fetching football news from various sources",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "/api",
      "description": "API base path"
    }
  ],
  "paths": {
    "/news": {
      "get": {
        "summary": "Get list of news sources",
        "description": "Returns a list of all available news sources",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/NewsSource"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/90mins": {
      "get": {
        "summary": "Get news from 90mins",
        "description": "Returns football news articles from 90mins",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/NinetyMinsArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/onefootball": {
      "get": {
        "summary": "Get news from One Football",
        "description": "Returns football news articles from One Football",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/OneFootballArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/espn": {
      "get": {
        "summary": "Get news from ESPN",
        "description": "Returns football news articles from ESPN",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ESPNArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/goal": {
      "get": {
        "summary": "Get news from GOAL",
        "description": "Returns football news articles from GOAL",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/GoalArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/fourfourtwo/epl": {
      "get": {
        "summary": "Get EPL news from FourFourTwo",
        "description": "Returns Premier League news articles from FourFourTwo",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/FourFourTwoArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/fourfourtwo/laliga": {
      "get": {
        "summary": "Get La Liga news from FourFourTwo",
        "description": "Returns La Liga news articles from FourFourTwo",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/FourFourTwoArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/fourfourtwo/ucl": {
      "get": {
        "summary": "Get Champions League news from FourFourTwo",
        "description": "Returns Champions League news articles from FourFourTwo",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/FourFourTwoArticle"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/news/fourfourtwo/bundesliga": {
      "get": {
        "summary": "Get Bundesliga news from FourFourTwo",
        "description": "Returns Bundesliga news articles from FourFourTwo",
        "responses": {
          "200": {
            "description": "Successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/FourFourTwoArticle"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "NewsSource": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "example": "90mins"
          }
        }
      },
      "NinetyMinsArticle": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "example": "Manchester United considering move for star striker"
          },
          "url": {
            "type": "string",
            "example": "https://www.90min.com/manchester-united-transfer-news"
          }
        }
      },
      "OneFootballArticle": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "example": "Liverpool win dramatic match against Arsenal"
          },
          "url": {
            "type": "string",
            "example": "https://onefootball.com/en/news/liverpool-win-dramatic-match-against-arsenal"
          },
          "img": {
            "type": "string",
            "example": "https://image.onefootball.com/liverpool-match.jpg"
          }
        }
      },
      "ESPNArticle": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "example": "Real Madrid secure Champions League victory"
          },
          "url": {
            "type": "string",
            "example": "https://www.espn.in/football/story/real-madrid-champions-league"
          },
          "img": {
            "type": "string",
            "example": "https://a.espncdn.com/photo/real-madrid-champions.jpg"
          }
        }
      },
      "GoalArticle": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "example": "https://goal.com/lists/top-10-players-2023"
          },
          "modifiedTitle3": {
            "type": "string",
            "example": "Top 10 players of 2023"
          },
          "news_img": {
            "type": "string",
            "example": "https://images.goal.com/top-10-players.jpg"
          }
        }
      },
      "FourFourTwoArticle": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "example": "https://www.fourfourtwo.com/premier-league/manchester-city-win-title"
          },
          "title": {
            "type": "string",
            "example": "Manchester City win Premier League title"
          },
          "news_img": {
            "type": "string",
            "example": "https://cdn.fourfourtwo.com/man-city-title.jpg"
          },
          "short_desc": {
            "type": "string",
            "example": "Manchester City have won their fourth consecutive Premier League title."
          }
        }
      }
    }
  }
};

const app = express();
const router = express.Router();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


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

router.get("/news", (req, res) => {
  res.json(news_websites);
});

router.get("/news/90mins", (req, res) => {
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
        console.log(url, 8888888);
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
    .catch((err) => console.log(err));
});

router.get("/news/onefootball", (req, res) => {
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
    .catch((err) => console.log(err));
});

router.get("/news/espn", (req, res) => {
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
    .catch((err) => console.log(err));
});

router.get("/news/goal", (req, res) => {
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

        console.log(title, "88888");

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
    .catch((err) => console.log(err));
});

router.get("/news/fourfourtwo/epl", (req, res) => {
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
    .catch((err) => console.log(err));
});

router.get("/news/fourfourtwo/laliga", (req, res) => {
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
    .catch((err) => console.log(err));
});

router.get("/news/fourfourtwo/ucl", (req, res) => {
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
    .catch((err) => console.log(err));
});

router.get("/news/fourfourtwo/bundesliga", (req, res) => {
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
    .catch((err) => console.log(err));
});

// Add Swagger documentation
router.use("/docs", swaggerUi.serve);
router.get("/docs", swaggerUi.setup(swaggerDocument, {
  explorer: true
}));

app.use("/api", router);

// Export both the serverless handler and the Express app
module.exports = app;
module.exports.handler = serverless(app);