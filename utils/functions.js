function normalizeShopUrl(shop) {
    return shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

module.exports = {
    normalizeShopUrl,
};