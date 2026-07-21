import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import MovementFilters from '../../components/MovementFilters/MovementFilters';
import MovementTable from '../../components/MovementTable/MovementTable';
import MovementDetailsModal from '../../components/MovementDetailsModal/MovementDetailsModal';
import CreateMovementModal from '../../components/CreateMovementModal/CreateMovementModal';
import { subscribeMovements, createMovement } from '../../services/firebase/inventory.service';
import styles from './InventoryMovements.module.scss';

const InventoryMovements = () => {
  const { user, isAdmin, isManager } = useAuth();
  const { showSuccess, showError } = useToast();

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('all');

  // Modals state
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Subscribe to movements in real-time
  useEffect(() => {
    const unsubscribe = subscribeMovements(
      (data) => {
        setMovements(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to inventory movements:', err);
        showError(err.message || 'Ошибка при загрузке журнала движения товаров.');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showError]);

  // Compute unique managers list dynamically from the loaded logs
  const managersList = useMemo(() => {
    const names = movements.map((m) => m.managerName).filter(Boolean);
    return Array.from(new Set(names));
  }, [movements]);

  // In-memory filter logic
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // 1. Search Query
      const matchQuery =
        mov.movementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mov.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mov.productName.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Type Filter
      const matchType = typeFilter === 'all' || mov.type === typeFilter;

      // 3. Manager Filter
      const matchManager = managerFilter === 'all' || mov.managerName === managerFilter;

      // 4. Date Filter (YYYY-MM-DD)
      const matchDate = !dateFilter || (() => {
        if (!mov.createdAt) return false;
        const dObj = typeof mov.createdAt.toDate === 'function' ? mov.createdAt.toDate() : new Date(mov.createdAt);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === dateFilter;
      })();

      return matchQuery && matchType && matchManager && matchDate;
    });
  }, [movements, searchQuery, typeFilter, managerFilter, dateFilter]);

  // Click handler to view details
  const handleRowClick = (record) => {
    setSelectedMovement(record);
    setIsDetailsOpen(true);
  };

  // Save handler for manual operation creation
  const handleCreateSave = async (formData) => {
    if (!user) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        managerId: user.uid,
        managerName: user.name || user.email
      };

      await createMovement(payload);
      showSuccess('Складская операция успешно выполнена.');
      setIsCreateOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка создания складской операции.');
      showError(err.message || 'Ошибка создания складской операции.');
    } finally {
      setActionLoading(false);
    }
  };

  // Only allow Managers and Admins to trigger creation
  const showCreateButton = isManager || isAdmin;

  return (
    <div className={styles.movementsPage}>
      {/* Filters Bar Card */}
      <Card className={styles.controlsCard}>
        <MovementFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          managerFilter={managerFilter}
          onManagerFilterChange={setManagerFilter}
          managersList={managersList}
          onCreateClick={showCreateButton ? () => setIsCreateOpen(true) : null}
        />
      </Card>

      {/* Movements Table Card */}
      <Card className={styles.tableCard} bodyClassName={styles.tableCardBody}>
        {loading ? (
          <Loader text="Загрузка журнала движения товаров..." />
        ) : (
          <MovementTable
            movements={filteredMovements}
            loading={loading}
            onRowClick={handleRowClick}
          />
        )}
      </Card>

      {/* Details View Modal */}
      <MovementDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        movement={selectedMovement}
      />

      {/* Manual Creation Modal */}
      <CreateMovementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSave}
        loading={actionLoading}
        errorMsg={errorMsg}
      />
    </div>
  );
};

export default InventoryMovements;
