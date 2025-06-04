const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shop: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shopifyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bodyHtml: {
    type: DataTypes.TEXT
  },
  vendor: {
    type: DataTypes.STRING
  },
  productType: {
    type: DataTypes.STRING
  },
  handle: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'draft'),
    defaultValue: 'active'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  options: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  variants: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  image: {
    type: DataTypes.JSONB
  },
  publishedAt: {
    type: DataTypes.DATE
  },
  publishedScope: {
    type: DataTypes.ENUM('global', 'web'),
    defaultValue: 'global'
  },
  templateSuffix: {
    type: DataTypes.STRING
  },
  metafields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  collections: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  seoTitle: {
    type: DataTypes.STRING
  },
  seoDescription: {
    type: DataTypes.TEXT
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2)
  },
  weightUnit: {
    type: DataTypes.STRING,
    defaultValue: 'kg'
  },
  requiresShipping: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  taxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  giftCard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  compareAtPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  price: {
    type: DataTypes.DECIMAL(10, 2)
  },
  inventoryPolicy: {
    type: DataTypes.ENUM('deny', 'continue'),
    defaultValue: 'deny'
  },
  inventoryQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  inventoryManagement: {
    type: DataTypes.ENUM('shopify', 'not_managed'),
    defaultValue: 'shopify'
  },
  barcode: {
    type: DataTypes.STRING
  },
  sku: {
    type: DataTypes.STRING
  },
  adminGraphqlApiId: {
    type: DataTypes.STRING
  },
  defaultVariantId: {
    type: DataTypes.STRING
  },
  defaultVariant: {
    type: DataTypes.JSONB
  },
  media: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  customProductType: {
    type: DataTypes.STRING
  },
  customProductTypeId: {
    type: DataTypes.STRING
  },
  customProductTypeName: {
    type: DataTypes.STRING
  },
  customProductTypeHandle: {
    type: DataTypes.STRING
  },
  customProductTypeTemplate: {
    type: DataTypes.STRING
  },
  customProductTypeTemplateSuffix: {
    type: DataTypes.STRING
  },
  customProductTypePublishedAt: {
    type: DataTypes.DATE
  },
  customProductTypePublishedScope: {
    type: DataTypes.ENUM('global', 'web'),
    defaultValue: 'global'
  },
  customProductTypeStatus: {
    type: DataTypes.ENUM('active', 'archived', 'draft'),
    defaultValue: 'active'
  },
  customProductTypeTags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  customProductTypeOptions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  customProductTypeVariants: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  customProductTypeImages: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  customProductTypeImage: {
    type: DataTypes.JSONB
  },
  customProductTypeMetafields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  customProductTypeCollections: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  customProductTypeSeoTitle: {
    type: DataTypes.STRING
  },
  customProductTypeSeoDescription: {
    type: DataTypes.TEXT
  },
  customProductTypeWeight: {
    type: DataTypes.DECIMAL(10, 2)
  },
  customProductTypeWeightUnit: {
    type: DataTypes.STRING,
    defaultValue: 'kg'
  },
  customProductTypeRequiresShipping: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  customProductTypeTaxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  customProductTypeGiftCard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customProductTypeCompareAtPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  customProductTypePrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  customProductTypeInventoryPolicy: {
    type: DataTypes.ENUM('deny', 'continue'),
    defaultValue: 'deny'
  },
  customProductTypeInventoryQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  customProductTypeInventoryManagement: {
    type: DataTypes.ENUM('shopify', 'not_managed'),
    defaultValue: 'shopify'
  },
  customProductTypeBarcode: {
    type: DataTypes.STRING
  },
  customProductTypeSku: {
    type: DataTypes.STRING
  },
  customProductTypeAdminGraphqlApiId: {
    type: DataTypes.STRING
  },
  customProductTypeDefaultVariantId: {
    type: DataTypes.STRING
  },
  customProductTypeDefaultVariant: {
    type: DataTypes.JSONB
  },
  customProductTypeMedia: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['shopifyId', 'shop']
    },
    {
      fields: ['handle']
    },
    {
      fields: ['vendor']
    },
    {
      fields: ['productType']
    },
    {
      fields: ['status']
    },
    {
      fields: ['tags']
    }
  ]
});

module.exports = Product; 