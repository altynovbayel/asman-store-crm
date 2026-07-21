import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.scss';

const Toast = ({ id, type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className={`${styles.icon} ${styles.successIcon}`} size={20} />;
      case 'error':
        return <AlertCircle className={`${styles.icon} ${styles.errorIcon}`} size={20} />;
      case 'warning':
        return <AlertTriangle className={`${styles.icon} ${styles.warningIcon}`} size={20} />;
      case 'info':
      default:
        return <Info className={`${styles.icon} ${styles.infoIcon}`} size={20} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.iconContainer}>{getIcon()}</div>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeButton} onClick={() => onClose(id)} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
