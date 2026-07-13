import { useState, useMemo } from 'react';
import { Plus, Star, Phone, Mail, Trash2 } from 'lucide-react';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Search from '../../components/Search/Search';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import styles from './Suppliers.module.scss';

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', email: '', rating: 5, status: 'Активный' });
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'ТОО TechDistribute', contact: 'Аружан Нурланова', phone: '+7 701 555-0192', email: 'info@techdist.kz', rating: 4.8, status: 'Активный' },
    { id: 2, name: 'IP Accessories Almaty', contact: 'Данияр Сериков', phone: '+7 747 333-8811', email: 'd.serikov@ipacc.kz', rating: 4.5, status: 'Активный' },
    { id: 3, name: 'Smart Logistics KZ', contact: 'Владимир Ким', phone: '+7 777 999-4400', email: 'v.kim@smartlog.kz', rating: 4.2, status: 'В ожидании' },
    { id: 4, name: 'Global Goods Import', contact: 'Елена Васильева', phone: '+7 702 111-2233', email: 'import@globalgoods.kz', rating: 3.9, status: 'Активный' }
  ]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      return sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             sup.contact.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [suppliers, searchQuery]);

  const handleCreateSupplier = () => {
    if (!newSupplier.name || !newSupplier.contact || !newSupplier.phone) return;

    const newId = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
    setSuppliers([
      ...suppliers,
      {
        id: newId,
        name: newSupplier.name,
        contact: newSupplier.contact,
        phone: newSupplier.phone,
        email: newSupplier.email || '—',
        rating: Number(newSupplier.rating) || 5.0,
        status: newSupplier.status
      }
    ]);

    setNewSupplier({ name: '', contact: '', phone: '', email: '', rating: 5, status: 'Активный' });
    setIsModalOpen(false);
  };

  const handleDeleteSupplier = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  const columns = [
    {
      title: 'Компания / Поставщик',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <div className={styles.companyCell}>
          <span className={styles.companyName}>{name}</span>
        </div>
      )
    },
    { title: 'Контактное лицо', dataIndex: 'contact', key: 'contact' },
    {
      title: 'Связь',
      key: 'contacts',
      render: (_, record) => (
        <div className={styles.contactsCell}>
          <a href={`tel:${record.phone}`} className={styles.contactItem} title="Позвонить">
            <Phone size={14} />
            <span>{record.phone}</span>
          </a>
          {record.email !== '—' && (
            <a href={`mailto:${record.email}`} className={styles.contactItem} title="Написать">
              <Mail size={14} />
              <span>{record.email}</span>
            </a>
          )}
        </div>
      )
    },
    {
      title: 'Рейтинг',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <div className={styles.ratingCell}>
          <Star size={14} className={styles.starIcon} />
          <span>{rating.toFixed(1)}</span>
        </div>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`${styles.statusBadge} ${status === 'Активный' ? styles.statusActive : styles.statusPending}`}>
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
          <Button variant="text" size="sm" icon={Trash2} className={styles.deleteBtn} onClick={() => handleDeleteSupplier(record.id)} aria-label="Удалить" />
        </div>
      )
    }
  ];

  return (
    <div className={styles.suppliersPage}>
      {/* Top bar controls */}
      <Card className={styles.controlsCard}>
        <div className={styles.controlsWrapper}>
          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по компании или контакту..."
            className={styles.search}
          />
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Добавить поставщика
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Table columns={columns} dataSource={filteredSuppliers} emptyText="Поставщики не найдены" />

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Добавление поставщика"
        onSave={handleCreateSupplier}
        saveText="Создать"
        cancelText="Отмена"
      >
        <div className={styles.modalFields}>
          <Input
            label="Название компании"
            placeholder="Введите название компании"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
            required
          />
          <Input
            label="Контактное лицо (ФИО)"
            placeholder="Введите контактное лицо"
            value={newSupplier.contact}
            onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
            required
          />
          <Input
            label="Номер телефона"
            placeholder="Например, +7 701 555-0100"
            value={newSupplier.phone}
            onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
            required
          />
          <Input
            label="Email адрес"
            placeholder="Например, info@supplier.kz"
            value={newSupplier.email}
            onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
          />
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Статус сотрудничества</label>
            <select
              className={styles.selectInput}
              value={newSupplier.status}
              onChange={(e) => setNewSupplier({ ...newSupplier, status: e.target.value })}
            >
              <option value="Активный">Активный сотрудничает</option>
              <option value="В ожидании">В ожидании согласования</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;
