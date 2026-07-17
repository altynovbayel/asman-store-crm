import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import Modal from '../../components/Modal/Modal';
import Button from '../../components/Button/Button';
import ProductFilters from '../../components/ProductFilters/ProductFilters';
import ProductTable from '../../components/ProductTable/ProductTable';
import ProductModal from '../../components/ProductModal/ProductModal';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  barcodeExists
} from '../../services/firebase/product.service';
import styles from './Warehouse.module.scss';

const Warehouse = () => {
  const { isAdmin } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch products list from Firestore
  const fetchProductsList = async () => {
    try {
      setLoading(true);
      const list = await getProducts();
      setProducts(list);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchProductsList();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

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
      } else {
        await createProduct(formData);
      }

      await fetchProductsList();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setErrorMsg(err.message || 'Не удалось сохранить товар.');
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
    if (!idToDelete) return;
    setActionLoading(true);
    try {
      await deleteProduct(idToDelete);
      await fetchProductsList();
      setIsDeleteOpen(false);
      setIdToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Ошибка при удалении товара');
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
