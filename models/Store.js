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
  wms_store_key: {
    type: DataTypes.STRING
  },
  wms_facility_id: {
    type: DataTypes.STRING
  },
  wms_SSA_login: {
    type: DataTypes.STRING
  },
  wms_SSA_password: {
    type: DataTypes.STRING
  },
  is_wms_authenticated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Store; 