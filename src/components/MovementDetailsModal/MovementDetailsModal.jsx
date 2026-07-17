import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../../constants/movementTypes';
import { formatDate } from '../../utils/formatDate';
import styles from './MovementDetailsModal.module.scss';

const MovementDetailsModal = ({
  isOpen,
  onClose,
  movement = null
}) => {
  if (!movement) return null;

  let badgeClass = styles.badgeAdj;
  if (movement.type === MOVEMENT_TYPES.IN) badgeClass = styles.badgeIn;
  if (movement.type === MOVEMENT_TYPES.OUT) badgeClass = styles.badgeOut;
  if (movement.type === MOVEMENT_TYPES.RETURN) badgeClass = styles.badgeReturn;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Детали операции ${movement.movementNumber}`}
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      }
    >
      <div className={styles.detailsList}>
        <div className={styles.detailItem}>
          <span className={styles.label}>Номер операции:</span>
          <span className={styles.value}>
            <strong className={styles.number}>{movement.movementNumber}</strong>
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Товар:</span>
          <span className={styles.value}>{movement.productName}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Штрихкод:</span>
          <span className={styles.value}>
            <code className={styles.barcode}>{movement.barcode}</code>
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Тип операции:</span>
          <span className={styles.value}>
            <span className={`${styles.badge} ${badgeClass}`}>
              {MOVEMENT_TYPE_LABELS[movement.type] || movement.type}
            </span>
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Количество:</span>
          <span className={styles.value}>
            <strong>{movement.quantity} шт</strong>
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Остаток до:</span>
          <span className={styles.value}>{movement.stockBefore} шт</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Остаток после:</span>
          <span className={styles.value}>
            <strong>{movement.stockAfter} шт</strong>
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Менеджер:</span>
          <span className={styles.value}>{movement.managerName}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.label}>Дата операции:</span>
          <span className={styles.value}>{formatDate(movement.createdAt)}</span>
        </div>

        <div className={`${styles.detailItem} ${styles.commentBlock}`}>
          <span className={styles.label}>Комментарий:</span>
          <p className={styles.commentText}>
            {movement.comment || <span className={styles.noComment}>Без комментария</span>}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MovementDetailsModal;
