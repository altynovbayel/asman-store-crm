import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Boxes,
  History,
  Truck,
  Users,
  Settings,
  BarChart3,
  X,
  Store
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import styles from './Sidebar.module.scss';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const menuItems = [
    { path: '/', label: 'Панель управления', icon: LayoutDashboard },
    { path: '/sales', label: 'Оформить продажу', icon: ShoppingBag },
    { path: '/sales-history', label: 'История продаж', icon: Receipt },
    { path: '/warehouse', label: 'Склад', icon: Boxes },
    { path: '/movements', label: 'Движение товаров', icon: History },
    { path: '/suppliers', label: 'Поставщики', icon: Truck },
    { path: '/reports', label: 'Отчеты', icon: BarChart3, adminOnly: true },
    { path: '/users', label: 'Пользователи', icon: Users, adminOnly: true },
    { path: '/settings', label: 'Настройки', icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} />
      )}
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoWrapper}>
            <Store size={24} className={styles.logoIcon} />
            <span className={styles.logoText}>Asman Store</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>
        
        <nav className={styles.navigation}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={onClose} // close sidebar on route change on mobile
              >
                <Icon size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        <div className={styles.sidebarFooter}>
          <p className={styles.footerVersion}>CRM v1.0.0</p>
          <p className={styles.footerCopyright}>© 2026 Asman Store</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
