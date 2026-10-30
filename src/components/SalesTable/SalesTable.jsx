import Table from '../Table/Table';
import { formatDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';
import { formatSalePaymentMethod } from '../../utils/getPaymentMethodLabel';
import { calculateSaleUnitsCount } from '../../pages/Reports/utils/reportCalculations';
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
      render: (_, record) => formatSalePaymentMethod(record) || '—'
    },
    {
      title: 'Позиций',
      dataIndex: 'items',
      key: 'items',
      render: (items) => `${calculateSaleUnitsCount({ items })} шт`
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
