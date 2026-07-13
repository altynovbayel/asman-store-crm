import { forwardRef } from 'react';
import styles from './Input.module.scss';

const Input = forwardRef(({
  label,
  error,
  icon: Icon = null,
  iconPosition = 'left',
  type = 'text',
  id,
  className = '',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    styles.inputContainer,
    error ? styles.hasError : '',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    Icon && iconPosition === 'left' ? styles.withLeftIcon : '',
    Icon && iconPosition === 'right' ? styles.withRightIcon : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {Icon && iconPosition === 'left' && (
          <span className={`${styles.icon} ${styles.left}`}>
            <Icon size={18} />
          </span>
        )}
        
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <span className={`${styles.icon} ${styles.right}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
