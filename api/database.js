// api/database.js - MySQL configuration for cPanel 
const mysql = require('mysql2/promise');

// Direct configuration for cPanel MySQL
const dbConfig = {
  host: 'localhost',
  user: 'futboltvs_golk75',
  password: 'K4t3l3nd',
  database: 'futboltvs_news',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  charset: 'utf8mb4'
};

// MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Connect to database
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected Successfully to futboltvs_news');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Create tables if they don't exist
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source ENUM('90mins', 'onefootball', 'espn', 'goal', 'fourfourtwo-epl', 'fourfourtwo-laliga', 'fourfourtwo-ucl', 'fourfourtwo-bundesliga') NOT NULL,
        title VARCHAR(300) NOT NULL,
        original_title VARCHAR(300),
        url VARCHAR(500) NOT NULL UNIQUE,
        image VARCHAR(500),
        description VARCHAR(1000),
        content TEXT,
        category ENUM('epl', 'laliga', 'ucl', 'bundesliga', 'general') DEFAULT 'general',
        published_at DATETIME,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        word_count INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_url (url),
        INDEX idx_source_scraped (source, scraped_at),
        INDEX idx_category_scraped (category, scraped_at),
        INDEX idx_scraped_at (scraped_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

// Article model methods with proper MySQL syntax
const Article = {
  async save(articleData) {
    try {
      // Calculate word count if content exists
      if (articleData.content) {
        articleData.word_count = articleData.content.split(' ').length;
      }
      
      const [result] = await pool.query(
        `INSERT INTO articles (source, title, original_title, url, image, description, content, category, published_at, word_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          articleData.source,
          articleData.title,
          articleData.originalTitle,
          articleData.url,
          articleData.image,
          articleData.description,
          articleData.content,
          articleData.category,
          articleData.publishedAt,
          articleData.word_count
        ]
      );
      
      // Return the created article
      return await this.findById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Article already exists, return existing one
        return await this.findOne({ url: articleData.url });
      }
      throw error;
    }
  },

  async findOne(criteria) {
    let query = 'SELECT * FROM articles WHERE ';
    const params = [];
    const conditions = [];

    for (const [key, value] of Object.entries(criteria)) {
      conditions.push(`${key} = ?`);
      params.push(value);
    }

    query += conditions.join(' AND ');
    const [rows] = await pool.query(query, params);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM articles WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  async find(criteria = {}) {
    let query = 'SELECT * FROM articles WHERE 1=1';
    const params = [];

    if (criteria.source) {
      query += ' AND source = ?';
      params.push(criteria.source);
    }

    if (criteria.category) {
      query += ' AND category = ?';
      params.push(criteria.category);
    }

    if (criteria.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(criteria.is_active);
    }

    return { 
      sort: (sortCriteria) => ({
        limit: (limitNum) => ({
          skip: (skipNum) => ({
            select: (selectFields) => {
              query += ' ORDER BY scraped_at DESC';
              
              if (limitNum) {
                query += ` LIMIT ${limitNum}`;
              }
              
              if (skipNum) {
                query += ` OFFSET ${skipNum}`;
              }

              return {
                exec: async () => {
                  const [rows] = await pool.query(query, params);
                  return rows;
                }
              };
            }
          })
        })
      })
    };
  },

  async countDocuments(criteria = {}) {
    let query = 'SELECT COUNT(*) as count FROM articles WHERE 1=1';
    const params = [];

    if (criteria.source) {
      query += ' AND source = ?';
      params.push(criteria.source);
    }

    if (criteria.category) {
      query += ' AND category = ?';
      params.push(criteria.category);
    }

    if (criteria.scraped_at && criteria.scraped_at.$gte) {
      query += ' AND scraped_at >= ?';
      params.push(criteria.scraped_at.$gte);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count;
  }
};

// Initialize database on startup
connectDB().then(() => {
  initializeDatabase();
});

module.exports = {
  connectDB,
  Article,
  pool
};