import { Inbox } from 'lucide-react';
import styles from './Empty.module.scss';

const Empty = ({
  title = 'Нет данных',
  description = 'Похоже, здесь пока ничего нет.',
  icon: Icon = Inbox,
  action = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.emptyContainer} ${className}`} {...props}>
      <div className={styles.iconWrapper}>
        <Icon size={48} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  );
};

export default Empty;
