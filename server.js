// server.js - Production server for cPanel hosting
const app = require("./api/api");

const PORT = process.env.PORT || 8000;

// Function to start server with fallback ports and external binding
const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Football TV API Server Started Successfully!`);
    console.log(`🌍 Server running on ALL interfaces at port ${port}`);
    console.log(`📡 Local access: http://localhost:${port}`);
    console.log(`🌐 External access: http://YOUR_DOMAIN:${port}`);
    console.log(`\n📚 API Documentation: http://YOUR_DOMAIN:${port}/api/docs`);
    console.log(`\n⚽ Available Endpoints:`);
    console.log(`   GET  /api/health - Health check & database status`);
    console.log(`   GET  /api/news - List all news sources`);
    console.log(`   GET  /api/news/90mins - Get 90mins news`);
    console.log(`   GET  /api/news/onefootball - Get OneFootball news`);
    console.log(`   GET  /api/news/espn - Get ESPN news`);
    console.log(`   GET  /api/news/goal - Get Goal.com news`);
    console.log(`   GET  /api/news/fourfourtwo/epl - Get EPL news`);
    console.log(`   GET  /api/news/fourfourtwo/laliga - Get La Liga news`);
    console.log(`   GET  /api/news/fourfourtwo/ucl - Get UCL news`);
    console.log(`   GET  /api/news/fourfourtwo/bundesliga - Get Bundesliga news`);
    console.log(`   POST /api/scrape/{source} - Scrape and store articles`);
    console.log(`   GET  /api/articles - Get stored articles from database`);
    console.log(`   GET  /api/articles/{id} - Get single article with full content`);
    console.log(`\n🎯 Quick Tests:`);
    console.log(`   curl http://localhost:${port}/api/health`);
    console.log(`   curl http://localhost:${port}/api/news`);
    console.log(`\n🎉 API is ready for use!`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is busy, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('❌ Server startup error:', err.message);
      process.exit(1);
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n📴 ${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};

// Start the server
console.log('🔄 Starting Football TV API Server...');
startServer(PORT);
