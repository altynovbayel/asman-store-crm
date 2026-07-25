import React from 'react';
import WarrantyHeader from './WarrantyHeader';
import WarrantyInfoTable from './WarrantyInfoTable';
import WarrantyConditions from './WarrantyConditions';
import WarrantyFooter from './WarrantyFooter';
import styles from './Warranty.module.scss';

const WarrantyPreview = React.forwardRef(({ sale, storeSettings }, ref) => {
  return (
    <div className={styles.warrantyContainer} ref={ref}>
      <WarrantyHeader storeSettings={storeSettings} />
      <WarrantyInfoTable sale={sale} storeSettings={storeSettings} />
      <WarrantyConditions />
      <WarrantyFooter sale={sale} />
    </div>
  );
});

WarrantyPreview.displayName = 'WarrantyPreview';

export default WarrantyPreview;
