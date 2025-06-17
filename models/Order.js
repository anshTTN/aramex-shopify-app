const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // FreightChargeAmount: {
  //   type: DataTypes.DECIMAL(10, 2),
  //   allowNull: true
  // },
  b_address: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  c_address: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  d_address: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  plugin_key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // status: {
  //   type: DataTypes.STRING,
  //   allowNull: false
  // },
  // wms_status: {
  //   type: DataTypes.STRING,
  //   allowNull: false
  // },
  // plugin_status: {
  //   type: DataTypes.STRING,
  //   allowNull: false
  // },
  // store_type: {
  //   type: DataTypes.STRING,
  //   allowNull: false
  // },
  // dateTime: {
  //   type: DataTypes.DATE,
  //   allowNull: false
  // },
  cts_service: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cts_value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // client_system_ref: {
  //   type: DataTypes.STRING,
  //   allowNull: false
  // },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // facility: {
  //   type: DataTypes.STRING,
  //   allowNull: false
  // },
  plugin_store_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  plugin_domain: {
    type: DataTypes.STRING,
    allowNull: false
  },
  store_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  orderItems: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['orderNumber', 'plugin_store_name']
    }
  ]
});

module.exports = Order; 