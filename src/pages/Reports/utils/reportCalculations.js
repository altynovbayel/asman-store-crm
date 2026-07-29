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
  const managerGroups = {};

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
 * Calculates the total sum of product units in stock.
 * @param {Array} products 
 * @returns {number}
 */
export const calculateTotalProducts = (products = []) => {
  return products.reduce((sum, p) => sum + (p.quantity || 0), 0);
};

/**
 * Calculates the total purchase cost value of the current inventory.
 * @param {Array} products 
 * @returns {number}
 */
export const calculateInventoryPurchaseValue = (products = []) => {
  return products.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.quantity || 0)), 0);
};

/**
 * Calculates the total retail value of the current inventory.
 * @param {Array} products 
 * @returns {number}
 */
export const calculateInventoryRetailValue = (products = []) => {
  return products.reduce((sum, p) => {
    const sellingPrice = p.sellingPrice !== undefined ? p.sellingPrice : (p.price || 0);
    return sum + (sellingPrice * (p.quantity || 0));
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
