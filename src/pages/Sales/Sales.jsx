import { useCart } from '../../hooks/useCart';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import ProductSearch from '../../components/ProductSearch/ProductSearch';
import Cart from '../../components/Cart/Cart';
import CustomerForm from '../../components/CustomerForm/CustomerForm';
import SaleSummary from '../../components/SaleSummary/SaleSummary';
import styles from './Sales.module.scss';

const Sales = () => {
  const {
    cartItems,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    discount,
    setDiscount,
    errors,
    loading,
    errorMsg,
    successMsg,
    subtotal,
    grandTotal,
    handleSelectProduct,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearAll,
    handleCompleteSale
  } = useCart();

  return (
    <div className={styles.salesPage}>
      {/* 1. Success & Error alerts */}
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      {errors.cart && <div className={styles.errorAlert}>{errors.cart}</div>}

      <div className={styles.mainArea}>
        {/* 2. Left side: Customer details and Product search */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelCard}>
            <CustomerForm
              name={customerName}
              onNameChange={setCustomerName}
              phone={customerPhone}
              onPhoneChange={setCustomerPhone}
              errors={errors}
            />
          </div>

          <div className={`${styles.panelCard} ${styles.searchCard}`}>
            <ProductSearch onSelectProduct={handleSelectProduct} />
          </div>
        </aside>

        {/* 3. Right side: Shopping Cart Table */}
        <section className={styles.rightPart}>
          <Card title="Корзина чека" className={styles.cartCard} bodyClassName={styles.cartCardBody}>
            <Cart
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </Card>
        </section>
      </div>

      {/* 4. Bottom Calculations and Save panel */}
      <footer className={styles.bottomPanel}>
        <div className={styles.bottomLeft}>
          <Button
            variant="success"
            size="md"
            onClick={handleCompleteSale}
            loading={loading}
            disabled={cartItems.length === 0}
          >
            Провести продажу
          </Button>
        </div>

        <div className={styles.bottomCenter}>
          <SaleSummary
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            grandTotal={grandTotal}
            error={errors.discount}
          />
        </div>

        <div className={styles.bottomRight}>
          <Button
            variant="outline"
            size="md"
            onClick={handleClearAll}
            disabled={loading}
          >
            Очистить всё
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Sales;
