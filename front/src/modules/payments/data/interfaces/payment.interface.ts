// Interfaces para el manejo de pagos
export interface PaymentValue {
  value: number;
  causationDate: string;
  paymentDate: string;
}

export interface PaymentData {
  id?: string;
  record: any;
  successBonus: boolean;
  bonusPercentage: number;
  bonusPrice: number;
  bonusCausationDate: string;
  bonusPaymentDate: string;
  notes: string;
  paymentValues: PaymentValue[];
}

export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  payment: PaymentData;
}

export interface UpdatePaymentResponse {
  success: boolean;
  message: string;
  payment: PaymentData;
}

export interface DeletePaymentResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
