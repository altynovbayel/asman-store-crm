import { useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import styles from './Header.module.scss';

const Header = ({ onMenuToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

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
      case '/forbidden':
        return 'Доступ ограничен';
      default:
        return 'Страница не найдена';
    }
  };

  const title = getPageTitle(location.pathname);

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      await logout();
    }
  };

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      case 'operator':
        return 'Оператор';
      default:
        return role || 'Сотрудник';
    }
  };

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
        
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleLogout}
          aria-label="Logout"
          title="Выйти из системы"
        >
          <LogOut size={20} />
        </button>
        
        <div className={styles.divider} />
        
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <span>{avatarLetter}</span>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'Пользователь'}</span>
            <span className={styles.userRole}>{getRoleLabel(user?.role)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
