import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {  // 👈 must bind to 0.0.0.0
  console.log(`🚀 Preview engine running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});
