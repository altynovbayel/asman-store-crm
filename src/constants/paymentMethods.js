export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  POS_TERMINAL: 'pos_terminal',
  M_PLUS: 'm_plus',
  ZERO: 'zero'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Наличные',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Банковский перевод',
  [PAYMENT_METHODS.POS_TERMINAL]: 'POS-терминал',
  [PAYMENT_METHODS.M_PLUS]: 'М+',
  [PAYMENT_METHODS.ZERO]: 'Zero'
};
