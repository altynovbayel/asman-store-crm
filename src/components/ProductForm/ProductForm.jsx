import { useState } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';
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
        type: initialData.type || 'laptop',
        cpu: initialData.cpu || '',
        ram: initialData.ram || '',
        ssd: initialData.ssd || '',
        barcode: initialData.barcode || '',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '0',
        price: initialData.price !== undefined ? String(initialData.price) : '0'
      };
    }
    return {
      name: '',
      type: 'laptop',
      cpu: '',
      ram: '',
      ssd: '',
      barcode: '',
      quantity: '0',
      price: '0'
    };
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Введите название товара';
    }
    
    if (!formData.barcode.trim()) {
      newErrors.barcode = 'Введите штрихкод';
    }
    
    const qty = parseInt(formData.quantity, 10);
    if (formData.quantity === '') {
      newErrors.quantity = 'Введите количество';
    } else if (isNaN(qty) || qty < 0) {
      newErrors.quantity = 'Количество должно быть >= 0';
    }
    
    const priceVal = parseFloat(formData.price);
    if (formData.price === '') {
      newErrors.price = 'Введите цену';
    } else if (isNaN(priceVal) || priceVal < 0) {
      newErrors.price = 'Цена должна быть >= 0';
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
    <form onSubmit={handleSubmit} className={styles.form}>
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      
      <div className={styles.selectGroup}>
        <label className={styles.selectLabel}>Тип товара</label>
        <select
          className={styles.selectInput}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          disabled={loading || !!initialData} // Lock type on edit mode
        >
          <option value="laptop">Ноутбук</option>
          <option value="accessory">Аксессуар</option>
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

      {/* Render laptop specifications conditional inputs */}
      {formData.type === 'laptop' && (
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
        <Input
          label="Цена (сом)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          error={errors.price}
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
