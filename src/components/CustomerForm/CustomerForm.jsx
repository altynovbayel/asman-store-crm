import Input from '../Input/Input';
import styles from './CustomerForm.module.scss';

const CustomerForm = ({
  name,
  onNameChange,
  phone,
  onPhoneChange,
  errors = {}
}) => {
  return (
    <div className={styles.formContainer}>
      <h3 className={styles.sectionTitle}>Данные клиента</h3>
      <div className={styles.fields}>
        <Input
          label="Имя клиента"
          placeholder="ФИО клиента"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={errors.customerName}
          required
        />
        <Input
          label="Контакты клиента"
          placeholder="Номер телефона"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          error={errors.customerPhone}
          required
        />
      </div>
    </div>
  );
};

export default CustomerForm;
