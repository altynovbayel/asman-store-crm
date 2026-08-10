import { Filter, Plus } from 'lucide-react';
import Search from '../Search/Search';
import Button from '../Button/Button';
import { PRODUCT_TYPES } from '../../constants/productTypes';
import styles from './ProductFilters.module.scss';

const ProductFilters = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onAddClick,
  showAddButton = false
}) => {
  return (
    <div className={styles.filtersContainer}>
      <Search
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск по названию или штрихкоду..."
        className={styles.search}
      />
      
      <div className={styles.controls}>
        <div className={styles.selectWrapper}>
          <Filter size={16} className={styles.filterIcon} />
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">Все товары</option>
            <option value={PRODUCT_TYPES.LAPTOP}>Ноутбуки</option>
            <option value={PRODUCT_TYPES.ACCESSORY}>Аксессуары</option>
            <option value="archive">Архив</option>
          </select>
        </div>
        
        {showAddButton && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={onAddClick}
            className={styles.addBtn}
          >
            Добавить товар
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
