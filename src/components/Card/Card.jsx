import styles from './Card.module.scss';

const Card = ({
  children,
  title,
  subtitle,
  extra,
  footer,
  bordered = true,
  hoverable = false,
  className = '',
  bodyClassName = '',
  ...props
}) => {
  const cardClasses = [
    styles.card,
    bordered ? styles.bordered : '',
    hoverable ? styles.hoverable : '',
    className
  ].filter(Boolean).join(' ');

  const hasHeader = title || subtitle || extra;

  return (
    <div className={cardClasses} {...props}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      
      <div className={`${styles.body} ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
