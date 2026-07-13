import { useState, useMemo } from 'react';
import { Plus, Shield, UserX, UserCheck, Trash2 } from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Search from '../../components/Search/Search';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import styles from './Users.module.scss';

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Менеджер', status: 'Активен' });
  const [users, setUsers] = useState([
    { id: 1, name: 'Арман Султанов', email: 'a.sultanov@asman.kz', role: 'Администратор', status: 'Активен' },
    { id: 2, name: 'Сабина Алиева', email: 's.alieva@asman.kz', role: 'Менеджер', status: 'Активен' },
    { id: 3, name: 'Алишер Махмудов', email: 'a.mahmudov@asman.kz', role: 'Оператор', status: 'Активен' },
    { id: 4, name: 'Руслан Серикбай', email: 'r.serikbay@asman.kz', role: 'Оператор', status: 'Заблокирован' }
  ]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             u.email.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [users, searchQuery]);

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return;

    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    setUsers([
      ...users,
      {
        id: newId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    ]);

    setNewUser({ name: '', email: '', role: 'Менеджер', status: 'Активен' });
    setIsModalOpen(false);
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Активен' ? 'Заблокирован' : 'Активен';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const columns = [
    {
      title: 'Имя пользователя',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className={styles.userCell}>
          <div className={styles.avatar}>
            {name.charAt(0)}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{name}</span>
            <span className={styles.userEmail}>{record.email}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let roleClass = styles.roleOperator;
        if (role === 'Администратор') roleClass = styles.roleAdmin;
        if (role === 'Менеджер') roleClass = styles.roleManager;
        return (
          <span className={`${styles.roleBadge} ${roleClass}`}>
            <Shield size={12} />
            {role}
          </span>
        );
      }
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`${styles.statusBadge} ${status === 'Активен' ? styles.statusActive : styles.statusBlocked}`}>
          {status}
        </span>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div className={styles.actionsCell}>
          <Button
            variant="text"
            size="sm"
            icon={record.status === 'Активен' ? UserX : UserCheck}
            onClick={() => toggleUserStatus(record.id)}
            title={record.status === 'Активен' ? 'Заблокировать' : 'Активировать'}
          />
          <Button
            variant="text"
            size="sm"
            icon={Trash2}
            className={styles.deleteBtn}
            onClick={() => handleDeleteUser(record.id)}
            title="Удалить"
          />
        </div>
      )
    }
  ];

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
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Пригласить сотрудника
          </Button>
        </div>
      </Card>

      {/* Users table */}
      <Table columns={columns} dataSource={filteredUsers} emptyText="Пользователи не найдены" />

      {/* Invite Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Приглашение нового сотрудника"
        onSave={handleCreateUser}
        saveText="Пригласить"
        cancelText="Отмена"
      >
        <div className={styles.modalFields}>
          <Input
            label="ФИО сотрудника"
            placeholder="Введите ФИО сотрудника"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <Input
            label="Email адрес"
            type="email"
            placeholder="Например, name@asman.kz"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Роль в системе</label>
            <select
              className={styles.selectInput}
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="Администратор">Администратор (Полный доступ)</option>
              <option value="Менеджер">Менеджер (Управление товарами)</option>
              <option value="Оператор">Оператор (Оформление заказов)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
