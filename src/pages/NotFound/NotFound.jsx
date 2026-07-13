import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/Button/Button';
import styles from './NotFound.module.scss';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.notFoundPage}>
      <div className={styles.content}>
        <div className={styles.codeWrapper}>
          <h1 className={styles.errorCode}>404</h1>
          <div className={styles.circleBg} />
        </div>
        
        <h2 className={styles.errorTitle}>Страница не найдена</h2>
        <p className={styles.errorDescription}>
          Упс! Запрашиваемая вами страница не существует или была перемещена по другому адресу.
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

export default NotFound;
