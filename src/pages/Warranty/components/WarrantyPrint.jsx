import React from 'react';
import WarrantyPreview from './WarrantyPreview';

const WarrantyPrint = React.forwardRef(({ sale, storeSettings }, ref) => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }}>
      <WarrantyPreview ref={ref} sale={sale} storeSettings={storeSettings} />
    </div>
  );
});

WarrantyPrint.displayName = 'WarrantyPrint';

export default WarrantyPrint;
