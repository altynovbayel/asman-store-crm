import { WARRANTY_CONDITIONS, WARRANTY_EXCLUSIONS, CLAIM_PROCEDURE } from '../../../constants/warrantyTerms';
import styles from './Warranty.module.scss';

const WarrantyConditions = () => {
  return (
    <div className={styles.termsSection}>
      <div className={styles.termBlock}>
        <h4 className={styles.termTitle}>Условия гарантии</h4>
        <ol className={styles.termList}>
          {WARRANTY_CONDITIONS.map((cond, idx) => (
            <li key={idx}>{cond}</li>
          ))}
        </ol>
      </div>

      <div className={styles.termBlock}>
        <h4 className={styles.termTitle}>Исключения из гарантии</h4>
        <ol className={styles.termList}>
          {WARRANTY_EXCLUSIONS.map((ex, idx) => (
            <li key={idx}>{ex}</li>
          ))}
        </ol>
      </div>

      <div className={styles.termBlock}>
        <h4 className={styles.termTitle}>Порядок обращения по гарантии</h4>
        <ol className={styles.termList}>
          {CLAIM_PROCEDURE.map((proc, idx) => (
            <li key={idx}>{proc}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default WarrantyConditions;
