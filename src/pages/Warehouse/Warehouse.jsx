import { useState, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useProducts } from '../../store/ProductsContext';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import ProductFilters from '../../components/ProductFilters/ProductFilters';
import ProductTable from '../../components/ProductTable/ProductTable';
import ProductModal from '../../components/ProductModal/ProductModal';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  barcodeExists
} from '../../services/firebase/product.service';
import { logAction } from '../../services/firebase/audit.service';
import styles from './Warehouse.module.scss';

const Warehouse = () => {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const { products, loading } = useProducts();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Delete Confirmation Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Filter and search logic in memory
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesType =
        typeFilter === 'all' || product.type === typeFilter;
        
      return matchesSearch && matchesType;
    });
  }, [products, searchQuery, typeFilter]);

  // Open modal to add product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal to edit product
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Save handler (covers create and update)
  const handleSaveProduct = async (formData) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const isEdit = !!editingProduct;
      const excludeId = isEdit ? editingProduct.id : null;
      
      // Barcode uniqueness check
      const conflict = await barcodeExists(formData.barcode, excludeId);
      if (conflict) {
        throw new Error(`Штрихкод "${formData.barcode}" уже используется для другого товара.`);
      }

      if (isEdit) {
        await updateProduct(editingProduct.id, formData);
        showSuccess('Товар успешно обновлен');
        await logAction(user, 'PRODUCT_UPDATED', `Изменен товар: ${formData.name} (${formData.barcode})`);
      } else {
        await createProduct(formData);
        showSuccess('Товар успешно создан');
        await logAction(user, 'PRODUCT_CREATED', `Создан товар: ${formData.name} (${formData.barcode})`);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setErrorMsg(err.message || 'Не удалось сохранить товар.');
      showError(err.message || 'Не удалось сохранить товар.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete confirmation modal
  const handleOpenDelete = (id) => {
    setIdToDelete(id);
    setIsDeleteOpen(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!isAdmin) {
      showError('У вас нет прав для удаления товаров.');
      return;
    }
    if (!idToDelete) return;
    setActionLoading(true);
    try {
      await deleteProduct(idToDelete);
      showSuccess('Товар успешно удален');
      await logAction(user, 'PRODUCT_DELETED', `Удален товар с ID: ${idToDelete}`);
      setIsDeleteOpen(false);
      setIdToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      showError(err.message || 'Ошибка при удалении товара');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.warehousePage}>
      {/* 1. Filters, search, and Add button inside controls Card */}
      <Card className={styles.controlsCard}>
        <ProductFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onAddClick={handleOpenAdd}
          showAddButton={isAdmin}
        />
      </Card>

      {/* 2. Main Product Table Card */}
      <Card className={styles.tableCard} bodyClassName={styles.tableCardBody}>
        {loading ? (
          <Loader text="Загрузка каталога товаров..." />
        ) : (
          <ProductTable
            products={filteredProducts}
            loading={loading}
            isAdmin={isAdmin}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        )}
      </Card>

      {/* 3. Product Add / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveProduct}
        initialData={editingProduct}
        loading={actionLoading}
        errorMsg={errorMsg}
      />

      {/* 4. Custom Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Удаление товара"
        saveText="Удалить"
        cancelText="Отмена"
        onSave={handleConfirmDelete}
        loading={actionLoading}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={actionLoading}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className={styles.deleteConfirmText}>
          Вы действительно хотите удалить этот товар? Данное действие необратимо и товар будет стёрт из базы данных.
        </p>
      </Modal>
    </div>
  );
};

export default Warehouse;
