import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import Search from '../../components/Search/Search';
import SalesTable from '../../components/SalesTable/SalesTable';
import SaleDetailsModal from '../../components/SaleDetailsModal/SaleDetailsModal';
import { subscribeSales, deleteSale } from '../../services/firebase/sales.service';
import { logAction } from '../../services/firebase/audit.service';
import styles from './SalesHistory.module.scss';

const SalesHistory = () => {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Subscribe to sales updates in real-time
  useEffect(() => {
    const unsubscribe = subscribeSales(
      (data) => {
        setSales(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to sales history:', err);
        showError(err.message || 'Ошибка при загрузке истории продаж.');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showError]);

  // Filter in memory
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const queryText = searchQuery.trim().toLowerCase();
      if (!queryText) return true;

      return (
        sale.saleNumber.toLowerCase().includes(queryText) ||
        sale.customerName.toLowerCase().includes(queryText) ||
        sale.customerPhone.toLowerCase().includes(queryText)
      );
    });
  }, [sales, searchQuery]);

  const handleRowClick = (record) => {
    setSelectedSale(record);
    setIsDetailsOpen(true);
  };

  const handleDeleteSale = async (id) => {
    if (!isAdmin) {
      showError('У вас нет прав для выполнения этой операции.');
      return;
    }
    setDeleteLoading(true);
    try {
      const managerId = user?.uid || 'anonymous';
      const managerName = user?.displayName || user?.email || 'Администратор';
      await deleteSale(id, managerId, managerName);
      showSuccess('Продажа успешно удалена, складские остатки восстановлены.');
      if (selectedSale) {
        await logAction(user, 'SALE_DELETE', `Удалена продажа № ${selectedSale.saleNumber} на сумму ${selectedSale.grandTotal} сом`);
      }
      setIsDetailsOpen(false);
      setSelectedSale(null);
    } catch (err) {
      console.error('Failed to delete sale:', err);
      showError(err.message || 'Ошибка при удалении чека продажи.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  return (
    <div className={styles.historyPage}>
      {/* 1. Search filter Card */}
      <Card className={styles.controlsCard}>
        <Search
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по номеру чека, имени или телефону клиента..."
          className={styles.search}
        />
      </Card>

      {/* 2. Main Sales Table Card */}
      <Card className={styles.tableCard} bodyClassName={styles.tableCardBody}>
        {loading ? (
          <Loader text="Загрузка истории продаж..." />
        ) : (
          <SalesTable
            sales={filteredSales}
            loading={loading}
            onRowClick={handleRowClick}
          />
        )}
      </Card>

      {/* 3. Sale Details and deletion Modal */}
      <SaleDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        sale={selectedSale}
        onDeleteSale={handleDeleteSale}
        deleteLoading={deleteLoading}
        showDeleteButton={isAdmin}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default SalesHistory;
