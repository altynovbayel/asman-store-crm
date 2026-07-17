import { useState } from 'react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import styles from './Warehouse.module.scss';

const Warehouse = () => {
  const [movements] = useState([
    { id: 'ORD-102', sku: 'IPH15PM-256', qty: '+10 шт.', type: 'Приход', operator: 'А. Махмудов', time: '13.07.2026 15:30' },
    { id: 'ORD-101', sku: 'APP2-WRLS', qty: '-3 шт.', type: 'Расход', operator: 'С. Алиев', time: '13.07.2026 14:15' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'ORD-099', sku: 'CHG-20W-USB', qty: '+50 шт.', type: 'Приход', operator: 'А. Махмудов', time: '12.07.2026 11:00' }
  ]);

  const columns = [
    { title: 'ORD', dataIndex: 'sku', key: 'sku', render: (sku) => <code className={styles.sku}>{sku}</code> },
    { 
      title: 'Кол-во', 
      dataIndex: 'qty', 
      key: 'qty',
      render: (qty) => <span className={qty.startsWith('+') ? styles.textSuccess : styles.textDanger}>{qty}</span>
    },
    { title: 'Менеджер', dataIndex: 'operator', key: 'operator' },
    { title: 'Время', dataIndex: 'time', key: 'time' }
  ];

  return (
    <div className={styles.warehousePage}>
      <Card title="Движение товаров" className={styles.activityCard}>
        <Table columns={columns} dataSource={movements} className={styles.activityTable} />
      </Card>
    </div>
  );
};

export default Warehouse;
