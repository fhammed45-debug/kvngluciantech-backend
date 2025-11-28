const { sequelize } = require('../models');

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database...');
    
    await sequelize.sync({ force: true }); // Creates all tables
    
    console.log('✅ All tables created successfully!');
    console.log('📋 Tables created:');
    console.log('   - users');
    console.log('   - products');
    console.log('   - orders');
    console.log('   - subscriptions');
    console.log('   - email_verification');
    console.log('   - password_resets');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();