import { useState, useMemo } from 'react';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { createSale } from '../services/firebase/sales.service';
import { PRODUCT_TYPES } from '../constants/productTypes';
import { isRequired } from '../utils/validators';
import { calculateSaleSummary } from '../utils/saleCalculator';

export const useCart = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('0');
  
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
        showWarning('Этот ноутбук уже добавлен в корзину (максимум 1 шт).');
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
          showWarning(`Недостаточно товара на складе. Доступный лимит: ${product.quantity} шт.`);
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

  // Calculations using saleCalculator
  const summary = useMemo(() => {
    return calculateSaleSummary(cartItems, discount);
  }, [cartItems, discount]);

  const { subtotal, grandTotal, discountError } = summary;

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
      
      showSuccess('Продажа успешно проведена! Складские остатки обновлены.');
      setSuccessMsg('Продажа успешно проведена! Складские остатки обновлены.');
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount('0');
      setErrors({});
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка проведения продажи.');
      showError(err.message || 'Ошибка проведения продажи.');
    } finally {
      setLoading(false);
    }
  };

  return {
    cartItems,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    discount,
    setDiscount,
    errors,
    loading,
    errorMsg,
    successMsg,
    subtotal,
    grandTotal,
    discountError,
    handleSelectProduct,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearAll,
    handleCompleteSale
  };
};

export default useCart;
