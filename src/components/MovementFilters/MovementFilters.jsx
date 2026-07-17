import { Filter, Calendar, User, Plus } from 'lucide-react';
import Search from '../Search/Search';
import Button from '../Button/Button';
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../../constants/movementTypes';
import styles from './MovementFilters.module.scss';

const MovementFilters = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
  managerFilter,
  onManagerFilterChange,
  managersList = [],
  onCreateClick
}) => {
  return (
    <div className={styles.filtersContainer}>
      <Search
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск по номеру, штрихкоду или товару..."
        className={styles.search}
      />

      <div className={styles.controls}>
        {/* Type Filter */}
        <div className={styles.selectWrapper}>
          <Filter size={16} className={styles.filterIcon} />
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">Все типы</option>
            {Object.keys(MOVEMENT_TYPES).map((key) => (
              <option key={key} value={MOVEMENT_TYPES[key]}>
                {MOVEMENT_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className={styles.inputWrapper}>
          <Calendar size={16} className={styles.filterIcon} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        {/* Manager Filter */}
        <div className={styles.selectWrapper}>
          <User size={16} className={styles.filterIcon} />
          <select
            value={managerFilter}
            onChange={(e) => onManagerFilterChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">Все менеджеры</option>
            {managersList.map((mgr) => (
              <option key={mgr} value={mgr}>
                {mgr}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        {onCreateClick && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={onCreateClick}
            className={styles.createBtn}
          >
            Создать операцию
          </Button>
        )}
      </div>
    </div>
  );
};

export default MovementFilters;
