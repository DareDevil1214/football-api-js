const app = require("./api/api");

const PORT = 8005;

const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Docs: http://YOUR_DOMAIN:${port}/api/docs`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(port + 1);
    } else {
      console.error('Server error:', err.message);
    }
  });

  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT', () => server.close(() => process.exit(0)));
};

startServer(PORT);
