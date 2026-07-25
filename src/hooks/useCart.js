import { useState, useMemo } from 'react';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { createSale } from '../services/firebase/sales.service';
import { PRODUCT_TYPES } from '../constants/productTypes';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { isRequired } from '../utils/validators';
import {
  calculateSaleSummary,
  calculateItemDiscount,
  calculateItemTotal
} from '../utils/saleCalculator';

export const useCart = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [comment, setComment] = useState('');
  
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
        unitPrice: product.price,
        itemDiscount: 0,
        finalUnitPrice: product.price,
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
        const newQty = item.quantity + 1;
        const total = calculateItemTotal(item.unitPrice, item.itemDiscount, newQty);
        updatedItems[existingIndex] = {
          ...item,
          quantity: newQty,
          total
        };
        setCartItems(updatedItems);
      } else {
        const newItem = {
          productId: product.id,
          productName: product.name,
          productType: product.type,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: product.price,
          itemDiscount: 0,
          finalUnitPrice: product.price,
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
        const total = calculateItemTotal(item.unitPrice, item.itemDiscount, qty);
        return {
          ...item,
          quantity: qty,
          total
        };
      }
      return item;
    });
    setCartItems(updated);
  };

  const handleUpdateItemDiscount = (productId, discountInput) => {
    const updated = cartItems.map((item) => {
      if (item.productId === productId) {
        const unitPrice = item.unitPrice;
        const itemDiscount = calculateItemDiscount(unitPrice, discountInput);
        const finalUnitPrice = Math.max(0, unitPrice - itemDiscount);
        const total = calculateItemTotal(unitPrice, itemDiscount, item.quantity);
        return {
          ...item,
          itemDiscount,
          finalUnitPrice,
          total
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
    return calculateSaleSummary(cartItems);
  }, [cartItems]);

  const { subtotal, totalDiscount, grandTotal } = summary;

  const handleClearAll = () => {
    if (window.confirm('Вы действительно хотите очистить корзину и поля ввода?')) {
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod(PAYMENT_METHODS.CASH);
      setComment('');
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
    if (!paymentMethod) {
      errs.paymentMethod = 'Выберите способ оплаты';
    }

    // Individual item discount validations
    cartItems.forEach((item) => {
      const disc = parseFloat(item.itemDiscount) || 0;
      if (disc < 0) {
        errs[`discount-${item.productId}`] = 'Скидка не может быть меньше 0';
      } else if (disc > item.unitPrice) {
        errs[`discount-${item.productId}`] = 'Скидка не может превышать стоимость товара';
      }
    });

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
        paymentMethod,
        comment,
        managerId: user.uid,
        managerName: user.name || user.email,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemDiscount: item.itemDiscount,
          finalUnitPrice: item.finalUnitPrice,
          total: item.total
        })),
        subtotal,
        totalDiscount,
        grandTotal
      };

      await createSale(salePayload);
      
      showSuccess('Продажа успешно проведена! Складские остатки обновлены.');
      setSuccessMsg('Продажа успешно проведена! Складские остатки обновлены.');
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod(PAYMENT_METHODS.CASH);
      setComment('');
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
    paymentMethod,
    setPaymentMethod,
    comment,
    setComment,
    errors,
    loading,
    errorMsg,
    successMsg,
    subtotal,
    totalDiscount,
    grandTotal,
    handleSelectProduct,
    handleUpdateQuantity,
    handleUpdateItemDiscount,
    handleRemoveItem,
    handleClearAll,
    handleCompleteSale
  };
};

export default useCart;
