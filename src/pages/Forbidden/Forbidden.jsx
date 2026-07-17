import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/Button/Button';
import styles from './Forbidden.module.scss';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.forbiddenPage}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <ShieldAlert size={80} className={styles.icon} />
          <div className={styles.pulseBg} />
        </div>
        
        <h1 className={styles.title}>Доступ ограничен</h1>
        <p className={styles.description}>
          У вашей учетной записи недостаточно прав для просмотра этого раздела. Обратитесь к администратору системы для изменения прав доступа.
        </p>
        
        <div className={styles.actions}>
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
          <Button
            variant="primary"
            icon={Home}
            onClick={() => navigate('/')}
          >
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
