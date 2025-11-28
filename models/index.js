const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Subscription = require('./Subscription');
const EmailVerification = require('./EmailVerification');
const PasswordReset = require('./PasswordReset');

// Define Relationships
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Product.hasMany(Order, { foreignKey: 'product_id', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(EmailVerification, { foreignKey: 'user_id', as: 'email_verifications' });
EmailVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PasswordReset, { foreignKey: 'user_id', as: 'password_resets' });
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Export all models
module.exports = {
  sequelize,
  User,
  Product,
  Order,
  Subscription,
  EmailVerification,
  PasswordReset
};