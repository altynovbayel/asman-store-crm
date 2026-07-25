import Table from '../Table/Table';
import { formatDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';
import { PAYMENT_METHOD_LABELS } from '../../constants/paymentMethods';
import styles from './SalesTable.module.scss';

const SalesTable = ({
  sales = [],
  loading = false,
  onRowClick
}) => {
  const columns = [
    {
      title: 'Номер чека',
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
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => PAYMENT_METHOD_LABELS[method] || '—'
    },
    {
      title: 'Позиций',
      dataIndex: 'items',
      key: 'items',
      render: (items) => {
        const totalQty = items ? items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
        return `${totalQty} шт`;
      }
    },
    {
      title: 'Сумма',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (total) => <strong className={styles.total}>{formatPrice(total)} сом</strong>
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
      dataSource={sales}
      loading={loading}
      onRowClick={onRowClick}
      emptyText="Продажи не найдены"
      className={styles.table}
    />
  );
};

export default SalesTable;
