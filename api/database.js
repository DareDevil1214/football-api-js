const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'futboltvs_golk75',
  password: 'K4t3l3nd',
  database: 'futboltvs_news',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Connected');
    connection.release();
  } catch (error) {
    console.error('MySQL Error:', error.message);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source ENUM('90mins', 'onefootball', 'espn', 'goal', 'fourfourtwo-epl', 'fourfourtwo-laliga', 'fourfourtwo-ucl', 'fourfourtwo-bundesliga') NOT NULL,
        title VARCHAR(500) NOT NULL,
        original_title VARCHAR(500),
        url VARCHAR(1000) NOT NULL UNIQUE,
        image VARCHAR(1000),
        description TEXT,
        content LONGTEXT,
        category ENUM('epl', 'laliga', 'ucl', 'bundesliga', 'general') DEFAULT 'general',
        published_at DATETIME,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        word_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_url (url(255)),
        INDEX idx_source_scraped (source, scraped_at),
        INDEX idx_category_scraped (category, scraped_at),
        INDEX idx_scraped_at (scraped_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error.message);
  }
};

const Article = {
  async save(articleData) {
    try {
      if (articleData.content) {
        articleData.word_count = articleData.content.split(/\s+/).length;
      }
      
      const [result] = await pool.query(
        `INSERT INTO articles 
         (source, title, original_title, url, image, description, content, category, published_at, word_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          articleData.source,
          articleData.title?.substring(0, 500) || 'Untitled',
          articleData.originalTitle?.substring(0, 500),
          articleData.url,
          articleData.image,
          articleData.description,
          articleData.content,
          articleData.category || 'general',
          articleData.publishedAt,
          articleData.word_count || 0
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return await this.findOne({ url: articleData.url });
      }
      throw error;
    }
  },

  async findOne(criteria) {
    try {
      let query = 'SELECT * FROM articles WHERE ';
      const params = [];
      const conditions = [];

      for (const [key, value] of Object.entries(criteria)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }

      query += conditions.join(' AND ') + ' LIMIT 1';
      const [rows] = await pool.query(query, params);
      return rows[0] || null;
    } catch (error) {
      return null;
    }
  },

  async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM articles WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      return null;
    }
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
            select: (selectFields) => ({
              exec: async () => {
                query += ' ORDER BY scraped_at DESC';
                if (limitNum) query += ` LIMIT ${limitNum}`;
                if (skipNum) query += ` OFFSET ${skipNum}`;
                
                const [rows] = await pool.query(query, params);
                return rows;
              }
            })
          })
        })
      })
    };
  },

  async countDocuments(criteria = {}) {
    try {
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
    } catch (error) {
      return 0;
    }
  }
};

connectDB().then(() => {
  initializeDatabase();
});

module.exports = {
  connectDB,
  Article,
  pool
};
