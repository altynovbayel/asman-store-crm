import { PRODUCT_TYPES } from '../../../constants/productTypes';
import { PRODUCT_STATUS } from '../../../constants/productStatus';

/**
 * Calculates the total revenue from a list of sales.
 * Revenue is the sum of the final checkout grand totals.
 * @param {Array} sales 
 * @returns {number}
 */
export const calculateRevenue = (sales = []) => {
  return sales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
};

/**
 * Calculates profit for a single sale.
 * Profit = (salePrice - discount - purchasePrice) * quantity.
 * @param {Object} sale 
 * @returns {number}
 */
export const calculateSingleSaleProfit = (sale) => {
  const saleItems = sale.items || [];
  return saleItems.reduce((itemProfitSum, item) => {
    const purchasePrice = item.purchasePrice !== undefined ? item.purchasePrice : 0;
    const salePrice = item.salePrice !== undefined ? item.salePrice : (item.unitPrice || item.price || 0);
    const discount = item.discount !== undefined ? item.discount : (item.itemDiscount || 0);
    const profitPerUnit = salePrice - discount - purchasePrice;
    return itemProfitSum + (profitPerUnit * (item.quantity || 0));
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
    
    const revenue = sale.grandTotal || 0;
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
  return products.reduce((sum, p) => {
    const units = getUnitsInStock(p);
    if (units === 0) return sum;
    const price = Number(p.sellingPrice !== undefined ? p.sellingPrice : p.price);
    const unitPrice = Number.isFinite(price) && price > 0 ? price : 0;
    return sum + (unitPrice * units);
  }, 0);
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
    const qty = Number(product.quantity);
    return Number.isFinite(qty) && qty > 0 ? qty : 0;
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
      const units = getUnitsInStock(product);
      if (units === 0) return acc;

      const price = Number(product.purchasePrice);
      const unitCost = Number.isFinite(price) && price > 0 ? price : 0;

      if (product.type === PRODUCT_TYPES.LAPTOP) acc.laptops += units;
      else acc.accessories += units;
      acc.purchaseValue += unitCost * units;
      return acc;
    },
    { laptops: 0, accessories: 0, purchaseValue: 0 }
  );
};
