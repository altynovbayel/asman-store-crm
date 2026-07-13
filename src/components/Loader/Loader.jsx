import styles from './Loader.module.scss';

const Loader = ({
  size = 'md',
  fullscreen = false,
  text = 'Загрузка...',
  className = '',
  ...props
}) => {
  const loaderClasses = [
    styles.loaderContainer,
    fullscreen ? styles.fullscreen : '',
    className
  ].filter(Boolean).join(' ');

  const spinnerClasses = [
    styles.spinner,
    styles[size]
  ].filter(Boolean).join(' ');

  return (
    <div className={loaderClasses} {...props}>
      <div className={styles.spinnerWrapper}>
        <div className={spinnerClasses}>
          <div className={styles.doubleBounce1}></div>
          <div className={styles.doubleBounce2}></div>
        </div>
        {text && <span className={styles.text}>{text}</span>}
      </div>
    </div>
  );
};

export default Loader;
