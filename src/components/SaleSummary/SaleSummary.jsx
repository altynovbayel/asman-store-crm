import { formatPrice } from '../../utils/formatPrice';
import styles from './SaleSummary.module.scss';

const SaleSummary = ({
  subtotal = 0,
  totalDiscount = 0,
  grandTotal = 0
}) => {
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.row}>
        <span className={styles.label}>Промежуточный итог:</span>
        <span className={styles.value}>{formatPrice(subtotal)} сом</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Общая скидка:</span>
        <span className={`${styles.value} ${styles.discountText}`}>
          {totalDiscount > 0 ? `-${formatPrice(totalDiscount)} сом` : '0 сом'}
        </span>
      </div>

      <div className={`${styles.row} ${styles.grandTotalRow}`}>
        <span className={styles.grandLabel}>Итого к оплате:</span>
        <span className={styles.grandValue}>{formatPrice(grandTotal)} сом</span>
      </div>
    </div>
  );
};

export default SaleSummary;
