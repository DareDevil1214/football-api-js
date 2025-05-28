// api/database.js - MongoDB configuration and schema
const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football-news';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    // Don't exit process in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Article Schema
const articleSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['90mins', 'onefootball', 'espn', 'goal', 'fourfourtwo-epl', 'fourfourtwo-laliga', 'fourfourtwo-ucl', 'fourfourtwo-bundesliga']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  originalTitle: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS URL'
    }
  },
  image: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  content: {
    type: String,
    maxlength: 20000
  },
  category: {
    type: String,
    enum: ['epl', 'laliga', 'ucl', 'bundesliga', 'general'],
    default: 'general'
  },
  publishedAt: {
    type: Date
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  wordCount: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better performance
articleSchema.index({ url: 1 }, { unique: true });
articleSchema.index({ source: 1, scrapedAt: -1 });
articleSchema.index({ category: 1, scrapedAt: -1 });
articleSchema.index({ scrapedAt: -1 });

// Pre-save middleware to calculate word count
articleSchema.pre('save', function(next) {
  if (this.content) {
    this.wordCount = this.content.split(/\s+/).length;
  }
  next();
});

// Virtual for reading time (assuming 200 words per minute)
articleSchema.virtual('readingTime').get(function() {
  if (this.wordCount) {
    return Math.ceil(this.wordCount / 200);
  }
  return 0;
});

// Ensure virtual fields are serialized
articleSchema.set('toJSON', { virtuals: true });

const Article = mongoose.model('Article', articleSchema);

module.exports = {
  connectDB,
  Article
};