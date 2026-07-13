import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import styles from './Warehouse.module.scss';

const Warehouse = () => {
  const [movements] = useState([
    { id: 'MOV-102', sku: 'IPH15PM-256', qty: '+10 шт.', type: 'Приход', operator: 'А. Махмудов', time: '13.07.2026 15:30' },
    { id: 'MOV-101', sku: 'APP2-WRLS', qty: '-3 шт.', type: 'Расход', operator: 'С. Алиев', time: '13.07.2026 14:15' },
    { id: 'MOV-100', sku: 'AW9-45ALM', qty: '-1 шт.', type: 'Расход', operator: 'С. Алиев', time: '12.07.2026 18:00' },
    { id: 'MOV-099', sku: 'CHG-20W-USB', qty: '+50 шт.', type: 'Приход', operator: 'А. Махмудов', time: '12.07.2026 11:00' }
  ]);

  const criticalStock = [
    { sku: 'AW9-45ALM', name: 'Apple Watch Series 9', stock: 8, minRequired: 15 },
    { sku: 'MBP14-M3-512', name: 'MacBook Pro M3', stock: 0, minRequired: 5 }
  ];

  const columns = [
    { title: 'ID операции', dataIndex: 'id', key: 'id' },
    { title: 'Артикул / SKU', dataIndex: 'sku', key: 'sku', render: (sku) => <code className={styles.sku}>{sku}</code> },
    { 
      title: 'Тип операции', 
      dataIndex: 'type', 
      key: 'type',
      render: (type) => (
        <span className={`${styles.typeBadge} ${type === 'Приход' ? styles.typeIn : styles.typeOut}`}>
          {type === 'Приход' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
          {type}
        </span>
      )
    },
    { 
      title: 'Кол-во', 
      dataIndex: 'qty', 
      key: 'qty',
      render: (qty) => <span className={qty.startsWith('+') ? styles.textSuccess : styles.textDanger}>{qty}</span>
    },
    { title: 'Оператор', dataIndex: 'operator', key: 'operator' },
    { title: 'Время', dataIndex: 'time', key: 'time' }
  ];

  return (
    <div className={styles.warehousePage}>
      {/* Overview stats */}
      <div className={styles.overviewGrid}>
        <Card title="Заполненность склада" className={styles.capacityCard}>
          <div className={styles.capacityContainer}>
            <div className={styles.capacityProgress}>
              <div className={styles.progressBar} style={{ width: '64%' }}>
                <span className={styles.progressLabel}>64%</span>
              </div>
            </div>
            <p className={styles.capacitySubtext}>Использовано: 3,200 м³ из 5,000 м³ доступной площади</p>
          </div>
        </Card>

        <Card title="Зоны хранения" className={styles.zonesCard}>
          <div className={styles.zonesList}>
            <div className={styles.zoneItem}>
              <span className={styles.zoneName}>Зона А (Электроника)</span>
              <span className={styles.zoneValue}>82% заполн.</span>
            </div>
            <div className={styles.zoneItem}>
              <span className={styles.zoneName}>Зона B (Аксессуары)</span>
              <span className={styles.zoneValue}>45% заполн.</span>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.contentGrid}>
        {/* Activity Log */}
        <div className={styles.activityColumn}>
          <Card title="Журнал движения товаров" subtitle="Записи о приемке и списании товаров">
            <Table columns={columns} dataSource={movements} />
          </Card>
        </div>

        {/* Alerts Sidebar */}
        <div className={styles.alertsColumn}>
          <Card title="Критические остатки" subtitle="Товары, требующие закупки">
            <div className={styles.alertsList}>
              {criticalStock.map((item, index) => (
                <div key={index} className={styles.alertCard}>
                  <div className={styles.alertHeader}>
                    <AlertTriangle size={18} className={styles.alertIcon} />
                    <span className={styles.alertSku}>{item.sku}</span>
                  </div>
                  <h4 className={styles.alertTitle}>{item.name}</h4>
                  <div className={styles.alertMeta}>
                    <span>Остаток: <strong>{item.stock} шт</strong></span>
                    <span>Минимум: <strong>{item.minRequired} шт</strong></span>
                  </div>
                  <div className={styles.progressBarWrapper}>
                    <div 
                      className={`${styles.miniProgress} ${item.stock === 0 ? styles.zero : styles.low}`} 
                      style={{ width: `${(item.stock / item.minRequired) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Warehouse;
