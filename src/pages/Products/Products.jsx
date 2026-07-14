import { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '../../components/Button/Button';
import Table from '../../components/Table/Table';
import Input from '../../components/Input/Input';
import styles from './Products.module.scss';

const Products = () => {
  // Left Panel form state
  const [formState, setFormState] = useState({
    client: '',
    contacts: '',
    barcode: '',
    product: '',
    warehouse: 'Основной склад',
    price: '',
    discount: '',
  });

  // Bottom Panel check state
  const [bottomState, setBottomState] = useState({
    grandTotal: '0 сом',
    paidAmount: '',
    paymentMethod: 'Наличные'
  });

  // Calculate left form total sum
  const calculatedSum = useMemo(() => {
    const priceVal = parseFloat(formState.price) || 0;
    const discountVal = parseFloat(formState.discount) || 0;
    return Math.max(0, priceVal - discountVal);
  }, [formState.price, formState.discount]);

  // Calculate bottom change amount
  const calculatedChange = useMemo(() => {
    const paid = parseFloat(bottomState.paidAmount) || 0;
    const total = parseFloat(bottomState.grandTotal.replace(/[^\d.]/g, '')) || 0;
    return Math.max(0, paid - total);
  }, [bottomState.paidAmount, bottomState.grandTotal]);

  const handleClearAll = () => {
    setFormState({
      client: '',
      contacts: '',
      barcode: '',
      product: '',
      warehouse: 'Основной склад',
      price: '',
      discount: '',
    });
    setBottomState({
      grandTotal: '0 сом',
      paidAmount: '',
      paymentMethod: 'Наличные'
    });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formState.product || !formState.price) return;
    
    // Set grand total to simulated amount for demonstration
    setBottomState((prev) => ({
      ...prev,
      grandTotal: `${calculatedSum} сом`
    }));
  };

  const columns = [
    { title: 'комплект', dataIndex: 'index', key: 'index', width: '60px', align: 'center' },
    { title: 'Товар', dataIndex: 'product', key: 'product' },
    { title: 'Склад', dataIndex: 'warehouse', key: 'warehouse' },
    { title: 'Цена', dataIndex: 'price', key: 'price' },
    { title: 'Скидка', dataIndex: 'discount', key: 'discount' },
    { title: 'Сумма', dataIndex: 'sum', key: 'sum' },
    {
      title: '*',
      key: 'actions',
      align: 'right',
      render: () => (
        <div className={styles.actionsCell}>
          <Button variant="text" size="sm" icon={Trash2} className={styles.deleteBtn} aria-label="Удалить" />
        </div>
      )
    }
  ];

  return (
    <div className={styles.productsPage}>
      {/* Upper content area with Left Panel and Right Table */}
      <div className={styles.mainArea}>
        
        {/* 1. Left Panel (Vertical Form) */}
        <aside className={styles.leftPanel}>
          <form onSubmit={handleAddProduct} className={styles.verticalForm}>
            <Input
              label="Клиент"
              placeholder="ФИО клиента"
              value={formState.client}
              onChange={(e) => setFormState({ ...formState, client: e.target.value })}
            />
            <Input
              label="Контакты клиента"
              placeholder="Номер телефона"
              value={formState.contacts}
              onChange={(e) => setFormState({ ...formState, contacts: e.target.value })}
            />
            <Input
              label="Штрихкод"
              placeholder="Сканируйте или введите"
              value={formState.barcode}
              onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
            />
            <Input
              label="Товар"
              placeholder="Название товара"
              value={formState.product}
              onChange={(e) => setFormState({ ...formState, product: e.target.value })}
            />
            
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Склад</label>
              <select
                className={styles.selectInput}
                value={formState.warehouse}
                onChange={(e) => setFormState({ ...formState, warehouse: e.target.value })}
              >
                <option value="Основной склад">Основной склад</option>
                <option value="Склад Б">Склад Б</option>
                <option value="Транзитный склад">Транзитный склад</option>
              </select>
            </div>

            <Input
              label="Цена (сом)"
              type="number"
              placeholder="0.00"
              value={formState.price}
              onChange={(e) => setFormState({ ...formState, price: e.target.value })}
            />
            <Input
              label="Скидка (сом)"
              type="number"
              placeholder="0.00"
              value={formState.discount}
              onChange={(e) => setFormState({ ...formState, discount: e.target.value })}
            />
            <Input
              label="Сумма (сом)"
              type="number"
              placeholder="0.00"
              value={calculatedSum || ''}
              disabled
            />

            <Button type="submit" variant="primary" size="lg" className={styles.addBtn}>
              Добавить
            </Button>
          </form>
        </aside>

        {/* 2. Right Part (Blank Table) */}
        <section className={styles.rightPart}>
          <Table
            columns={columns}
            dataSource={[]}
            emptyText="Товары не добавлены"
            className={styles.rightTable}
          />
        </section>
      </div>

      {/* 3. Bottom Panel */}
      <footer className={styles.bottomPanel}>
        <div className={styles.bottomLeft}>
          <Button variant="success" size="md">
            Сохранить
          </Button>
        </div>

        <div className={styles.bottomCenter}>
          <div className={styles.bottomField}>
            <span className={styles.bottomLabel}>Итого:</span>
            <span className={styles.bottomValue}>{bottomState.grandTotal}</span>
          </div>

          <div className={styles.bottomField}>
            <span className={styles.bottomLabel}>Оплачено:</span>
            <input
              type="number"
              className={styles.bottomInput}
              placeholder="0.00 сом"
              value={bottomState.paidAmount}
              onChange={(e) => setBottomState({ ...bottomState, paidAmount: e.target.value })}
            />
          </div>

          <div className={styles.bottomField}>
            <span className={styles.bottomLabel}>Сдача:</span>
            <span className={styles.bottomValue}>{calculatedChange} сом</span>
          </div>

          <div className={styles.bottomField}>
            <span className={styles.bottomLabel}>Способ оплаты:</span>
            <select
              className={styles.bottomSelect}
              value={bottomState.paymentMethod}
              onChange={(e) => setBottomState({ ...bottomState, paymentMethod: e.target.value })}
            >
              <option value="Наличные">Наличные</option>
              <option value="Карта">Карта</option>
              <option value="QR / Перевод">QR / Перевод</option>
            </select>
          </div>
        </div>

        <div className={styles.bottomRight}>
          <Button variant="outline" size="md" onClick={handleClearAll}>
            Очистить
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Products;
