const app = require("./api/api");

const PORT = process.env.PORT || 8005;

const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Football API running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
    }
  });

  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return server;
};

startServer(PORT);