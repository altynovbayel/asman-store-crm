import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import WarrantyPreview from './WarrantyPreview';
import { getStoreSettings } from '../../../services/firebase/settings.service';
import { useToast } from '../../../store/ToastContext';

const WarrantyModal = ({ isOpen, onClose, sale }) => {
  const componentRef = useRef(null);
  const { showError } = useToast();
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        setLoading(true);
        try {
          const settings = await getStoreSettings();
          setStoreSettings(settings);
        } catch (err) {
          console.error('Failed to load store settings:', err);
          showError('Не удалось загрузить настройки магазина.');
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen, showError]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Warranty_${sale?.saleNumber || ''}`,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Гарантийный талон"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          <Button variant="primary" onClick={handlePrint} disabled={loading}>
            Печать
          </Button>
        </>
      }
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <WarrantyPreview ref={componentRef} sale={sale} storeSettings={storeSettings} />
      </div>
    </Modal>
  );
};

export default WarrantyModal;
