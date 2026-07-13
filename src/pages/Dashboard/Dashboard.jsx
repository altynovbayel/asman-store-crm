import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users as UsersIcon,
  Plus
} from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ client: '', amount: '', status: 'В обработке' });
  const [orders, setOrders] = useState([
    { id: 'ORD-001', client: 'Алишер Махмудов', date: '13.07.2026', amount: '45,000 ₸', status: 'Выполнен' },
    { id: 'ORD-002', client: 'Динара Султанова', date: '12.07.2026', amount: '128,500 ₸', status: 'В обработке' },
    { id: 'ORD-003', client: 'Мирас Кусаинов', date: '11.07.2026', amount: '89,000 ₸', status: 'Выполнен' },
    { id: 'ORD-004', client: 'Анель Ибрагимова', date: '11.07.2026', amount: '12,400 ₸', status: 'Отменен' },
    { id: 'ORD-005', client: 'Руслан Ахметов', date: '10.07.2026', amount: '210,000 ₸', status: 'В обработке' }
  ]);

  const stats = [
    {
      title: 'Общая выручка',
      value: '1,248,500 ₸',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      colorClass: styles.blue
    },
    {
      title: 'Активные заказы',
      value: '324 шт.',
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
      colorClass: styles.green
    },
    {
      title: 'Всего товаров',
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

  const handleCreateOrder = () => {
    if (!newOrder.client || !newOrder.amount) return;
    
    const formattedAmount = `${Number(newOrder.amount).toLocaleString('ru-RU')} ₸`;
    const today = new Date().toLocaleDateString('ru-RU');
    const orderId = `ORD-0${orders.length + 1}`;
    
    setOrders([
      { id: orderId, client: newOrder.client, date: today, amount: formattedAmount, status: newOrder.status },
      ...orders
    ]);
    
    setNewOrder({ client: '', amount: '', status: 'В обработке' });
    setIsModalOpen(false);
  };

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
            title="Последние заказы"
            subtitle="Список недавно совершенных транзакций"
            extra={
              <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
                Создать заказ
              </Button>
            }
          >
            <Table columns={columns} dataSource={orders} />
          </Card>
        </div>

        <div className={styles.quickActionsWrapper}>
          <Card title="Быстрые действия" subtitle="Панель оперативного управления">
            <div className={styles.actionsList}>
              <Button variant="outline" className={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
                Зарегистрировать продажу
              </Button>
              <Button variant="secondary" className={styles.actionBtn} onClick={() => window.location.pathname = '/products'}>
                Перейти в каталог товаров
              </Button>
              <Button variant="secondary" className={styles.actionBtn} onClick={() => window.location.pathname = '/warehouse'}>
                Проверить остатки склада
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* New Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Создание нового заказа"
        onSave={handleCreateOrder}
        saveText="Создать заказ"
        cancelText="Отмена"
      >
        <div className={styles.modalFields}>
          <Input
            label="Имя клиента"
            placeholder="Введите ФИО клиента"
            value={newOrder.client}
            onChange={(e) => setNewOrder({ ...newOrder, client: e.target.value })}
            required
          />
          <Input
            label="Сумма заказа (₸)"
            type="number"
            placeholder="Введите сумму в тенге"
            value={newOrder.amount}
            onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
            required
          />
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Статус заказа</label>
            <select
              className={styles.selectInput}
              value={newOrder.status}
              onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
            >
              <option value="В обработке">В обработке</option>
              <option value="Выполнен">Выполнен</option>
              <option value="Отменен">Отменен</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
