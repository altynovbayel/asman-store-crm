import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Store } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { logAction } from '../../services/firebase/audit.service';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './Login.module.scss';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!email.trim()) {
      setError('Пожалуйста, введите ваш email.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Введите корректный email адрес.');
      return;
    }
    if (!password) {
      setError('Пожалуйста, введите пароль.');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен состоять минимум из 6 символов.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);
      await logAction(loggedUser, 'LOGIN_SUCCESS', `Пользователь ${loggedUser.name || loggedUser.email} успешно вошел в систему`);
      
      // Redirect back to page user tried to access or dashboard
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      // Handle Firebase errors
      if (err.code === 'auth/invalid-email') {
        setError('Неверный формат email.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Неверный email или пароль.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Ошибка сети. Проверьте подключение к Интернету.');
      } else {
        setError(err.message || 'Произошла ошибка при входе. Попробуйте еще раз.');
      }
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginWrapper}>
        <div className={styles.brand}>
          <Store size={36} className={styles.brandIcon} />
          <span className={styles.brandName}>Asman Store</span>
        </div>
        
        <Card title="Вход в систему" subtitle="Введите ваши данные для доступа к CRM" className={styles.loginCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}
            
            <Input
              label="Электронная почта (Email)"
              type="email"
              placeholder="name@asman.kz"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className={styles.submitBtn}
            >
              Войти в систему
            </Button>
          </form>
        </Card>
        
        <p className={styles.footerText}>
          Разработано для Asman Store CRM. Все права защищены © 2026.
        </p>
      </div>
    </div>
  );
};

export default Login;
