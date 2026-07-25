import { useCart } from '../../hooks/useCart';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import ProductSearch from '../../components/ProductSearch/ProductSearch';
import Cart from '../../components/Cart/Cart';
import CustomerForm from '../../components/CustomerForm/CustomerForm';
import SaleSummary from '../../components/SaleSummary/SaleSummary';
import { PAYMENT_METHODS } from '../../constants/paymentMethods';
import styles from './Sales.module.scss';

const Sales = () => {
  const {
    cartItems,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod,
    comment,
    setComment,
    errors,
    loading,
    errorMsg,
    successMsg,
    subtotal,
    totalDiscount,
    grandTotal,
    handleSelectProduct,
    handleUpdateQuantity,
    handleUpdateItemDiscount,
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
        {/* 2. Left side: Customer details, Payment method, and Product search */}
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
          <div className={styles.panelCard}>
            <div className={styles.paymentSection}>
              <h3 className={styles.sectionTitle}>Способ оплаты и примечание</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Способ оплаты *</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.CASH}
                      checked={paymentMethod === PAYMENT_METHODS.CASH}
                      onChange={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
                      className={styles.radioInput}
                    />
                    <span>Наличные</span>
                  </label>
                  
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.BANK_TRANSFER}
                      checked={paymentMethod === PAYMENT_METHODS.BANK_TRANSFER}
                      onChange={() => setPaymentMethod(PAYMENT_METHODS.BANK_TRANSFER)}
                      className={styles.radioInput}
                    />
                    <span>Банковский перевод</span>
                  </label>
                  
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.POS_TERMINAL}
                      checked={paymentMethod === PAYMENT_METHODS.POS_TERMINAL}
                      onChange={() => setPaymentMethod(PAYMENT_METHODS.POS_TERMINAL)}
                      className={styles.radioInput}
                    />
                    <span>POS-терминал</span>
                  </label>
                </div>
                {errors.paymentMethod && <span className={styles.errorText}>{errors.paymentMethod}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="sale-comment" className={styles.label}>Примечание</label>
                <textarea
                  id="sale-comment"
                  className={styles.textarea}
                  placeholder="Например: скидка согласована с директором..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="2"
                />
              </div>
            </div>
          </div>

          
        </aside>

        {/* 3. Right side: Shopping Cart Table */}
        <section className={styles.rightPart}>
          <Card title="Корзина чека" className={styles.cartCard} bodyClassName={styles.cartCardBody}>
            <Cart
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateItemDiscount={handleUpdateItemDiscount}
              onRemoveItem={handleRemoveItem}
              errors={errors}
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
            totalDiscount={totalDiscount}
            grandTotal={grandTotal}
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
