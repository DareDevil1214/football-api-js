const PORT = process.env.PORT || 8000;

// Import the API app directly
const app = require("./api/api");

// Function to start server with fallback ports
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`API documentation available at http://localhost:${port}/api/docs`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
};

// Start the server with the initial port
startServer(PORT); 