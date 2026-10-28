import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Loader from '../../components/Loader/Loader';
import Empty from '../../components/Empty/Empty';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { getAuditLogs, clearAuditLogs } from '../../services/firebase/audit.service';
import { formatDate } from '../../utils/formatDate';
import styles from './AuditLog.module.scss';

const AuditLog = () => {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all | sales | products | settings
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      showError(err.message || 'Ошибка при загрузке системного журнала.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      fetchLogs();
    };
    init();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await clearAuditLogs(user);
      setIsClearModalOpen(false);
      showSuccess('Журнал аудита очищен');
      setFilterType('all');
      setLoading(true);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to clear audit logs:', err);
      showError(err.message || 'Ошибка при очистке системного журнала.');
    } finally {
      setClearing(false);
    }
  };

  // Filter logs locally in memory
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType === 'all') return true;
      if (filterType === 'sales') return log.action?.startsWith('SALE_');
      if (filterType === 'products') return log.action?.startsWith('PRODUCT_');
      if (filterType === 'settings') return log.action?.startsWith('SETTINGS_');
      return true;
    });
  }, [logs, filterType]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'PRODUCT_CREATED':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Создание товара</span>;
      case 'PRODUCT_UPDATED':
        return <span className={`${styles.badge} ${styles.badgeWarning}`}>Изменение товара</span>;
      case 'PRODUCT_DELETED':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Удаление товара</span>;
      case 'SALE_CREATED':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Новая продажа</span>;
      case 'SALE_DELETED':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Отмена продажи</span>;
      case 'SETTINGS_UPDATED':
        return <span className={`${styles.badge} ${styles.badgeInfo}`}>Настройки</span>;
      case 'LOGIN_SUCCESS':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Вход в систему</span>;
      case 'USER_ROLE_UPDATED':
        return <span className={`${styles.badge} ${styles.badgeWarning}`}>Смена роли</span>;
      case 'USER_BLOCKED':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Блокировка пользователя</span>;
      case 'USER_UNBLOCKED':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Разблокировка пользователя</span>;
      case 'AUDIT_LOG_CLEARED':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Очистка журнала</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeInfo}`}>{action}</span>;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      case 'operator':
        return 'Оператор';
      default:
        return role || '—';
    }
  };

  const columns = [
    {
      title: 'Дата и время',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts) => <span className={styles.dateText}>{formatDate(ts)}</span>
    },
    {
      title: 'Пользователь',
      dataIndex: 'userName',
      key: 'userName',
      render: (name, record) => (
        <div className={styles.userCell}>
          <span className={styles.name}>{name}</span>
          <span className={styles.email}>{record.userId !== 'anonymous' ? record.userId.substring(0, 8) : 'Система'}</span>
        </div>
      )
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span className={styles.roleBadge}>{getRoleLabel(role)}</span>
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      render: (action) => getActionBadge(action)
    },
    {
      title: 'Описание операции',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => <div className={styles.descriptionCell}>{desc}</div>
    }
  ];

  return (
    <div className={styles.auditLogPage}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Журнал аудита операций</h1>
        {isAdmin && (
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => setIsClearModalOpen(true)}
            disabled={loading}
          >
            Очистить журнал
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <Card className={styles.controlsCard}>
        <div className={styles.controlsRow}>
          <div className={styles.selectGroup}>
            <label htmlFor="audit-filter-select">Фильтр по типу операций:</label>
            <select
              id="audit-filter-select"
              className={styles.selectInput}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Все операции</option>
              <option value="sales">Продажи и возвраты</option>
              <option value="products">Товары и склад</option>
              <option value="settings">Настройки магазина</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main logs Table */}
      {loading ? (
        <div className={styles.loadingWrapper}>
          <Loader text="Загрузка журнала аудита..." />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty
            title="Записи не найдены"
            description="Нет записей, соответствующих выбранному фильтру."
            icon={ShieldAlert}
          />
        </Card>
      ) : (
        <Card className={styles.tableCard} bodyClassName={styles.tableCardBody}>
          <Table
            columns={columns}
            dataSource={filteredLogs}
            loading={loading}
            emptyText="Записи аудита отсутствуют"
          />
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => !clearing && setIsClearModalOpen(false)}
        title="Очистить журнал аудита?"
        size="sm"
        saveText="Очистить журнал"
        saveVariant="danger"
        cancelText="Отмена"
        onSave={handleClearLogs}
        loading={clearing}
      >
        <p className={styles.confirmText}>
          Все записи журнала будут удалены без возможности восстановления.
        </p>
      </Modal>
    </div>
  );
};

export default AuditLog;
