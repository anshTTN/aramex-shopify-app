const { sequelize } = require('./database');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const Shop = require('../../models/Shop');
const Store = require('../../models/Store');

const initDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

module.exports = initDatabase; 