import { formatPrice } from '../../utils/formatPrice';
import styles from './SaleSummary.module.scss';

const SaleSummary = ({
  subtotal = 0,
  discount = '0',
  onDiscountChange,
  grandTotal = 0,
  error = ''
}) => {
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.row}>
        <span className={styles.label}>Промежуточный итог:</span>
        <span className={styles.value}>{formatPrice(subtotal)} сом</span>
      </div>

      <div className={styles.discountRow}>
        <label className={styles.discountLabel} htmlFor="summary-discount">Скидка (сом):</label>
        <div className={styles.inputContainer}>
          <input
            id="summary-discount"
            type="number"
            step="1"
            min="0"
            className={`${styles.discountInput} ${error ? styles.inputError : ''}`}
            placeholder="0.00 сом"
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value)}
          />
          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      </div>

      <div className={`${styles.row} ${styles.grandTotalRow}`}>
        <span className={styles.grandLabel}>Итого к оплате:</span>
        <span className={styles.grandValue}>{formatPrice(grandTotal)} сом</span>
      </div>
    </div>
  );
};

export default SaleSummary;
