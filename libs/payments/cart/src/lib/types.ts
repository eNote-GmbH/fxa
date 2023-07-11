export enum CartState {
  START = 'start',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAIL = 'fail',
}

export interface TaxAmount {
  title: string;
  amount: number;
}

export interface Invoice {
  totalAmount: number;
  taxAmounts: [TaxAmount];
}

export interface Subscription {
  pageConfigId: string;
  previousInvoice: Invoice;
  nextInvoice: Invoice;
}

export interface TaxAddress {
  countryCode: string;
  postalCode: string;
}
