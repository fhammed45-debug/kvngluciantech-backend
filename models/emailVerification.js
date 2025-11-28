const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailVerification = sequelize.define('EmailVerification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
 verification_code: {
  type: DataTypes.STRING(255),
  allowNull: false,
  unique: true
},
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
 used: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
}
}, {
  tableName: 'email_verification',
  timestamps: true,
  underscored: true
});

module.exports = EmailVerification;