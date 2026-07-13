import { Search as SearchIcon, X } from 'lucide-react';
import styles from './Search.module.scss';

const Search = ({
  value,
  onChange,
  placeholder = 'Поиск...',
  onClear,
  className = '',
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      // Simulate change event with empty value
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`${styles.searchWrapper} ${className}`}>
      <span className={styles.searchIcon}>
        <SearchIcon size={18} />
      </span>
      
      <input
        type="text"
        className={styles.searchInput}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
      
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Search;
