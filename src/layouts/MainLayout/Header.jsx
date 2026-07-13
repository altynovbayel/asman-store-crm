import { useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import styles from './Header.module.scss';

const Header = ({ onMenuToggle }) => {
  const location = useLocation();

  // Map pathname to Page Title
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Панель управления';
      case '/products':
        return 'Товары';
      case '/warehouse':
        return 'Склад';
      case '/suppliers':
        return 'Поставщики';
      case '/users':
        return 'Пользователи';
      case '/settings':
        return 'Настройки';
      default:
        return 'Страница не найдена';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.menuToggleBtn}
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      
      <div className={styles.rightSection}>
        <button type="button" className={styles.actionBtn} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.badge} />
        </button>
        
        <div className={styles.divider} />
        
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <span>A</span>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Администратор</span>
            <span className={styles.userRole}>Владелец</span>
          </div>
          <ChevronDown size={16} className={styles.chevron} />
        </div>
      </div>
    </header>
  );
};

export default Header;
