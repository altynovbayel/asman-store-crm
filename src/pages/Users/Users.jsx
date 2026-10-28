import { useState, useMemo, useEffect } from 'react';
import { Plus, Shield, UserX, UserCheck, RefreshCw, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Search from '../../components/Search/Search';
import Modal from '../../components/Modal/Modal';
import Loader from '../../components/Loader/Loader';
import Empty from '../../components/Empty/Empty';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { getUsers, updateUserRole, updateUserStatus } from '../../services/firebase/users.service';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { USER_STATUS, USER_STATUS_LABELS } from '../../constants/userStatus';
import styles from './Users.module.scss';

// Old documents may hold non-string values: only non-empty strings are ever rendered
const pickString = (...values) => values.find((v) => typeof v === 'string' && v.trim() !== '') || '';
const getDisplayName = (u) => pickString(u.displayName, u.name, u.email, u.id);
const getEmail = (u) => pickString(u.email);
// Short label for messages: email if present, otherwise the display name
const getUserLabel = (u) => pickString(u.email, u.displayName, u.name, u.id);
const isKnownRole = (role) => Object.values(ROLES).includes(role);
const isKnownStatus = (status) => Object.values(USER_STATUS).includes(status);
// Labels are looked up only for known values: old documents may contain anything
const getRoleLabel = (role) => (isKnownRole(role) ? ROLE_LABELS[role] : 'Неизвестная роль');
const getStatusLabel = (status) => USER_STATUS_LABELS[isKnownStatus(status) ? status : USER_STATUS.ACTIVE];

const Users = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [state, setState] = useState({ status: 'loading', users: [], error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  // { type: 'role' | 'status', target, newValue }
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isCreateInfoOpen, setIsCreateInfoOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const users = await getUsers();
        if (!cancelled) setState({ status: 'ready', users, error: '' });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', users: [], error: err.message || 'Ошибка загрузки пользователей.' });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    setReloadKey((key) => key + 1);
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return state.users;
    return state.users.filter((u) =>
      getDisplayName(u).toLowerCase().includes(q) ||
      getEmail(u).toLowerCase().includes(q)
    );
  }, [state.users, searchQuery]);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { type, target, newValue } = pendingAction;
    setSaving(true);
    try {
      const updated = type === 'role'
        ? await updateUserRole(currentUser, target.id, newValue)
        : await updateUserStatus(currentUser, target.id, newValue);

      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === target.id ? { ...u, ...updated } : u))
      }));

      if (type === 'role') {
        showSuccess(`Роль пользователя ${getUserLabel(target)} изменена: ${ROLE_LABELS[newValue]}.`);
      } else {
        showSuccess(newValue === USER_STATUS.BLOCKED
          ? `Пользователь ${getUserLabel(target)} заблокирован.`
          : `Пользователь ${getUserLabel(target)} разблокирован.`);
      }
      setPendingAction(null);
    } catch (err) {
      showError(err.message || 'Не удалось изменить пользователя.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Имя пользователя',
      key: 'name',
      render: (_, record) => {
        const name = getDisplayName(record);
        return (
          <div className={styles.userCell}>
            <div className={styles.avatar}>{name.charAt(0).toUpperCase()}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{name}</span>
              {record.id === currentUser?.uid && <span className={styles.userEmail}>Это вы</span>}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => getEmail(record) || '—'
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleClass = role === ROLES.ADMIN ? styles.roleAdmin : role === ROLES.MANAGER ? styles.roleManager : styles.roleUnknown;
        return (
          <span className={`${styles.roleBadge} ${roleClass}`}>
            <Shield size={12} />
            {getRoleLabel(role)}
          </span>
        );
      }
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`${styles.statusBadge} ${status === USER_STATUS.BLOCKED ? styles.statusBlocked : styles.statusActive}`}>
          {getStatusLabel(status)}
        </span>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        // No actions on own account (self-demotion / self-block) or on profiles with an unknown role
        if (record.id === currentUser?.uid || !isKnownRole(record.role)) {
          return <span className={styles.noActions}>—</span>;
        }
        const nextRole = record.role === ROLES.ADMIN ? ROLES.MANAGER : ROLES.ADMIN;
        const isBlocked = record.status === USER_STATUS.BLOCKED;
        return (
          <div className={styles.actionsCell}>
            <Button
              variant="text"
              size="sm"
              icon={Shield}
              onClick={() => setPendingAction({ type: 'role', target: record, newValue: nextRole })}
              title={`Сделать: ${ROLE_LABELS[nextRole]}`}
            >
              {nextRole === ROLES.ADMIN ? 'Сделать админом' : 'Сделать менеджером'}
            </Button>
            <Button
              variant="text"
              size="sm"
              icon={isBlocked ? UserCheck : UserX}
              className={isBlocked ? '' : styles.blockBtn}
              onClick={() => setPendingAction({
                type: 'status',
                target: record,
                newValue: isBlocked ? USER_STATUS.ACTIVE : USER_STATUS.BLOCKED
              })}
              title={isBlocked ? 'Разблокировать' : 'Заблокировать'}
            >
              {isBlocked ? 'Разблокировать' : 'Заблокировать'}
            </Button>
          </div>
        );
      }
    }
  ];

  const renderConfirmText = () => {
    if (!pendingAction) return null;
    const { type, target, newValue } = pendingAction;
    const who = <strong>{getUserLabel(target)}</strong>;
    if (type === 'role') {
      return (
        <p className={styles.confirmText}>
          Изменить роль пользователя {who}: {ROLE_LABELS[target.role]} → <strong>{ROLE_LABELS[newValue]}</strong>?
          {newValue === ROLES.ADMIN && ' Администратор получает полный доступ: отчёты, настройки, журнал аудита и управление пользователями.'}
        </p>
      );
    }
    return newValue === USER_STATUS.BLOCKED ? (
      <p className={styles.confirmText}>
        Заблокировать пользователя {who}? Он сразу потеряет доступ к CRM, открытая сессия будет завершена.
        Учётная запись и история его операций сохранятся.
      </p>
    ) : (
      <p className={styles.confirmText}>Разблокировать пользователя {who}? Он снова сможет войти в CRM.</p>
    );
  };

  const isBlockAction = pendingAction?.type === 'status' && pendingAction.newValue === USER_STATUS.BLOCKED;

  return (
    <div className={styles.usersPage}>
      {/* Top controls */}
      <Card className={styles.controlsCard}>
        <div className={styles.controlsWrapper}>
          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className={styles.search}
          />
          <Button icon={Plus} onClick={() => setIsCreateInfoOpen(true)}>
            Добавить пользователя
          </Button>
        </div>
      </Card>

      {/* Users table */}
      {state.status === 'loading' ? (
        <Loader text="Загрузка пользователей..." />
      ) : state.status === 'error' ? (
        <Card>
          <Empty
            icon={AlertTriangle}
            title="Не удалось загрузить пользователей"
            description={state.error}
            action={<Button variant="outline" size="sm" icon={RefreshCw} onClick={handleRetry}>Повторить</Button>}
          />
        </Card>
      ) : state.users.length === 0 ? (
        <Card>
          <Empty icon={UsersIcon} title="Пользователей нет" description="Профили пользователей не найдены." />
        </Card>
      ) : (
        <Table columns={columns} dataSource={filteredUsers} emptyText="Пользователи не найдены" />
      )}

      {/* Role / status confirmation */}
      <Modal
        isOpen={!!pendingAction}
        onClose={() => !saving && setPendingAction(null)}
        title={pendingAction?.type === 'role' ? 'Изменение роли' : isBlockAction ? 'Блокировка пользователя' : 'Разблокировка пользователя'}
        onSave={handleConfirm}
        saveText={pendingAction?.type === 'role' ? 'Изменить роль' : isBlockAction ? 'Заблокировать' : 'Разблокировать'}
        saveVariant={isBlockAction ? 'danger' : 'primary'}
        cancelText="Отмена"
        loading={saving}
      >
        {renderConfirmText()}
      </Modal>

      {/* New account creation needs a trusted backend */}
      <Modal
        isOpen={isCreateInfoOpen}
        onClose={() => setIsCreateInfoOpen(false)}
        title="Добавление пользователя"
        footer={
          <Button variant="secondary" onClick={() => setIsCreateInfoOpen(false)}>
            Понятно
          </Button>
        }
      >
        <div className={styles.confirmText}>
          <p>
            Создание нового аккаунта требует серверного Firebase Admin SDK. Пока создайте пользователя
            через Firebase Console (Authentication → Add user), затем добавьте ему профиль
            <code> users/&#123;uid&#125; </code> в Firestore с полями:
          </p>
          <ul className={styles.infoList}>
            <li><code>email</code> — email пользователя;</li>
            <li><code>role</code> — <code>manager</code> или <code>admin</code>;</li>
            <li><code>status</code> — <code>active</code>.</li>
          </ul>
          <p>После этого пользователь появится в списке, и его роль и статус можно будет менять здесь.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
