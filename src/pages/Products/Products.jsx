import { useState, useMemo } from 'react';
import { Plus, Filter, Trash2, Edit3 } from 'lucide-react';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Search from '../../components/Search/Search';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import styles from './Products.module.scss';

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [currentProduct, setCurrentProduct] = useState({ id: '', name: '', sku: '', category: '', price: '', stock: '' });
  
  const [products, setProducts] = useState([
    { id: 1, name: 'Смартфон iPhone 15 Pro Max', sku: 'IPH15PM-256', category: 'Электроника', price: '680,000 ₸', stock: 15 },
    { id: 2, name: 'Беспроводные наушники AirPods Pro 2', sku: 'APP2-WRLS', category: 'Аксессуары', price: '125,000 ₸', stock: 48 },
    { id: 3, name: 'Умные часы Apple Watch Series 9', sku: 'AW9-45ALM', category: 'Электроника', price: '220,000 ₸', stock: 8 },
    { id: 4, name: 'Ноутбук MacBook Pro 14 M3', sku: 'MBP14-M3-512', category: 'Электроника', price: '950,000 ₸', stock: 0 },
    { id: 5, name: 'Сетевое зарядное устройство 20W', sku: 'CHG-20W-USB', category: 'Аксессуары', price: '15,000 ₸', stock: 120 },
    { id: 6, name: 'Кожаный чехол MagSafe для iPhone', sku: 'CS-IP15P-LTH', category: 'Аксессуары', price: '35,000 ₸', stock: 35 }
  ]);

  const categories = ['All', 'Электроника', 'Аксессуары'];

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Open modal for creating new product
  const handleOpenCreate = () => {
    setCurrentProduct({ name: '', sku: '', category: 'Электроника', price: '', stock: '' });
    setModalType('create');
    setIsModalOpen(true);
  };

  // Open modal for editing existing product
  const handleOpenEdit = (product) => {
    // Stripcurrency symbol for numeric inputs
    const numericPrice = product.price.replace(/[^\d]/g, '');
    setCurrentProduct({
      ...product,
      price: numericPrice
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Save changes (Create or Edit)
  const handleSaveProduct = () => {
    if (!currentProduct.name || !currentProduct.sku || !currentProduct.price || currentProduct.stock === '') return;

    const formattedPrice = `${Number(currentProduct.price).toLocaleString('ru-RU')} ₸`;
    const stockNum = Number(currentProduct.stock);

    if (modalType === 'create') {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      setProducts([
        ...products,
        {
          id: newId,
          name: currentProduct.name,
          sku: currentProduct.sku,
          category: currentProduct.category,
          price: formattedPrice,
          stock: stockNum
        }
      ]);
    } else {
      setProducts(products.map(p => 
        p.id === currentProduct.id 
          ? { ...p, name: currentProduct.name, sku: currentProduct.sku, category: currentProduct.category, price: formattedPrice, stock: stockNum }
          : p
      ));
    }
    setIsModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const columns = [
    { title: 'Артикул / SKU', dataIndex: 'sku', key: 'sku', render: (sku) => <code className={styles.sku}>{sku}</code> },
    { title: 'Название товара', dataIndex: 'name', key: 'name', render: (name) => <span className={styles.productName}>{name}</span> },
    { title: 'Категория', dataIndex: 'category', key: 'category' },
    { title: 'Цена', dataIndex: 'price', key: 'price' },
    { 
      title: 'Остаток', 
      dataIndex: 'stock', 
      key: 'stock',
      render: (stock) => {
        if (stock === 0) return <span className={`${styles.stockBadge} ${styles.outOfStock}`}>Нет в наличии</span>;
        if (stock < 10) return <span className={`${styles.stockBadge} ${styles.lowStock}`}>{stock} шт (Мало)</span>;
        return <span className={`${styles.stockBadge} ${styles.inStock}`}>{stock} шт</span>;
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div className={styles.actionsCell}>
          <Button variant="text" size="sm" icon={Edit3} onClick={() => handleOpenEdit(record)} aria-label="Редактировать" />
          <Button variant="text" size="sm" icon={Trash2} className={styles.deleteBtn} onClick={() => handleDeleteProduct(record.id)} aria-label="Удалить" />
        </div>
      )
    }
  ];

  return (
    <div className={styles.productsPage}>
      {/* Top Filter and Search Bar */}
      <Card className={styles.controlsCard}>
        <div className={styles.controlsWrapper}>
          <Search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или SKU..."
            className={styles.search}
          />
          
          <div className={styles.filtersWrapper}>
            <div className={styles.categorySelectWrapper}>
              <Filter size={16} className={styles.filterIcon} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.categorySelect}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'Все категории' : cat}
                  </option>
                ))}
              </select>
            </div>
            
            <Button icon={Plus} onClick={handleOpenCreate}>
              Добавить товар
            </Button>
          </div>
        </div>
      </Card>

      {/* Products Table Card */}
      <Table 
        columns={columns} 
        dataSource={filteredProducts} 
        emptyText="Товары не найдены"
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'create' ? 'Добавление товара' : 'Редактирование товара'}
        onSave={handleSaveProduct}
        saveText={modalType === 'create' ? 'Создать' : 'Сохранить'}
        cancelText="Отмена"
      >
        <div className={styles.modalFields}>
          <Input
            label="Название товара"
            placeholder="Введите название товара"
            value={currentProduct.name}
            onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
            required
          />
          <Input
            label="Артикул (SKU)"
            placeholder="Например, IPH15PM-256"
            value={currentProduct.sku}
            onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
            required
          />
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Категория</label>
            <select
              className={styles.selectInput}
              value={currentProduct.category}
              onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
            >
              <option value="Электроника">Электроника</option>
              <option value="Аксессуары">Аксессуары</option>
            </select>
          </div>
          <Input
            label="Цена товара (₸)"
            type="number"
            placeholder="Введите стоимость"
            value={currentProduct.price}
            onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
            required
          />
          <Input
            label="Количество на складе"
            type="number"
            placeholder="Введите остаток на складе"
            value={currentProduct.stock}
            onChange={(e) => setCurrentProduct({ ...currentProduct, stock: e.target.value })}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default Products;
