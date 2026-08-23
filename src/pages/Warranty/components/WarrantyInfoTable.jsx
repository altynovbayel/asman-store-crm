import { formatDate } from '../../../utils/formatDate';
import { getProductDisplayName } from '../../../utils/getProductDisplayName';
import styles from './Warranty.module.scss';

const WarrantyInfoTable = ({ sale, storeSettings }) => {
  const laptopItem = sale?.items?.[0] || {};
  
  // Use settings default if not specified on the item level
  const warrantyPeriod = laptopItem.warrantyMonths !== undefined 
    ? laptopItem.warrantyMonths 
    : (storeSettings?.defaultWarrantyMonths !== undefined ? storeSettings.defaultWarrantyMonths : 12);

  const storeName = storeSettings?.storeName || '—';
  const storePhone = storeSettings?.phone || storeSettings?.storePhone || '—';
  const storeAddress = storeSettings?.address || '—';

  return (
    <div className={styles.infoSection}>
      {/* Left Column Table */}
      <div className={styles.tableBlock}>
        <h3 className={styles.tableTitle}>Информация о товаре</h3>
        <table className={styles.infoTable}>
          <tbody>
            <tr>
              <td className={styles.label}>Модель</td>
              <td className={styles.value}>{getProductDisplayName(laptopItem) || '—'}</td>
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
              <td className={styles.label}>Адрес</td>
              <td className={styles.value}>{storeAddress}</td>
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
