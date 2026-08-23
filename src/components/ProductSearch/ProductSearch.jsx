import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Laptop, Package } from 'lucide-react';
import { useProducts } from '../../store/ProductsContext';
import { PRODUCT_STATUS } from '../../constants/productStatus';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import { formatPrice } from '../../utils/formatPrice';
import { getProductDisplayName } from '../../utils/getProductDisplayName';
import styles from './ProductSearch.module.scss';

const ProductSearch = ({ onSelectProduct }) => {
  const { products, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Click outside handler to close dropdown
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
  };

  // Filter in-memory products
  const filteredProducts = products.filter((product) => {
    // Hide sold products
    if (product.status === PRODUCT_STATUS.SOLD) {
      return false;
    }
    // Hide accessories with no stock
    if (product.type === PRODUCT_TYPES.ACCESSORY && (product.quantity || 0) <= 0) {
      return false;
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true; // Show all available on empty search

    return (
      product.name.toLowerCase().includes(query) ||
      product.barcode.toLowerCase().includes(query)
    );
  });

  const handleSelect = (product) => {
    onSelectProduct(product);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={styles.searchWrapper}>
      <label className={styles.label}>Добавить товар в корзину</label>
      <div className={styles.inputContainer}>
        <SearchIcon size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Поиск по названию или штрихкоду..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          className={styles.input}
        />
        {loading && <span className={styles.spinner} />}
      </div>

      {isOpen && (
        <ul className={styles.resultsList}>
          {filteredProducts.length === 0 ? (
            <li className={styles.noResults}>
              {searchQuery ? 'Товары не найдены' : 'Нет доступных товаров на складе'}
            </li>
          ) : (
            filteredProducts.map((product) => (
              <li
                key={product.id}
                onClick={() => handleSelect(product)}
                className={styles.resultItem}
              >
                <div className={styles.iconWrapper}>
                  {product.type === PRODUCT_TYPES.LAPTOP ? (
                    <Laptop size={16} className={styles.laptopIcon} />
                  ) : (
                    <Package size={16} className={styles.accessoryIcon} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.name}>{getProductDisplayName(product)}</span>
                  <span className={styles.spec}>
                    Код: {product.barcode} | Остаток: {product.quantity} шт
                  </span>
                </div>
                <div className={styles.price}>{formatPrice(product.price)} сом</div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ProductSearch;
