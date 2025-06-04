const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shop: {
    type: DataTypes.STRING,
    // allowNull: false
  },
  customerId: {
    type: DataTypes.STRING,
    // allowNull: false
  },
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  }
}, {
  timestamps: true
});

module.exports = Customer; 