import { PRODUCT_TYPES } from '../constants/productTypes';

/**
 * Returns formatted product display name.
 * For laptops, appends "| CPU / RAM / SSD" if available.
 * For non-laptops or items without specs, returns original name.
 *
 * @param {Object} product - Product or sale item object
 * @returns {string} Formatted display name
 */
export const getProductDisplayName = (product) => {
  if (!product) return '';

  const name = product.name || product.productName || '';
  const type = product.type || product.productType;

  if (type !== PRODUCT_TYPES.LAPTOP) {
    return name;
  }

  const specs = [];
  if (product.cpu && String(product.cpu).trim()) {
    specs.push(String(product.cpu).trim());
  }
  if (product.ram && String(product.ram).trim()) {
    specs.push(String(product.ram).trim());
  }
  if (product.ssd && String(product.ssd).trim()) {
    specs.push(String(product.ssd).trim());
  }

  if (specs.length === 0) {
    return name;
  }

  return `${name} | ${specs.join(' / ')}`;
};

export default getProductDisplayName;
