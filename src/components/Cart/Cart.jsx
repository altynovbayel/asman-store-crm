import { Plus, Minus, Trash2 } from 'lucide-react';
import Button from '../Button/Button';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { formatPrice } from '../../utils/formatPrice';
import styles from './Cart.module.scss';

const Cart = ({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem
}) => {
  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <p className={styles.emptyText}>Корзина пуста. Найдите и выберите товары в левой панели.</p>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Товар</th>
            <th>Штрихкод</th>
            <th>Тип</th>
            <th>Цена</th>
            <th className={styles.qtyHeader}>Кол-во</th>
            <th>Сумма</th>
            <th className={styles.actionsHeader}></th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => {
            const isLaptop = item.productType === PRODUCT_TYPES.LAPTOP;
            // Disable Plus if accessory reaches database stock limit
            const isPlusDisabled = !isLaptop && item.quantity >= item.stockLimit;

            return (
              <tr key={item.productId} className={styles.cartRow}>
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.productName}>{item.productName}</span>
                    {!isLaptop && (
                      <span className={styles.stockNotice}>
                        Доступно на складе: {item.stockLimit} шт
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <code className={styles.barcode}>{item.barcode}</code>
                </td>
                <td>
                  <span className={`${styles.typeBadge} ${isLaptop ? styles.typeLaptop : styles.typeAccessory}`}>
                    {isLaptop ? 'Ноутбук' : 'Аксессуар'}
                  </span>
                </td>
                <td>
                  <span className={styles.price}>{formatPrice(item.price)} сом</span>
                </td>
                <td>
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className={styles.qtyBtn}
                      disabled={isLaptop || item.quantity <= 1}
                      aria-label="Уменьшить количество"
                    >
                      <Minus size={12} />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className={styles.qtyBtn}
                      disabled={isLaptop || isPlusDisabled}
                      aria-label="Увеличить количество"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </td>
                <td>
                  <strong className={styles.total}>{formatPrice(item.total)} сом</strong>
                </td>
                <td className={styles.actionsCell}>
                  <Button
                    variant="text"
                    size="sm"
                    icon={Trash2}
                    className={styles.deleteBtn}
                    onClick={() => onRemoveItem(item.productId)}
                    aria-label="Удалить товар"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Cart;
