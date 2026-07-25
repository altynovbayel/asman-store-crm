import styles from './Warranty.module.scss';

const WarrantyFooter = ({ sale }) => {
  return (
    <>
      {/* Signatures Area */}
      <div className={styles.signatureSection}>
        <div className={styles.signatureBlock}>
          <span className={styles.sigTitle}>Подпись продавца:</span>
          <div className={styles.sigLineContainer}>
            <div className={styles.sigLine} />
            <span className={styles.sigName}>{sale?.managerName || '________________________'}</span>
          </div>
        </div>
        
        
      </div>

      {/* Buyer Details bottom line */}
      <div className={styles.buyerSection}>
        <div className={styles.buyerInfo}>
          <span className={styles.buyerLabel}>Покупатель</span>
          <span className={styles.buyerValue}>{sale?.customerName || '—'}</span>
        </div>
        <div className={styles.buyerInfo}>
          <span className={styles.buyerLabel}>Телефон покупателя</span>
          <span className={styles.buyerValue}>{sale?.customerPhone || '—'}</span>
        </div>
      </div>
    </>
  );
};

export default WarrantyFooter;
