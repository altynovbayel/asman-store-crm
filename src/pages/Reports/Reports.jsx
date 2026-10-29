import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TrendingUp, Coins, ShoppingBag, Receipt, Calendar, Package, FileSpreadsheet, FileText } from 'lucide-react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import Empty from '../../components/Empty/Empty';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import SaleDetailsModal from '../../components/SaleDetailsModal/SaleDetailsModal';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { useProducts } from '../../store/ProductsContext';
import { getSalesForDateRange } from './services/reports.service';
import { getDateRange } from './utils/dateRange';
import { deleteSale } from '../../services/firebase/sales.service';
import { getStoreSettings } from '../../services/firebase/settings.service';
import { DEFAULT_SETTINGS } from '../../constants/storeSettingsDefaults';
import { buildReportExportData } from './utils/exportData';
import {
  calculateRevenue,
  calculateProfit,
  calculateSalesCount,
  calculateAverageCheck,
  calculateSingleSaleProfit,
  calculateEmployeeStats,
  calculateTotalProducts,
  calculateInventoryPurchaseValue,
  calculateInventoryRetailValue,
  calculatePotentialProfit
} from './utils/reportCalculations';
import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import styles from './Reports.module.scss';

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const { products } = useProducts();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('kpi'); // kpi | sales | employees | inventory
  const [filterType, setFilterType] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sales, setSales] = useState([]);
  // Period the shown `sales` were loaded for (exports use exactly this period)
  const [loadedRange, setLoadedRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(null); // null | 'xlsx' | 'pdf'
  const exportingRef = useRef(false);
  const requestIdRef = useRef(0);

  // SaleDetailsModal states
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchSalesData = useCallback(async (range) => {
    if (!range) return;
    // Only the latest request may update the page: a slower response for a previously
    // selected period must not overwrite the data of the current one
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const fetched = await getSalesForDateRange(range.startDate, range.endDate);
      if (requestId !== requestIdRef.current) return;
      setSales(fetched);
      setLoadedRange(range);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        showError(err.message || 'Не удалось загрузить отчет.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [showError]);

  useEffect(() => {
    if (filterType !== 'custom') {
      const range = getDateRange(filterType);
      const executeFetch = async () => {
        await Promise.resolve();
        fetchSalesData(range);
      };
      executeFetch();
    }
  }, [filterType, fetchSalesData]);

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      showError('Выберите начальную и конечную даты.');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      showError('Начальная дата не может быть больше конечной.');
      return;
    }
    const range = getDateRange('custom', customStart, customEnd);
    fetchSalesData(range);
  };

  const handleDeleteSale = async (id) => {
    if (!isAdmin) {
      showError('У вас нет прав для выполнения этой операции.');
      return;
    }
    setDeleteLoading(true);
    try {
      const managerId = user?.uid || 'anonymous';
      const managerName = user?.displayName || user?.email || 'Администратор';
      await deleteSale(id, managerId, managerName);
      showSuccess('Продажа успешно удалена, складские остатки восстановлены.');
      setIsDetailsOpen(false);
      setSelectedSale(null);
      
      // Auto-update reports list
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      showError(err.message || 'Ошибка при удалении продажи.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRowClick = (record) => {
    setSelectedSale(record);
    setIsDetailsOpen(true);
  };

  // Memoized calculations for range metrics
  const revenue = useMemo(() => calculateRevenue(sales), [sales]);
  const profit = useMemo(() => calculateProfit(sales), [sales]);
  const salesCount = useMemo(() => calculateSalesCount(sales), [sales]);
  const averageCheck = useMemo(() => calculateAverageCheck(sales), [sales]);

  // Memoized employee summary stats
  const employeeData = useMemo(() => calculateEmployeeStats(sales), [sales]);

  // Memoized inventory summary metrics
  const totalInvProducts = useMemo(() => calculateTotalProducts(products), [products]);
  const invPurchaseVal = useMemo(() => calculateInventoryPurchaseValue(products), [products]);
  const invRetailVal = useMemo(() => calculateInventoryRetailValue(products), [products]);
  const invPotentialProfit = useMemo(() => calculatePotentialProfit(products), [products]);

  // Export uses the data already shown on the page (no extra sales query)
  const handleExport = async (kind) => {
    if (exportingRef.current || loading || !loadedRange) return;
    exportingRef.current = true;
    setExporting(kind);
    try {
      let storeName = DEFAULT_SETTINGS.storeName;
      try {
        storeName = (await getStoreSettings()).storeName || storeName;
      } catch {
        // Settings are optional for the report title; keep the default name
      }

      const data = buildReportExportData({
        range: loadedRange,
        sales,
        kpi: { revenue, profit, salesCount, averageCheck },
        employees: employeeData,
        products,
        inventory: {
          totalUnits: totalInvProducts,
          purchaseValue: invPurchaseVal,
          retailValue: invRetailVal,
          potentialProfit: invPotentialProfit
        },
        storeName
      });

      if (kind === 'xlsx') {
        const { downloadReportXlsx } = await import('./utils/exportXlsx');
        await downloadReportXlsx(data);
        showSuccess('Отчёт Excel скачан');
      } else {
        const { downloadReportPdf } = await import('./utils/exportPdf');
        await downloadReportPdf(data);
        showSuccess('PDF отчёт скачан');
      }
    } catch (err) {
      console.error('Report export failed:', err);
      showError(`Не удалось сформировать отчёт: ${err.message || 'неизвестная ошибка'}`);
    } finally {
      exportingRef.current = false;
      setExporting(null);
    }
  };

  const kpiStats = [
    {
      title: 'Выручка',
      value: `${formatPrice(revenue)} сом`,
      icon: TrendingUp,
      colorClass: styles.blue
    },
    {
      title: 'Прибыль',
      value: `${formatPrice(profit)} сом`,
      icon: Coins,
      colorClass: styles.green
    },
    {
      title: 'Количество продаж',
      value: `${salesCount} шт`,
      icon: ShoppingBag,
      colorClass: styles.amber
    },
    {
      title: 'Средний чек',
      value: `${formatPrice(averageCheck)} сом`,
      icon: Receipt,
      colorClass: styles.purple
    }
  ];

  const inventoryStats = [
    {
      title: 'Товаров на складе',
      value: `${totalInvProducts} шт`,
      icon: Package,
      colorClass: styles.blue
    },
    {
      title: 'Стоимость закупки',
      value: `${formatPrice(invPurchaseVal)} сом`,
      icon: Coins,
      colorClass: styles.amber
    },
    {
      title: 'Розничная стоимость',
      value: `${formatPrice(invRetailVal)} сом`,
      icon: TrendingUp,
      colorClass: styles.purple
    },
    {
      title: 'Потенциальная прибыль',
      value: `${formatPrice(invPotentialProfit)} сом`,
      icon: Receipt,
      colorClass: styles.green
    }
  ];

  // Table Columns Configurations
  const salesColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date)
    },
    {
      title: 'Номер продажи',
      dataIndex: 'saleNumber',
      key: 'saleNumber',
      render: (num) => <span className={styles.saleNumber}>{num}</span>
    },
    {
      title: 'Клиент',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name, record) => (
        <div className={styles.customerCell}>
          <span className={styles.name}>{name}</span>
          <span className={styles.phone}>{record.customerPhone}</span>
        </div>
      )
    },
    {
      title: 'Менеджер',
      dataIndex: 'managerName',
      key: 'managerName'
    },
    {
      title: 'Товаров',
      dataIndex: 'items',
      key: 'items',
      render: (items) => {
        const qty = items ? items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
        return `${qty} шт`;
      }
    },
    {
      title: 'Выручка',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (total) => <strong className={styles.bold}>{formatPrice(total)} сом</strong>
    },
    {
      title: 'Прибыль',
      key: 'profit',
      render: (_, record) => {
        const profitVal = calculateSingleSaleProfit(record);
        return <strong className={styles.bold}>{formatPrice(profitVal)} сом</strong>;
      }
    }
  ];

  const employeeColumns = [
    {
      title: 'Менеджер',
      dataIndex: 'manager',
      key: 'manager'
    },
    {
      title: 'Кол-во продаж',
      dataIndex: 'salesCount',
      key: 'salesCount',
      render: (count) => `${count} шт`
    },
    {
      title: 'Выручка',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (rev) => <strong className={styles.bold}>{formatPrice(rev)} сом</strong>
    },
    {
      title: 'Прибыль',
      dataIndex: 'profit',
      key: 'profit',
      render: (prof) => <strong className={styles.bold}>{formatPrice(prof)} сом</strong>
    },
    {
      title: 'Средний чек',
      dataIndex: 'averageCheck',
      key: 'averageCheck',
      render: (avg) => <strong className={styles.bold}>{formatPrice(avg)} сом</strong>
    }
  ];

  return (
    <div className={styles.reportsPage}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Аналитические отчеты</h1>
        {isAdmin && (
          <div className={styles.exportActions}>
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => handleExport('xlsx')}
              loading={exporting === 'xlsx'}
              disabled={!!exporting || loading || !loadedRange}
            >
              Скачать Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={() => handleExport('pdf')}
              loading={exporting === 'pdf'}
              disabled={!!exporting || loading || !loadedRange}
            >
              Скачать PDF
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'kpi' ? styles.active : ''}`}
          onClick={() => setActiveTab('kpi')}
        >
          Обзор KPI
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'sales' ? styles.active : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Отчет по продажам
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'employees' ? styles.active : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          Отчет по сотрудникам
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Отчет по складу
        </button>
      </div>

      {/* Date Filter Card (Hidden for Inventory Tab as it is live/current stock value) */}
      {activeTab !== 'inventory' && (
        <div className={styles.filtersContainer}>
          <div className={styles.filterButtons}>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === 'today' ? styles.active : ''}`}
              onClick={() => setFilterType('today')}
            >
              Сегодня
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === 'week' ? styles.active : ''}`}
              onClick={() => setFilterType('week')}
            >
              На этой неделе
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === 'month' ? styles.active : ''}`}
              onClick={() => setFilterType('month')}
            >
              В этом месяце
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${filterType === 'custom' ? styles.active : ''}`}
              onClick={() => setFilterType('custom')}
            >
              Другой период
            </button>
          </div>

          {filterType === 'custom' && (
            <div className={styles.customRangeInputs}>
              <div className={styles.dateInputGroup}>
                <label htmlFor="start-date">От:</label>
                <input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label htmlFor="end-date">До:</label>
                <input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={styles.applyBtn}
                onClick={handleApplyCustomRange}
              >
                Применить
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Stats and Lists Display */}
      {activeTab === 'inventory' ? (
        <div className={styles.statsGrid}>
          {inventoryStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} bordered hoverable className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.iconWrapper} ${stat.colorClass}`}>
                    <Icon size={22} />
                  </div>
                  <span className={styles.statTitle}>{stat.title}</span>
                </div>
                <h4 className={styles.statValue}>{stat.value}</h4>
              </Card>
            );
          })}
        </div>
      ) : loading ? (
        <div className={styles.loadingWrapper}>
          <Loader text="Сбор аналитики..." />
        </div>
      ) : sales.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty
            title="Продажи за выбранный период не найдены"
            description="Измените даты фильтрации или оформите новые продажи."
            icon={Calendar}
          />
        </Card>
      ) : activeTab === 'kpi' ? (
        <div className={styles.statsGrid}>
          {kpiStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} bordered hoverable className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.iconWrapper} ${stat.colorClass}`}>
                    <Icon size={22} />
                  </div>
                  <span className={styles.statTitle}>{stat.title}</span>
                </div>
                <h4 className={styles.statValue}>{stat.value}</h4>
              </Card>
            );
          })}
        </div>
      ) : activeTab === 'sales' ? (
        <Card className={styles.reportTableCard} bodyClassName={styles.reportTableCardBody}>
          <Table
            columns={salesColumns}
            dataSource={sales}
            loading={loading}
            onRowClick={handleRowClick}
            emptyText="Продажи за выбранный период не найдены"
          />
        </Card>
      ) : (
        <Card className={styles.reportTableCard} bodyClassName={styles.reportTableCardBody}>
          <Table
            columns={employeeColumns}
            dataSource={employeeData}
            loading={loading}
            emptyText="Продажи за выбранный период не найдены"
          />
        </Card>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
          onDeleteSale={handleDeleteSale}
          deleteLoading={deleteLoading}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default Reports;
