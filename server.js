// server.js - Simple server without .env
const app = require("./api/api");

const PORT = 8001; // Fixed port, no environment variables

// Function to start server with fallback ports
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 API documentation available at http://localhost:${port}/api/docs`);
    console.log(`⚽ Football news endpoints:`);
    console.log(`   GET /api/news - List all sources`);
    console.log(`   GET /api/news/90mins - Get 90mins news`);
    console.log(`   GET /api/news/onefootball - Get OneFootball news`);
    console.log(`   POST /api/scrape/90mins - Scrape and store articles`);
    console.log(`   GET /api/articles - Get stored articles`);
    console.log(`   GET /api/health - Health check`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is busy, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
    });
  });
};

// Start the server
startServer(PORT);