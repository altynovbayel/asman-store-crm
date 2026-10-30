import { PRODUCT_TYPES } from '../../../constants/productTypes';
import { PRODUCT_STATUS } from '../../../constants/productStatus';
import { toSafeNumber, toSafeQuantity } from '../../../utils/safeNumber';

/**
 * Items of a stored sale as an array of item objects (old or malformed documents
 * may hold a non-array `items` or empty entries).
 * @param {Object} sale
 * @returns {Array<Object>}
 */
export const getSaleItems = (sale) => (
  Array.isArray(sale?.items)
    ? sale.items.filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
    : []
);

/**
 * Profit operands of a sold item from its historical snapshot. The field is chosen exactly
 * as before (salePrice -> unitPrice -> price, discount -> itemDiscount, on the raw stored
 * values); only the chosen value is then read safely: malformed values count as 0 instead
 * of producing NaN or throwing.
 * @param {Object} item
 * @returns {{ salePrice: number, discount: number, purchasePrice: number, quantity: number }}
 */
export const getSaleItemSnapshot = (item) => ({
  purchasePrice: toSafeNumber(item.purchasePrice !== undefined ? item.purchasePrice : 0),
  salePrice: toSafeNumber(item.salePrice !== undefined ? item.salePrice : (item.unitPrice || item.price || 0)),
  discount: toSafeNumber(item.discount !== undefined ? item.discount : (item.itemDiscount || 0)),
  quantity: toSafeQuantity(item.quantity)
});

/**
 * Total number of units in a sale (sum of item quantities).
 * @param {Object} sale
 * @returns {number}
 */
export const calculateSaleUnitsCount = (sale) =>
  getSaleItems(sale).reduce((sum, item) => sum + toSafeQuantity(item.quantity), 0);

/**
 * Calculates the total revenue from a list of sales.
 * Revenue is the sum of the final checkout grand totals.
 * @param {Array} sales 
 * @returns {number}
 */
export const calculateRevenue = (sales = []) => {
  return sales.reduce((sum, sale) => sum + toSafeNumber(sale?.grandTotal), 0);
};

/**
 * Calculates profit for a single sale.
 * Profit = (salePrice - discount - purchasePrice) * quantity.
 * @param {Object} sale 
 * @returns {number}
 */
export const calculateSingleSaleProfit = (sale) => {
  return getSaleItems(sale).reduce((itemProfitSum, item) => {
    const { salePrice, discount, purchasePrice, quantity } = getSaleItemSnapshot(item);
    const profitPerUnit = salePrice - discount - purchasePrice;
    return itemProfitSum + (profitPerUnit * quantity);
  }, 0);
};

/**
 * Calculates the total profit from a list of sales.
 * @param {Array} sales 
 * @returns {number}
 */
export const calculateProfit = (sales = []) => {
  return sales.reduce((totalProfit, sale) => totalProfit + calculateSingleSaleProfit(sale), 0);
};

/**
 * Calculates the number of sales.
 * @param {Array} sales 
 * @returns {number}
 */
export const calculateSalesCount = (sales = []) => {
  return sales.length;
};

/**
 * Calculates the average check value.
 * Average Check = Total Revenue / Sales Count.
 * @param {Array} sales 
 * @returns {number}
 */
export const calculateAverageCheck = (sales = []) => {
  const count = calculateSalesCount(sales);
  if (count === 0) return 0;
  const revenue = calculateRevenue(sales);
  return revenue / count;
};

/**
 * Groups sales data by manager and calculates totals for employee reporting.
 * @param {Array} sales 
 * @returns {Array} Array of manager statistics
 */
export const calculateEmployeeStats = (sales = []) => {
  // No prototype: a managerName such as "__proto__" or "constructor" must not
  // resolve to (and modify) Object.prototype; key order stays the same as with {}
  const managerGroups = Object.create(null);

  sales.forEach((sale) => {
    const manager = sale.managerName || 'Неизвестно';
    if (!managerGroups[manager]) {
      managerGroups[manager] = {
        manager,
        salesCount: 0,
        revenue: 0,
        profit: 0
      };
    }
    
    const revenue = toSafeNumber(sale.grandTotal);
    const profit = calculateSingleSaleProfit(sale);
    
    managerGroups[manager].salesCount += 1;
    managerGroups[manager].revenue += revenue;
    managerGroups[manager].profit += profit;
  });

  return Object.values(managerGroups).map((group) => ({
    manager: group.manager,
    salesCount: group.salesCount,
    revenue: group.revenue,
    profit: group.profit,
    averageCheck: group.salesCount > 0 ? group.revenue / group.salesCount : 0
  }));
};

