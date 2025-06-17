const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/config/database');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shop: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  accessToken: {
    type: DataTypes.STRING
  },
  scope: {
    type: DataTypes.STRING
  },
  nonce: {
    type: DataTypes.STRING
  },
  wms_jwt_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  facility: {
    type: DataTypes.STRING,
    allowNull: true
  },
  storerkey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Store; 