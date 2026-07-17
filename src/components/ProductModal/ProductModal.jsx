import Modal from '../Modal/Modal';
import ProductForm from '../ProductForm/ProductForm';

const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  errorMsg = ''
}) => {
  const isEdit = !!initialData;
  const title = isEdit ? 'Редактирование товара' : 'Добавление товара';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={false} // ProductForm has its own form footer buttons (Save / Cancel)
      size="lg"
    >
      <ProductForm
        key={initialData?.id || 'new'}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
        errorMsg={errorMsg}
      />
    </Modal>
  );
};

export default ProductModal;
