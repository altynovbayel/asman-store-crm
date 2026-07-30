import { Edit3, Trash2 } from 'lucide-react';
import Table from '../Table/Table';
import Button from '../Button/Button';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { formatPrice } from '../../utils/formatPrice';
import styles from './ProductTable.module.scss';

const ProductTable = ({
  products = [],
  loading = false,
  isAdmin = false,
  onEdit,
  onDelete
}) => {
  const columns = [
    {
      title: 'Название товара',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className={styles.productName}>{name}</span>
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span className={`${styles.typeBadge} ${type === PRODUCT_TYPES.LAPTOP ? styles.typeLaptop : styles.typeAccessory}`}>
          {type === PRODUCT_TYPES.LAPTOP ? 'Ноутбук' : 'Аксессуар'}
        </span>
      )
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu) => cpu || '—'
    },
    {
      title: 'RAM',
      dataIndex: 'ram',
      key: 'ram',
      render: (ram) => ram || '—'
    },
    {
      title: 'SSD',
      dataIndex: 'ssd',
      key: 'ssd',
      render: (ssd) => ssd || '—'
    },
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (barcode) => <code className={styles.barcode}>{barcode}</code>
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty) => {
        if (qty === 0) return <span className={`${styles.stockBadge} ${styles.outOfStock}`}>Нет в наличии</span>;
        if (qty < 5) return <span className={`${styles.stockBadge} ${styles.lowStock}`}>{qty} шт</span>;
        return <span className={`${styles.stockBadge} ${styles.inStock}`}>{qty} шт</span>;
      }
    },
    {
      title: 'Цена закупки',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: (purchasePrice) => purchasePrice !== undefined && purchasePrice !== null ? `${formatPrice(purchasePrice)} сом` : '—'
    },
    {
      title: 'Цена продажи',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (sellingPrice, record) => {
        const price = sellingPrice !== undefined ? sellingPrice : record.price;
        return `${formatPrice(price)} сом`;
      }
    }
  ];

  // Append actions column for admin users
  if (isAdmin) {
    columns.push({
      title: 'Действия',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div className={styles.actionsCell}>
          <Button
            variant="text"
            size="sm"
            icon={Edit3}
            onClick={() => onEdit(record)}
            aria-label="Редактировать"
          />
          <Button
            variant="text"
            size="sm"
            icon={Trash2}
            className={styles.deleteBtn}
            onClick={() => onDelete(record.id)}
            aria-label="Удалить"
          />
        </div>
      )
    });
  }

  return (
    <Table
      columns={columns}
      dataSource={products}
      loading={loading}
      emptyText="Товары в каталоге не найдены"
      className={styles.table}
    />
  );
};

export default ProductTable;
