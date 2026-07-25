export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  POS_TERMINAL: 'pos_terminal'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Наличные',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Банковский перевод',
  [PAYMENT_METHODS.POS_TERMINAL]: 'POS-терминал'
};