/**
 * Calculates the total number of units currently in stock.
 * Uses the same stock rules as Dashboard (see getUnitsInStock): AVAILABLE laptops only,
 * accessories by positive quantity.
 * @param {Array} products 
 * @returns {number}
 */
export const calculateTotalProducts = (products = []) => {
  const stock = calculateCurrentStock(products);
  return stock.laptops + stock.accessories;
};

/**
 * Calculates the total purchase cost value of the current inventory
 * (same value as calculateCurrentStock().purchaseValue shown on Dashboard).
 * @param {Array} products 
 * @returns {number}
 */
export const calculateInventoryPurchaseValue = (products = []) => {
  return calculateCurrentStock(products).purchaseValue;
};

/**
 * Calculates the total retail value of the current inventory:
 * units in stock (getUnitsInStock) x current selling price (missing price counts as 0).
 * @param {Array} products 
 * @returns {number}
 */
export const calculateInventoryRetailValue = (products = []) => {
  return products.reduce((sum, p) => sum + getStockValuation(p).retailValue, 0);
};

/**
 * Calculates potential profit: retail value minus purchase value.
 * @param {Array} products 
 * @returns {number}
 */
export const calculatePotentialProfit = (products = []) => {
  const retail = calculateInventoryRetailValue(products);
  const purchase = calculateInventoryPurchaseValue(products);
  return retail - purchase;
};

/**
 * Number of units a product currently has in stock.
 * Laptops are unique units: in stock only while AVAILABLE (their quantity field is ignored).
 * Accessories are counted by quantity; missing or negative quantity counts as 0.
 * @param {Object} product
 * @returns {number}
 */
export const getUnitsInStock = (product) => {
  if (!product) return 0;
  if (product.type === PRODUCT_TYPES.LAPTOP) {
    return product.status === PRODUCT_STATUS.AVAILABLE ? 1 : 0;
  }
  if (product.type === PRODUCT_TYPES.ACCESSORY) {
    const qty = toSafeNumber(product.quantity);
    return qty > 0 ? qty : 0;
  }
  return 0;
};

/**
 * Summarizes the current warehouse stock: laptops in stock, accessory units in stock
 * and their total purchase value (current purchasePrice; missing price counts as 0).
 * @param {Array} products
 * @returns {{ laptops: number, accessories: number, purchaseValue: number }}
 */
export const calculateCurrentStock = (products = []) => {
  return products.reduce(
    (acc, product) => {
      const { units, purchaseValue } = getStockValuation(product);
      if (units === 0) return acc;

      if (product.type === PRODUCT_TYPES.LAPTOP) acc.laptops += units;
      else acc.accessories += units;
      acc.purchaseValue += purchaseValue;
      return acc;
    },
    { laptops: 0, accessories: 0, purchaseValue: 0 }
  );
};

/** Price as a non-negative number; missing, non-numeric or negative prices count as 0. */
const toStockPrice = (value) => {
  const price = toSafeNumber(value);
  return price > 0 ? price : 0;
};

/**
 * Stock valuation of a single product, shared by the stock totals above and per-row exports:
 * units in stock (getUnitsInStock), current purchase/selling unit prices and line values.
 * The selling price falls back to the legacy `price` field of old documents.
 * @param {Object} product
 * @returns {{ units: number, unitCost: number, unitPrice: number, purchaseValue: number, retailValue: number }}
 */
export const getStockValuation = (product) => {
  const units = getUnitsInStock(product);
  if (units === 0) {
    return { units: 0, unitCost: 0, unitPrice: 0, purchaseValue: 0, retailValue: 0 };
  }
  const unitCost = toStockPrice(product.purchasePrice);
  const unitPrice = toStockPrice(product.sellingPrice !== undefined ? product.sellingPrice : product.price);
  return { units, unitCost, unitPrice, purchaseValue: unitCost * units, retailValue: unitPrice * units };
};
