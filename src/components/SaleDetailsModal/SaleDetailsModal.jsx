import { useState } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import { formatDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { PAYMENT_METHOD_LABELS } from '../../constants/paymentMethods';
import WarrantyModal from '../../pages/Warranty/components/WarrantyModal';
import styles from './SaleDetailsModal.module.scss';

const SaleDetailsModal = ({
  isOpen,
  onClose,
  sale = null,
  isAdmin = false,
  onDeleteSale,
  deleteLoading = false
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);

  if (!sale) return null;

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    await onDeleteSale(sale.id);
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showConfirm}
        onClose={onClose}
        title={`Чек № ${sale.saleNumber}`}
        size="lg"
        footer={
          <div className={styles.modalFooter}>
            {isAdmin && (
              <Button
                variant="danger"
                onClick={handleDeleteClick}
                disabled={deleteLoading}
              >
                Удалить чек
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => setIsWarrantyOpen(true)}
            >
              Печать гарантии
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        }
      >
        <div className={styles.container}>
          {/* Metadata Grid */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.label}>Клиент:</span>
              <span className={styles.value}>
                <strong>{sale.customerName}</strong>
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.label}>Телефон:</span>
              <span className={styles.value}>{sale.customerPhone}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.label}>Менеджер:</span>
              <span className={styles.value}>{sale.managerName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.label}>Способ оплаты:</span>
              <span className={styles.value}>{PAYMENT_METHOD_LABELS[sale.paymentMethod] || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.label}>Дата продажи:</span>
              <span className={styles.value}>{formatDate(sale.createdAt)}</span>
            </div>
          </div>

          {/* Optional Comment Section */}
          {sale.comment && (
            <div className={styles.commentSection}>
              <span className={styles.commentLabel}>Примечание:</span>
              <p className={styles.commentContent}>{sale.comment}</p>
            </div>
          )}

          {/* Items Table */}
          <div className={styles.itemsSection}>
            <h4 className={styles.sectionTitle}>Купленные товары</h4>
            <div className={styles.tableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Штрихкод</th>
                    <th>Тип</th>
                    <th className={styles.numCol}>Цена</th>
                    <th className={styles.numCol}>Скидка</th>
                    <th className={styles.numCol}>Цена со скидкой</th>
                    <th className={styles.numCol}>Кол-во</th>
                    <th className={styles.numCol}>Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => {
                    const price = item.unitPrice !== undefined ? item.unitPrice : item.price;
                    const discount = item.itemDiscount !== undefined ? item.itemDiscount : 0;
                    const finalPrice = item.finalUnitPrice !== undefined ? item.finalUnitPrice : price;

                    return (
                      <tr key={idx}>
                        <td>
                          <span className={styles.itemName}>{item.productName}</span>
                        </td>
                        <td>
                          <code className={styles.barcode}>{item.barcode}</code>
                        </td>
                        <td>
                          <span className={`${styles.typeBadge} ${item.productType === PRODUCT_TYPES.LAPTOP ? styles.typeLaptop : styles.typeAccessory}`}>
                            {item.productType === PRODUCT_TYPES.LAPTOP ? 'Ноутбук' : 'Аксессуар'}
                          </span>
                        </td>
                        <td className={styles.numCol}>{formatPrice(price)} сом</td>
                        <td className={styles.numCol}>{discount > 0 ? `${formatPrice(discount)} сом` : '—'}</td>
                        <td className={styles.numCol}>{formatPrice(finalPrice)} сом</td>
                        <td className={styles.numCol}>{item.quantity} шт</td>
                        <td className={`${styles.numCol} ${styles.rowTotal}`}>
                          {formatPrice(item.total)} сом
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsRow}>
              <span>Промежуточный итог:</span>
              <span>{formatPrice(sale.subtotal)} сом</span>
            </div>
            <div className={styles.totalsRow}>
              <span>Скидка:</span>
              <span className={styles.discountText}>
                -{formatPrice(sale.totalDiscount !== undefined ? sale.totalDiscount : sale.discount)} сом
              </span>
            </div>
            <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
              <span>Всего оплачено:</span>
              <span>{formatPrice(sale.grandTotal)} сом</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Sub-Modal for Deletion */}
      <Modal
        isOpen={isOpen && showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Подтверждение удаления чека"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowConfirm(false)}
              disabled={deleteLoading}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={deleteLoading}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Вы действительно хотите удалить чек <strong>{sale.saleNumber}</strong>?
          Это действие полностью сотрет историю продажи из системы. Складские запасы при этом автоматически возвращены не будут.
        </p>
      </Modal>

      <WarrantyModal
        isOpen={isWarrantyOpen}
        onClose={() => setIsWarrantyOpen(false)}
        sale={sale}
      />
    </>
  );
};

export default SaleDetailsModal;
