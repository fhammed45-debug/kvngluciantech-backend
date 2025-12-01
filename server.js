// Sync database and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Drop all tables first
    await sequelize.drop();
    console.log('✅ Tables dropped');
    
    // Recreate tables with proper defaults
    await sequelize.sync({ force: true });
    console.log('✅ Database models synced');
    
    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}