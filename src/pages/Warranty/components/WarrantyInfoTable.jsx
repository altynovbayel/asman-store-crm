import { formatDate } from '../../../utils/formatDate';
import styles from './Warranty.module.scss';

const WarrantyInfoTable = ({ sale, storeSettings }) => {
  const laptopItem = sale?.items?.[0] || {};
  const warrantyPeriod = laptopItem.warrantyMonths !== undefined ? laptopItem.warrantyMonths : 12;
  const storeName = storeSettings?.storeName || 'ASMAN STORE';
  const storePhone = storeSettings?.phone || storeSettings?.storePhone || '—';

  return (
    <div className={styles.infoSection}>
      {/* Left Column Table */}
      <div className={styles.tableBlock}>
        <h3 className={styles.tableTitle}>Информация о товаре</h3>
        <table className={styles.infoTable}>
          <tbody>
            <tr>
              <td className={styles.label}>Модель</td>
              <td className={styles.value}>{laptopItem.productName || '—'}</td>
            </tr>
            <tr>
              <td className={styles.label}>Штрихкод</td>
              <td className={styles.value}>
                {laptopItem.barcode ? <code>{laptopItem.barcode}</code> : '—'}
              </td>
            </tr>
            <tr>
              <td className={styles.label}>Дата продажи</td>
              <td className={styles.value}>{formatDate(sale?.createdAt)}</td>
            </tr>
            <tr>
              <td className={styles.label}>Срок гарантии</td>
              <td className={styles.value}>{warrantyPeriod} месяцев</td>
            </tr>
            <tr>
              <td className={styles.label}>Номер гарантии</td>
              <td className={styles.value}>{sale?.saleNumber || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Right Column Table */}
      <div className={styles.tableBlock}>
        <h3 className={styles.tableTitle}>Информация о продавце</h3>
        <table className={styles.infoTable}>
          <tbody>
            <tr>
              <td className={styles.label}>Продавец</td>
              <td className={styles.value}>{sale?.managerName || '—'}</td>
            </tr>
            <tr>
              <td className={styles.label}>Магазин</td>
              <td className={styles.value}>{storeName}</td>
            </tr>
            <tr>
              <td className={styles.label}>Телефон</td>
              <td className={styles.value}>{storePhone}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarrantyInfoTable;
