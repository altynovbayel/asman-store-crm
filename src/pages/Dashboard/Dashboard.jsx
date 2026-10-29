import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  ShoppingBag,
  Receipt,
  Laptop,
  Headphones,
  Wallet,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Loader from '../../components/Loader/Loader';
import Empty from '../../components/Empty/Empty';
import Button from '../../components/Button/Button';
import { useAuth } from '../../store/AuthContext';
import { useProducts } from '../../store/ProductsContext';
import { getSalesForDateRange } from '../Reports/services/reports.service';
import { getDateRange } from '../Reports/utils/dateRange';
import {
  calculateRevenue,
  calculateProfit,
  calculateSalesCount,
  calculateAverageCheck,
  calculateCurrentStock
} from '../Reports/utils/reportCalculations';
import { getRecentSales } from '../../services/firebase/sales.service';
import { getPaymentMethodLabel } from '../../utils/getPaymentMethodLabel';
import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import styles from './Dashboard.module.scss';

const RECENT_SALES_LIMIT = 5;

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <Card bordered className={styles.statCard}>
    <div className={styles.statHeader}>
      <div className={`${styles.iconContainer} ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>
    <div className={styles.statBody}>
      <h4 className={styles.statValue}>{value}</h4>
      <p className={styles.statTitle}>{title}</p>
    </div>
  </Card>
);

const ErrorState = ({ message, onRetry }) => (
  <Card className={styles.stateCard}>
    <Empty
      icon={AlertTriangle}
      title="Не удалось загрузить данные"
      description={message}
      action={onRetry ? <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>Повторить</Button> : null}
    />
  </Card>
);

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { products, loading: productsLoading, error: productsError, retry: retryProducts } = useProducts();

  // Today's sales and the latest sales: two one-shot queries per load (no realtime subscription)
  const [salesState, setSalesState] = useState({
    status: 'loading',
    todaySales: [],
    recentSales: [],
    error: '',
    loadedAt: null
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadSales = async () => {
      const now = new Date();
      const { startDate, endDate } = getDateRange('today', '', '', now);
      try {
        const [todaySales, recentSales] = await Promise.all([
          getSalesForDateRange(startDate, endDate),
          getRecentSales(RECENT_SALES_LIMIT)
        ]);
        if (!cancelled) {
          setSalesState({ status: 'ready', todaySales, recentSales, error: '', loadedAt: now });
        }
      } catch (err) {
        if (!cancelled) {
          setSalesState({
            status: 'error',
            todaySales: [],
            recentSales: [],
            error: err.message || 'Ошибка загрузки продаж.',
            loadedAt: null
          });
        }
      }
    };

    loadSales();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRefresh = () => {
    setSalesState((prev) => ({ ...prev, status: 'loading' }));
    setReloadKey((key) => key + 1);
    // Products come from a realtime subscription; re-subscribe only if it ended with an error
    if (productsError) retryProducts();
  };

  // Same business definitions as Reports (historical sale snapshots)
  const todayKpi = useMemo(() => {
    const sales = salesState.todaySales;
    return {
      revenue: calculateRevenue(sales),
      profit: calculateProfit(sales),
      count: calculateSalesCount(sales),
      averageCheck: calculateAverageCheck(sales)
    };
  }, [salesState.todaySales]);

  const stock = useMemo(() => calculateCurrentStock(products), [products]);

  const salesStats = [
    { title: 'Выручка за сегодня', value: `${formatPrice(todayKpi.revenue)} сом`, icon: TrendingUp, colorClass: styles.blue },
    // Profit is admin-level data, like Reports
    isAdmin && { title: 'Прибыль за сегодня', value: `${formatPrice(todayKpi.profit)} сом`, icon: Coins, colorClass: styles.green },
    { title: 'Продаж за сегодня', value: `${todayKpi.count} шт`, icon: ShoppingBag, colorClass: styles.orange },
    { title: 'Средний чек за сегодня', value: `${formatPrice(todayKpi.averageCheck)} сом`, icon: Receipt, colorClass: styles.purple }
  ].filter(Boolean);

  const stockStats = [
    { title: 'Ноутбуков в наличии', value: `${stock.laptops} шт`, icon: Laptop, colorClass: styles.blue },
    { title: 'Аксессуаров в наличии', value: `${stock.accessories} шт`, icon: Headphones, colorClass: styles.purple },
    // Purchase cost is admin-level data, like the Reports inventory tab
    isAdmin && { title: 'Закупочная стоимость склада', value: `${formatPrice(stock.purchaseValue)} сом`, icon: Wallet, colorClass: styles.orange }
  ].filter(Boolean);

  const recentColumns = [
    {
      title: '№ продажи',
      dataIndex: 'saleNumber',
      key: 'saleNumber',
      render: (num) => <span className={styles.saleNumber}>{num || '—'}</span>
    },
    {
      title: 'Время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date)
    },
    {
      title: 'Продавец',
      dataIndex: 'managerName',
      key: 'managerName',
      render: (name) => name || '—'
    },
    {
      title: 'Сумма',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      render: (total) => <strong>{formatPrice(total || 0)} сом</strong>
    },
    {
      title: 'Оплата',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => getPaymentMethodLabel(method) || '—'
    }
  ];

  const salesLoading = salesState.status === 'loading';

  return (
    <div className={styles.dashboard}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarText}>
          {salesState.loadedAt ? `Данные на ${formatDate(salesState.loadedAt)}` : 'Загрузка данных...'}
        </span>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleRefresh} disabled={salesLoading}>
          Обновить
        </Button>
      </div>

      {/* Today's sales KPI */}
      <section className={styles.section}>
        {/* The date makes it clear which day is shown if the page stays open past midnight */}
        <h3 className={styles.sectionTitle}>
          Продажи за сегодня{salesState.loadedAt ? `, ${formatDate(salesState.loadedAt).slice(0, 10)}` : ''}
        </h3>
        {salesLoading ? (
          <Loader text="Загрузка продаж..." />
        ) : salesState.status === 'error' ? (
          <ErrorState message={salesState.error} onRetry={handleRefresh} />
        ) : (
          <div className={styles.statsGrid}>
            {salesStats.map((stat) => <StatCard key={stat.title} {...stat} />)}
          </div>
        )}
      </section>

      {/* Current warehouse stock */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Склад сейчас</h3>
        {productsLoading ? (
          <Loader text="Загрузка склада..." />
        ) : productsError ? (
          <ErrorState message={productsError.message || 'Ошибка загрузки товаров.'} onRetry={retryProducts} />
        ) : (
          <div className={styles.statsGrid}>
            {stockStats.map((stat) => <StatCard key={stat.title} {...stat} />)}
          </div>
        )}
      </section>

      {/* Latest sales */}
      <section className={styles.section}>
        {salesState.status === 'error' ? null : (
          <Card title="Последние продажи" subtitle={`${RECENT_SALES_LIMIT} последних оформленных продаж`}>
            <Table
              columns={recentColumns}
              dataSource={salesState.recentSales}
              loading={salesLoading}
              emptyText="Продаж пока нет"
            />
          </Card>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
