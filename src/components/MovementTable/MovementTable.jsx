import Table from '../Table/Table';
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../../constants/movementTypes';
import { formatDate } from '../../utils/formatDate';
import styles from './MovementTable.module.scss';

const MovementTable = ({
  movements = [],
  loading = false,
  onRowClick
}) => {
  const columns = [
    {
      title: 'Номер',
      dataIndex: 'movementNumber',
      key: 'movementNumber',
      render: (num) => <span className={styles.movNumber}>{num}</span>
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let badgeClass = styles.badgeAdj;
        if (type === MOVEMENT_TYPES.IN) badgeClass = styles.badgeIn;
        if (type === MOVEMENT_TYPES.OUT) badgeClass = styles.badgeOut;
        if (type === MOVEMENT_TYPES.RETURN) badgeClass = styles.badgeReturn;
        
        return (
          <span className={`${styles.badge} ${badgeClass}`}>
            {MOVEMENT_TYPE_LABELS[type] || type}
          </span>
        );
      }
    },
    {
      title: 'Товар',
      dataIndex: 'productName',
      key: 'productName',
      render: (name) => <span className={styles.productName}>{name}</span>
    },
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (code) => <code className={styles.barcode}>{code}</code>
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => {
        // Show difference sign for Adjustments or generic delta indications
        const prefix = record.type === MOVEMENT_TYPES.OUT ? '-' : record.type === MOVEMENT_TYPES.IN ? '+' : '';
        return (
          <span className={`${styles.quantity} ${record.type === MOVEMENT_TYPES.OUT ? styles.textDanger : record.type === MOVEMENT_TYPES.IN ? styles.textSuccess : ''}`}>
            {prefix}{qty} шт
          </span>
        );
      }
    },
    {
      title: 'До',
      dataIndex: 'stockBefore',
      key: 'stockBefore',
      render: (before) => `${before} шт`
    },
    {
      title: 'После',
      dataIndex: 'stockAfter',
      key: 'stockAfter',
      render: (after) => <strong className={styles.afterStock}>{after} шт</strong>
    },
    {
      title: 'Менеджер',
      dataIndex: 'managerName',
      key: 'managerName'
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date)
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={movements}
      loading={loading}
      onRowClick={onRowClick}
      emptyText="История перемещений на складе пуста"
      className={styles.table}
    />
  );
};

export default MovementTable;
