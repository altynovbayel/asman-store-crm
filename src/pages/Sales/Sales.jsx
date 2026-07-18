import { useState, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import ProductSearch from '../../components/ProductSearch/ProductSearch';
import Cart from '../../components/Cart/Cart';
import CustomerForm from '../../components/CustomerForm/CustomerForm';
import SaleSummary from '../../components/SaleSummary/SaleSummary';
import { createSale } from '../../services/firebase/sales.service';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { isRequired } from '../../utils/validators';
import styles from './Sales.module.scss';

const Sales = () => {
  const { user } = useAuth();

  // Cart state
  const [cartItems, setCartItems] = useState([]);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Financial stats
  const [discount, setDiscount] = useState('0');
  
  // Validation errors
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cart operations
  const handleSelectProduct = (product) => {
    setErrorMsg('');
    setSuccessMsg('');
    const existingIndex = cartItems.findIndex((item) => item.productId === product.id);

    if (product.type === PRODUCT_TYPES.LAPTOP) {
      if (existingIndex > -1) {
        alert('Этот ноутбук уже добавлен в корзину (максимум 1 шт).');
        return;
      }
      
      const newItem = {
        productId: product.id,
        productName: product.name,
        productType: product.type,
        barcode: product.barcode,
        quantity: 1,
        price: product.price,
        total: product.price,
        stockLimit: 1
      };
      setCartItems((prev) => [...prev, newItem]);
    } else {
      // Accessory
      if (existingIndex > -1) {
        const item = cartItems[existingIndex];
        if (item.quantity >= product.quantity) {
          alert(`Недостаточно товара на складе. Доступный лимит: ${product.quantity} шт.`);
          return;
        }
        
        const updatedItems = [...cartItems];
        updatedItems[existingIndex] = {
          ...item,
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.price
        };
        setCartItems(updatedItems);
      } else {
        const newItem = {
          productId: product.id,
          productName: product.name,
          productType: product.type,
          barcode: product.barcode,
          quantity: 1,
          price: product.price,
          total: product.price,
          stockLimit: product.quantity
        };
        setCartItems((prev) => [...prev, newItem]);
      }
    }
  };

  const handleUpdateQuantity = (productId, newQty) => {
    const updated = cartItems.map((item) => {
      if (item.productId === productId) {
        const qty = Math.min(item.stockLimit, Math.max(1, newQty));
        return {
          ...item,
          quantity: qty,
          total: qty * item.price
        };
      }
      return item;
    });
    setCartItems(updated);
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  }, [cartItems]);

  const discountError = useMemo(() => {
    const discVal = parseFloat(discount) || 0;
    if (discVal < 0) return 'Скидка не может быть меньше 0';
    if (discVal > subtotal) return 'Скидка не может превышать сумму товаров';
    return '';
  }, [discount, subtotal]);

  const grandTotal = useMemo(() => {
    const discVal = parseFloat(discount) || 0;
    if (discountError) return subtotal;
    return Math.max(0, subtotal - discVal);
  }, [subtotal, discount, discountError]);

  const handleClearAll = () => {
    if (window.confirm('Вы действительно хотите очистить корзину и поля ввода?')) {
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount('0');
      setErrors({});
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!isRequired(customerName)) {
      errs.customerName = 'Введите имя клиента';
    }
    if (!isRequired(customerPhone)) {
      errs.customerPhone = 'Введите телефон клиента';
    }
    if (cartItems.length === 0) {
      errs.cart = 'Добавьте хотя бы один товар в корзину';
    }
    if (discountError) {
      errs.discount = discountError;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCompleteSale = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const salePayload = {
        customerName,
        customerPhone,
        managerId: user.uid,
        managerName: user.name || user.email,
        items: cartItems,
        subtotal,
        discount: parseFloat(discount) || 0,
        grandTotal
      };

      await createSale(salePayload);
      
      setSuccessMsg('Продажа успешно проведена! Складские остатки обновлены.');
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount('0');
      setErrors({});
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка проведения продажи.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.salesPage}>
      {/* 1. Success & Error alerts */}
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      {errors.cart && <div className={styles.errorAlert}>{errors.cart}</div>}

      <div className={styles.mainArea}>
        {/* 2. Left side: Customer details and Product search */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelCard}>
            <CustomerForm
              name={customerName}
              onNameChange={setCustomerName}
              phone={customerPhone}
              onPhoneChange={setCustomerPhone}
              errors={errors}
            />
          </div>

          <div className={`${styles.panelCard} ${styles.searchCard}`}>
            <ProductSearch onSelectProduct={handleSelectProduct} />
          </div>
        </aside>

        {/* 3. Right side: Shopping Cart Table */}
        <section className={styles.rightPart}>
          <Card title="Корзина чека" className={styles.cartCard} bodyClassName={styles.cartCardBody}>
            <Cart
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </Card>
        </section>
      </div>

      {/* 4. Bottom Calculations and Save panel */}
      <footer className={styles.bottomPanel}>
        <div className={styles.bottomLeft}>
          <Button
            variant="success"
            size="md"
            onClick={handleCompleteSale}
            loading={loading}
            disabled={cartItems.length === 0}
          >
            Провести продажу
          </Button>
        </div>

        <div className={styles.bottomCenter}>
          <SaleSummary
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            grandTotal={grandTotal}
            error={errors.discount}
          />
        </div>

        <div className={styles.bottomRight}>
          <Button
            variant="outline"
            size="md"
            onClick={handleClearAll}
            disabled={loading}
          >
            Очистить всё
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Sales;
