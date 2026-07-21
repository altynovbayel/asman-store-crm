import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Save } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import styles from './Settings.module.scss';

const Settings = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Asman Store CRM',
    taxRate: '12',
    currency: 'KZT (₸)',
    supportEmail: 'support@asman.kz'
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderCreated: true,
    outOfStock: true,
    weeklyReport: false
  });

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Общие настройки сохранены успешно!');
    }, 800);
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      showError('Новые пароли не совпадают!');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Пароль успешно изменен!');
      setSecuritySettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 800);
  };

  return (
    <div className={styles.settingsPage}>
      {/* Sidebar Tabs */}
      <div className={styles.layout}>
        <div className={styles.tabsCardWrapper}>
          <Card className={styles.tabsCard}>
            <div className={styles.tabsList}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'general' ? styles.active : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <SettingsIcon size={18} />
                <span>Основные настройки</span>
              </button>
              
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'security' ? styles.active : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={18} />
                <span>Безопасность</span>
              </button>
              
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.active : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                <span>Уведомления</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Tab contents */}
        <div className={styles.settingsContentWrapper}>
          {activeTab === 'general' && (
            <Card title="Основные настройки" subtitle="Настройка базовой информации о вашей системе CRM">
              <form onSubmit={handleSaveGeneral} className={styles.form}>
                <div className={styles.formFields}>
                  <Input
                    label="Название магазина"
                    value={generalSettings.storeName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                    required
                  />
                  
                  <div className={styles.rowFields}>
                    <Input
                      label="Налоговая ставка (%)"
                      type="number"
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: e.target.value })}
                      required
                    />
                    
                    <div className={styles.selectGroup}>
                      <label className={styles.selectLabel}>Валюта системы</label>
                      <select
                        className={styles.selectInput}
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                      >
                        <option value="KZT (₸)">Казахстанский тенге (₸)</option>
                        <option value="USD ($)">Доллар США ($)</option>
                        <option value="RUB (₽)">Российский рубль (₽)</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Email поддержки"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                    required
                  />
                </div>
                
                <div className={styles.formActions}>
                  <Button type="submit" icon={Save} loading={loading}>
                    Сохранить изменения
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card title="Безопасность учетной записи" subtitle="Измените пароль для обеспечения безопасности вашего аккаунта">
              <form onSubmit={handleSaveSecurity} className={styles.form}>
                <div className={styles.formFields}>
                  <Input
                    label="Текущий пароль"
                    type="password"
                    placeholder="••••••••"
                    value={securitySettings.currentPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                    required
                  />
                  
                  <hr className={styles.divider} />
                  
                  <Input
                    label="Новый пароль"
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={securitySettings.newPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                    required
                  />
                  
                  <Input
                    label="Подтвердите новый пароль"
                    type="password"
                    placeholder="Повторите новый пароль"
                    value={securitySettings.confirmPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className={styles.formActions}>
                  <Button type="submit" icon={Save} loading={loading}>
                    Обновить пароль
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card title="Настройки уведомлений" subtitle="Выберите типы событий, о которых хотите получать уведомления">
              <div className={styles.form}>
                <div className={styles.checkboxList}>
                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderCreated}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, orderCreated: e.target.checked })}
                      className={styles.checkboxInput}
                    />
                    <div className={styles.checkboxLabelWrapper}>
                      <span className={styles.checkboxLabel}>Новые заказы</span>
                      <span className={styles.checkboxDesc}>Уведомлять при оформлении новых заказов в системе</span>
                    </div>
                  </label>
                  
                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.outOfStock}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, outOfStock: e.target.checked })}
                      className={styles.checkboxInput}
                    />
                    <div className={styles.checkboxLabelWrapper}>
                      <span className={styles.checkboxLabel}>Критические остатки товаров</span>
                      <span className={styles.checkboxDesc}>Уведомлять, когда товар на складе заканчивается</span>
                    </div>
                  </label>
                  
                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReport}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyReport: e.target.checked })}
                      className={styles.checkboxInput}
                    />
                    <div className={styles.checkboxLabelWrapper}>
                      <span className={styles.checkboxLabel}>Еженедельный отчет</span>
                      <span className={styles.checkboxDesc}>Отправлять отчет о выручке и продажах каждый понедельник</span>
                    </div>
                  </label>
                </div>
                
                <div className={styles.formActions}>
                  <Button onClick={() => showSuccess('Настройки уведомлений сохранены успешно!')} icon={Save}>
                    Сохранить уведомления
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
