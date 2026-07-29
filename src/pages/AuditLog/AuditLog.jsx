import { useState, useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Loader from '../../components/Loader/Loader';
import Empty from '../../components/Empty/Empty';
import { useToast } from '../../store/ToastContext';
import { getAuditLogs } from '../../services/firebase/audit.service';
import { formatDate } from '../../utils/formatDate';
import styles from './AuditLog.module.scss';

const AuditLog = () => {
  const { showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all | sales | products | settings

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        showError(err.message || 'Ошибка при загрузке системного журнала.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [showError]);

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
      case 'PRODUCT_CREATE':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Создание товара</span>;
      case 'PRODUCT_EDIT':
        return <span className={`${styles.badge} ${styles.badgeWarning}`}>Изменение товара</span>;
      case 'PRODUCT_DELETE':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Удаление товара</span>;
      case 'SALE_CREATE':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Новая продажа</span>;
      case 'SALE_DELETE':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Отмена продажи</span>;
      case 'SETTINGS_UPDATE':
        return <span className={`${styles.badge} ${styles.badgeInfo}`}>Настройки</span>;
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
    </div>
  );
};

export default AuditLog;
