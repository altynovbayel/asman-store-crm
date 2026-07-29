import { useState, useMemo, useEffect } from 'react';
import { createSale } from '../services/firebase/sales.service';
import { logAction } from '../services/firebase/audit.service';
import { PRODUCT_TYPES } from '../constants/productTypes';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import {
  calculateItemDiscount,
  calculateItemTotal,
  calculateSaleSummary
} from '../utils/saleCalculator';

export const useCart = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSelectProduct = (product) => {
    setErrorMsg('');
    setSuccessMsg('');
    const existingIndex = cartItems.findIndex((item) => item.productId === product.id);

    const sellingPrice = product.sellingPrice !== undefined ? product.sellingPrice : product.price || 0;
    const purchasePrice = product.purchasePrice || 0;

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
        unitPrice: sellingPrice,
        itemDiscount: 0,
        finalUnitPrice: sellingPrice,
        total: sellingPrice,
        stockLimit: 1,
        // Purchase price compatibility
        purchasePrice,
        sellingPrice,
        salePrice: sellingPrice,
        discount: 0
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
          unitPrice: sellingPrice,
          itemDiscount: 0,
          finalUnitPrice: sellingPrice,
          total: sellingPrice,
          stockLimit: product.quantity,
          // Purchase price compatibility
          purchasePrice,
          sellingPrice,
          salePrice: sellingPrice,
          discount: 0
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
          total,
          discount: itemDiscount
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
    }
  };

  const validateCartForm = () => {
    const newErrors = {};
    if (!customerName || !customerName.trim()) {
      newErrors.customerName = 'Введите имя клиента';
    }
    if (!customerPhone || !customerPhone.trim()) {
      newErrors.customerPhone = 'Введите номер телефона';
    }
    if (cartItems.length === 0) {
      newErrors.cart = 'Добавьте хотя бы один товар в корзину';
    }

    // Check discount fields constraints
    cartItems.forEach((item) => {
      if (item.itemDiscount < 0) {
        newErrors[`discount-${item.productId}`] = 'Скидка не может быть отрицательной';
      } else if (item.itemDiscount > item.unitPrice) {
        newErrors[`discount-${item.productId}`] = 'Скидка не может быть больше цены';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteSale = async () => {
    if (!validateCartForm()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const salePayload = {
        customerName,
        customerPhone,
        paymentMethod,
        comment,
        managerId: user?.uid || 'anonymous',
        managerName: user?.displayName || user?.email || 'Менеджер',
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemDiscount: item.itemDiscount,
          finalUnitPrice: item.finalUnitPrice,
          total: item.total,
          // New historical price fields
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          salePrice: item.salePrice,
          discount: item.discount
        })),
        subtotal,
        totalDiscount,
        grandTotal
      };

      const saleResult = await createSale(salePayload);
      setSuccessMsg('Продажа успешно оформлена!');
      showSuccess('Продажа успешно проведена!');
      await logAction(user, 'SALE_CREATE', `Оформлена продажа № ${saleResult.saleNumber} на сумму ${grandTotal} сом`);
      
      // Reset forms
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod(PAYMENT_METHODS.CASH);
      setComment('');
      setErrors({});
    } catch (err) {
      console.error('Checkout error:', err);
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
