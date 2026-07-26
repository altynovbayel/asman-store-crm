import { useState } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { isRequired, isValidBarcode } from '../../utils/validators';
import styles from './ProductForm.module.scss';

const ProductForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  errorMsg = ''
}) => {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        name: initialData.name || '',
        type: initialData.type || PRODUCT_TYPES.LAPTOP,
        cpu: initialData.cpu || '',
        ram: initialData.ram || '',
        ssd: initialData.ssd || '',
        barcode: initialData.barcode || '',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '0',
        purchasePrice: initialData.purchasePrice !== undefined ? String(initialData.purchasePrice) : '',
        sellingPrice: initialData.sellingPrice !== undefined 
          ? String(initialData.sellingPrice) 
          : initialData.price !== undefined ? String(initialData.price) : ''
      };
    }
    return {
      name: '',
      type: PRODUCT_TYPES.LAPTOP,
      cpu: '',
      ram: '',
      ssd: '',
      barcode: '',
      quantity: '0',
      purchasePrice: '',
      sellingPrice: ''
    };
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!isRequired(formData.name)) {
      newErrors.name = 'Введите название товара';
    }
    
    if (!isRequired(formData.barcode)) {
      newErrors.barcode = 'Введите штрихкод';
    } else if (!isValidBarcode(formData.barcode)) {
      newErrors.barcode = 'Некорректный формат штрихкода (разрешены латинские буквы, цифры, дефис)';
    }
    
    if (!isRequired(formData.quantity)) {
      newErrors.quantity = 'Введите количество';
    } else {
      const qty = parseInt(formData.quantity, 10);
      if (isNaN(qty) || qty < 0) {
        newErrors.quantity = 'Количество должно быть >= 0';
      }
    }
    
    if (!isRequired(formData.purchasePrice)) {
      newErrors.purchasePrice = 'Введите цену закупки';
    } else {
      const pPrice = parseFloat(formData.purchasePrice);
      if (isNaN(pPrice) || pPrice <= 0) {
        newErrors.purchasePrice = 'Цена закупки должна быть > 0';
      }
    }

    if (!isRequired(formData.sellingPrice)) {
      newErrors.sellingPrice = 'Введите цену продажи';
    } else {
      const sPrice = parseFloat(formData.sellingPrice);
      if (isNaN(sPrice) || sPrice <= 0) {
        newErrors.sellingPrice = 'Цена продажи должна быть > 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Map data for submission
      const submissionData = {
        ...formData,
        price: parseFloat(formData.sellingPrice) // Maintain compatibility with older components
      };
      onSubmit(submissionData);
    }
  };

  const pPriceNum = parseFloat(formData.purchasePrice);
  const sPriceNum = parseFloat(formData.sellingPrice);
  const showWarning = !isNaN(pPriceNum) && !isNaN(sPriceNum) && pPriceNum > sPriceNum;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      
      {showWarning && (
        <div className={styles.warningAlert}>
          Предупреждение: Цена закупки ({pPriceNum} сом) превышает цену продажи ({sPriceNum} сом).
        </div>
      )}

      <div className={styles.selectGroup}>
        <label className={styles.selectLabel}>Тип товара</label>
        <select
          className={styles.selectInput}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          disabled={loading || !!initialData}
        >
          <option value={PRODUCT_TYPES.LAPTOP}>Ноутбук</option>
          <option value={PRODUCT_TYPES.ACCESSORY}>Аксессуар</option>
        </select>
      </div>

      <Input
        label="Название товара"
        placeholder="Введите название"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        disabled={loading}
        required
      />

      {formData.type === PRODUCT_TYPES.LAPTOP && (
        <div className={styles.specsGrid}>
          <Input
            label="Процессор (CPU)"
            placeholder="Например, Intel Core i7"
            value={formData.cpu}
            onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
            disabled={loading}
          />
          <Input
            label="ОЗУ (RAM)"
            placeholder="Например, 16 ГБ"
            value={formData.ram}
            onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
            disabled={loading}
          />
          <Input
            label="Накопитель (SSD)"
            placeholder="Например, 512 ГБ"
            value={formData.ssd}
            onChange={(e) => setFormData({ ...formData, ssd: e.target.value })}
            disabled={loading}
          />
        </div>
      )}

      <Input
        label="Штрихкод"
        placeholder="Введите уникальный штрихкод"
        value={formData.barcode}
        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
        error={errors.barcode}
        disabled={loading}
        required
      />

      <div className={styles.rowFields}>
        <Input
          label="Количество"
          type="number"
          placeholder="0"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          error={errors.quantity}
          disabled={loading}
          required
        />
      </div>

      <div className={styles.rowFields}>
        <Input
          label="Цена закупки (сом)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.purchasePrice}
          onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
          error={errors.purchasePrice}
          disabled={loading}
          required
        />
        <Input
          label="Цена продажи (сом)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.sellingPrice}
          onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
          error={errors.sellingPrice}
          disabled={loading}
          required
        />
      </div>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          Сохранить
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
