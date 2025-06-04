const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/config/database');

const Shop = sequelize.define('Shop', {
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
  name: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  myshopifyDomain: {
    type: DataTypes.STRING
  },
  primaryDomain: {
    type: DataTypes.STRING
  },
  currencyCode: {
    type: DataTypes.STRING
  },
  plan: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

module.exports = Shop; 