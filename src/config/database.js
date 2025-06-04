const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'aramex_shopify_app',
  process.env.DB_USER || 'ansh',
  process.env.DB_PASSWORD || '5sQhtezssOsHYocIcRDTdsoCfr9dtZzs',
  {
    host: process.env.DB_HOST || 'dpg-d1009nripnbc738cgjig-a',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
}; 