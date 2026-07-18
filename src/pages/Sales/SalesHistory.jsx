import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import Search from '../../components/Search/Search';
import SalesTable from '../../components/SalesTable/SalesTable';
import SaleDetailsModal from '../../components/SaleDetailsModal/SaleDetailsModal';
import { getSales, deleteSale } from '../../services/firebase/sales.service';
import styles from './SalesHistory.module.scss';

const SalesHistory = () => {
  const { isAdmin } = useAuth();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch sales from Firestore
  const fetchSalesList = async () => {
    try {
      setLoading(true);
      const list = await getSales();
      setSales(list);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchSalesList();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Filter in memory
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        sale.saleNumber.toLowerCase().includes(query) ||
        sale.customerName.toLowerCase().includes(query) ||
        sale.customerPhone.toLowerCase().includes(query)
      );
    });
  }, [sales, searchQuery]);

  const handleRowClick = (record) => {
    setSelectedSale(record);
    setIsDetailsOpen(true);
  };

  const handleDeleteSale = async (id) => {
    setDeleteLoading(true);
    try {
      await deleteSale(id);
      await fetchSalesList();
      setIsDetailsOpen(false);
      setSelectedSale(null);
    } catch (err) {
      console.error('Failed to delete sale:', err);
      alert('Ошибка при удалении чека продажи.');
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

      {/* 3. Detailed view modal */}
      <SaleDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        sale={selectedSale}
        isAdmin={isAdmin}
        onDeleteSale={handleDeleteSale}
        deleteLoading={deleteLoading}
      />
    </div>
  );
};

export default SalesHistory;
