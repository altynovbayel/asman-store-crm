import { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Input from '../Input/Input';
import Button from '../Button/Button';
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../../constants/movementTypes';
import { getProducts } from '../../services/firebase/product.service';
import { isRequired } from '../../utils/validators';
import styles from './CreateMovementModal.module.scss';

const CreateMovementModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  errorMsg = ''
}) => {
  const [productsList, setProductsList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    type: MOVEMENT_TYPES.IN,
    quantity: '1',
    comment: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch active products list when modal opens
  useEffect(() => {
    if (isOpen) {
      let active = true;
      const load = async () => {
        await Promise.resolve();
        if (!active) return;
        
        setFormData({
          productId: '',
          type: MOVEMENT_TYPES.IN,
          quantity: '1',
          comment: ''
        });
        setErrors({});
        setProductsLoading(true);
        try {
          const data = await getProducts();
          if (active) {
            setProductsList(data);
            if (data.length > 0) {
              setFormData((prev) => ({ ...prev, productId: data[0].id }));
            }
          }
        } catch (err) {
          console.error('Failed to load products for selection:', err);
        } finally {
          if (active) {
            setProductsLoading(false);
          }
        }
      };
      load();
      return () => {
        active = false;
      };
    }
  }, [isOpen]);

  const selectedProduct = productsList.find((p) => p.id === formData.productId);

  const validateForm = () => {
    const newErrors = {};

    if (!isRequired(formData.productId)) {
      newErrors.productId = 'Выберите товар';
    }

    if (!isRequired(formData.quantity)) {
      newErrors.quantity = 'Введите количество';
    } else {
      const qty = parseInt(formData.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        newErrors.quantity = 'Количество должно быть больше нуля';
      } else if (selectedProduct) {
        // Stock checks for OUT operations
        if (formData.type === MOVEMENT_TYPES.OUT && qty > (selectedProduct.quantity || 0)) {
          newErrors.quantity = `Недостаточно на складе. Доступно: ${selectedProduct.quantity || 0} шт`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Создать складскую операцию"
      size="md"
      footer={false} // Custom form buttons inside body
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        {/* Product Selector */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Товар</label>
          {productsLoading ? (
            <div className={styles.fieldLoading}>Загрузка каталога товаров...</div>
          ) : (
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className={styles.select}
              disabled={loading}
            >
              <option value="" disabled>-- Выберите товар --</option>
              {productsList.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.barcode}) — В наличии: {product.quantity} шт
                </option>
              ))}
            </select>
          )}
          {errors.productId && <span className={styles.errorText}>{errors.productId}</span>}
        </div>

        {/* Type Selector */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Тип операции</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className={styles.select}
            disabled={loading}
          >
            {Object.keys(MOVEMENT_TYPES).map((key) => (
              <option key={key} value={MOVEMENT_TYPES[key]}>
                {MOVEMENT_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Display helper for target Stock level in ADJUSTMENTS */}
        {formData.type === MOVEMENT_TYPES.ADJUSTMENT && selectedProduct && (
          <div className={styles.adjustmentNotice}>
            При <strong>Корректировке</strong> количество установит новое финальное значение остатка на складе. Текущий остаток: {selectedProduct.quantity} шт.
          </div>
        )}

        {/* Quantity Field */}
        <Input
          label={formData.type === MOVEMENT_TYPES.ADJUSTMENT ? 'Новый остаток' : 'Количество'}
          type="number"
          placeholder="Введите количество"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          error={errors.quantity}
          disabled={loading}
          required
        />

        {/* Comment field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Комментарий</label>
          <textarea
            rows="3"
            placeholder="Опишите причину операции (например, приемка партии, списание брака)"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className={styles.textarea}
            disabled={loading}
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMovementModal;
