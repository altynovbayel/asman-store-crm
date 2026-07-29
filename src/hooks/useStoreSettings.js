import { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '../services/firebase/settings.service';
import { useToast } from '../store/ToastContext';
import { logAction } from '../services/firebase/audit.service';
import { useAuth } from '../store/AuthContext';

export const useStoreSettings = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getStoreSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load store settings:', err);
        showError(err.message || 'Ошибка загрузки настроек.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [showError]);

  const saveSettings = async (settingsData) => {
    setSaving(true);
    try {
      await updateStoreSettings(settingsData);
      setSettings(settingsData);
      showSuccess('Настройки магазина успешно сохранены.');
      
      // Log action
      await logAction(user, 'SETTINGS_UPDATED', 'Обновлены настройки магазина');
      return true;
    } catch (err) {
      console.error('Failed to save store settings:', err);
      showError(err.message || 'Ошибка сохранения настроек.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings
  };
};
