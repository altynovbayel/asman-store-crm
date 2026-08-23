import { useState, useMemo, useEffect } from 'react';
import { createSale } from '../services/firebase/sales.service';
import { logAction } from '../services/firebase/audit.service';
import { PRODUCT_TYPES } from '../constants/productTypes';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import {
  calculateItemDiscount,
  calculateSaleSummary,
  getInstallmentDiscountPercent
} from '../utils/saleCalculator';

export const useCart = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [installmentTerm, setInstallmentTerm] = useState(null);
  const [kitIncluded, setKitIncluded] = useState(false);
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

  // Handle payment method change and set installment term to 3 for M+ and Zero, or reset for non-installment methods
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if ([PAYMENT_METHODS.M_PLUS, PAYMENT_METHODS.ZERO].includes(method)) {
      setInstallmentTerm(3);
    } else {
      setInstallmentTerm(null);
    }
    setErrors((prev) => ({ ...prev, paymentMethod: null, installmentTerm: null }));
  };

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
        cpu: product.cpu || '',
        ram: product.ram || '',
        ssd: product.ssd || '',
        quantity: 1,
        unitPrice: sellingPrice,
        itemDiscount: 0,
        stockLimit: 1,
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
        updatedItems[existingIndex] = {
          ...item,
          quantity: item.quantity + 1
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
          stockLimit: product.quantity,
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
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const qty = Math.min(item.stockLimit, Math.max(1, newQty));
          return {
            ...item,
            quantity: qty
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemDiscount = (productId, discountInput) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const itemDiscount = calculateItemDiscount(item.unitPrice, discountInput);
          return {
            ...item,
            itemDiscount,
            discount: itemDiscount
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations using saleCalculator with installment and kit support
  const summary = useMemo(() => {
    return calculateSaleSummary(cartItems, paymentMethod, installmentTerm, kitIncluded);
  }, [cartItems, paymentMethod, installmentTerm, kitIncluded]);

  const {
    processedItems,
    subtotal,
    totalDiscount,
    installmentDiscountTotal,
    kitDiscountTotal,
    individualDiscountTotal,
    grandTotal
  } = summary;

  const handleClearAll = () => {
    if (window.confirm('Вы действительно хотите очистить корзину и поля ввода?')) {
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod(PAYMENT_METHODS.CASH);
      setInstallmentTerm(null);
      setKitIncluded(false);
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

    if ([PAYMENT_METHODS.M_PLUS, PAYMENT_METHODS.ZERO].includes(paymentMethod)) {
      const term = Number(installmentTerm);
      if (term !== 3) {
        newErrors.installmentTerm = 'Для рассрочки допустим только срок 3 месяца (5%)';
      }
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
      const installmentPercent = getInstallmentDiscountPercent(paymentMethod, installmentTerm);
      const isInstallment = [PAYMENT_METHODS.M_PLUS, PAYMENT_METHODS.ZERO].includes(paymentMethod);

      const salePayload = {
        customerName,
        customerPhone,
        paymentMethod,
        installmentTerm: isInstallment ? Number(installmentTerm) : null,
        installmentDiscount: isInstallment ? installmentPercent : 0,
        kitIncluded: Boolean(kitIncluded),
        kitDiscount: kitDiscountTotal,
        installmentDiscountTotal,
        individualDiscountTotal,
        comment,
        managerId: user?.uid || 'anonymous',
        managerName: user?.displayName || user?.email || 'Менеджер',
        items: processedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          barcode: item.barcode,
          cpu: item.cpu || '',
          ram: item.ram || '',
          ssd: item.ssd || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemDiscount: item.itemDiscount,
          installmentDiscount: item.installmentDiscount,
          kitDiscount: item.kitDiscount,
          finalUnitPrice: item.finalUnitPrice,
          total: item.total,
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
      await logAction(user, 'SALE_CREATED', `Оформлена продажа № ${saleResult.saleNumber} на сумму ${grandTotal} сом`);
      
      // Reset forms
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod(PAYMENT_METHODS.CASH);
      setInstallmentTerm(null);
      setKitIncluded(false);
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
    cartItems: processedItems,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod: handlePaymentMethodChange,
    installmentTerm,
    setInstallmentTerm,
    kitIncluded,
    setKitIncluded,
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
