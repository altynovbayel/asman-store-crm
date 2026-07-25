import styles from './Warranty.module.scss';

const WarrantyHeader = ({ storeSettings }) => {
  const storeName = storeSettings?.storeName || 'ASMAN STORE';
  const logoUrl = storeSettings?.logoUrl;

  return (
    <div className={styles.header}>
      {logoUrl ? (
        <img src={logoUrl} alt={storeName} className={styles.logo} />
      ) : (
        <div className={styles.logoText}>{storeName}</div>
      )}
      <h1 className={styles.title}>ГАРАНТИЙНЫЙ ТАЛОН</h1>
    </div>
  );
};

export default WarrantyHeader;
