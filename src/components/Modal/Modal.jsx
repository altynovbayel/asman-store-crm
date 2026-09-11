import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '../Button/Button';
import styles from './Modal.module.scss';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = true,
  onSave,
  saveText = 'Сохранить',
  saveVariant = 'primary',
  cancelText = 'Отмена',
  loading = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  // Click outside closure
  const handleOverlayClick = (e) => {
    if (!loading && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalClasses = [
    styles.modal,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const modalContent = (
    <div className={styles.overlay} onClick={handleOverlayClick} {...props}>
      <div className={modalClasses} ref={modalRef}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.body}>
          {children}
        </div>
        
        {footer && (
          <div className={styles.footer}>
            {typeof footer === 'boolean' ? (
              <>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                  {cancelText}
                </Button>
                {onSave && (
                  <Button variant={saveVariant} onClick={onSave} loading={loading}>
                    {saveText}
                  </Button>
                )}
              </>
            ) : (
              footer
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
