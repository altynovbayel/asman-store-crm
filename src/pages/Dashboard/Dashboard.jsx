import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package
} from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const [orders] = useState([
    { id: 'ORD-001', client: 'Алишер Махмудов', date: '13.07.2026', amount: '45,000 ₸', status: 'Выполнен' },
    { id: 'ORD-002', client: 'Динара Султанова', date: '12.07.2026', amount: '128,500 ₸', status: 'В обработке' },
    { id: 'ORD-003', client: 'Мирас Кусаинов', date: '11.07.2026', amount: '89,000 ₸', status: 'Выполнен' },
    { id: 'ORD-004', client: 'Анель Ибрагимова', date: '11.07.2026', amount: '12,400 ₸', status: 'Отменен' },
    { id: 'ORD-005', client: 'Руслан Ахметов', date: '10.07.2026', amount: '210,000 ₸', status: 'В обработке' }
  ]);

  const stats = [
    {
      title: 'Общая выручка',
      value: '1,248,500 c',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      colorClass: styles.blue
    },
    {
      title: 'Продано',
      value: '324 шт.',
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
      colorClass: styles.green
    },
    {
      title: 'Остаток',
      value: '1,842 тов.',
      change: '-1.5%',
      isPositive: false,
      icon: Package,
      colorClass: styles.purple
    },
  ];

  const columns = [
    { title: 'ID заказа', dataIndex: 'id', key: 'id' },
    { title: 'Клиент', dataIndex: 'client', key: 'client' },
    { title: 'Дата', dataIndex: 'date', key: 'date' },
    { title: 'Сумма', dataIndex: 'amount', key: 'amount' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let badgeClass = styles.badgeWarning;
        if (status === 'Выполнен') badgeClass = styles.badgeSuccess;
        if (status === 'Отменен') badgeClass = styles.badgeDanger;
        return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
      }
    }
  ];

  return (
    <div className={styles.dashboard}>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} bordered hoverable className={styles.statCard}>
              <div className={styles.statHeader}>
                <div className={`${styles.iconContainer} ${stat.colorClass}`}>
                  <Icon size={24} />
                </div>
                <span className={`${styles.changeBadge} ${stat.isPositive ? styles.positive : styles.negative}`}>
                  {stat.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stat.change}
                </span>
              </div>
              <div className={styles.statBody}>
                <h4 className={styles.statValue}>{stat.value}</h4>
                <p className={styles.statTitle}>{stat.title}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Orders & Quick Actions */}
      <div className={styles.mainGrid}>
        <div className={styles.ordersCardWrapper}>
          <Card
            title="История"
            subtitle="Список недавно совершенных транзакций"
            
          >
            <Table columns={columns} dataSource={orders} />
          </Card>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
