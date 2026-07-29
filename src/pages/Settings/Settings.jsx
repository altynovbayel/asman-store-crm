import { useState } from 'react';
import { Save } from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Loader from '../../components/Loader/Loader';
import styles from './Settings.module.scss';

const Settings = () => {
  const { settings, loading, saving, saveSettings } = useStoreSettings();
  const [formData, setFormData] = useState(null);

  // Initialize state inline during render once settings data is fetched
  if (settings && !formData) {
    setFormData({
      storeName: settings.storeName || '',
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || '',
      email: settings.email || '',
      website: settings.website || '',
      address: settings.address || '',
      logoUrl: settings.logoUrl || '',
      currency: settings.currency || 'сом',
      defaultWarrantyMonths: settings.defaultWarrantyMonths !== undefined ? settings.defaultWarrantyMonths : 12,
      warrantyTerms: settings.warrantyTerms || ''
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData) {
      await saveSettings(formData);
    }
  };

  if (loading || !formData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader text="Загрузка настроек магазина..." />
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      <Card title="Настройки магазина" subtitle="Управление базовой информацией и условиями гарантии вашей торговой сети">
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formFields}>
            
            <div className={styles.rowFields}>
              <Input
                label="Название магазина"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
              />
              
              <Input
                label="Ссылка на логотип (URL)"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className={styles.rowFields}>
              <Input
                label="Телефон магазина"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              
              <Input
                label="Номер WhatsApp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>

            <div className={styles.rowFields}>
              <Input
                label="Электронная почта"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              
              <Input
                label="Веб-сайт"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.asmanstore.kg"
              />
            </div>

            <div className={styles.rowFields}>
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Валюта</label>
                <select
                  className={styles.selectInput}
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="сом">Киргизский сом (сом)</option>
                  <option value="₸">Казахстанский тенге (₸)</option>
                  <option value="$">Доллар США ($)</option>
                  <option value="₽">Российский рубль (₽)</option>
                </select>
              </div>

              <Input
                label="Срок гарантии по умолчанию (месяцев)"
                type="number"
                value={formData.defaultWarrantyMonths}
                onChange={(e) => setFormData({ ...formData, defaultWarrantyMonths: parseInt(e.target.value, 10) || 0 })}
                min="0"
                required
              />
            </div>

            <Input
              label="Адрес магазина"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <div className={styles.textareaGroup}>
              <label htmlFor="warranty-terms-area" className={styles.selectLabel}>
                Условия гарантии (каждый пункт с новой строки)
              </label>
              <textarea
                id="warranty-terms-area"
                className={styles.textarea}
                value={formData.warrantyTerms}
                onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
                placeholder="Введите пункты гарантийного соглашения..."
                required
              />
            </div>

          </div>

          <div className={styles.formActions}>
            <Button type="submit" icon={Save} loading={saving}>
              Сохранить настройки
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Settings;
