export interface MarkingCheckResult {
  code: string;
  valid: boolean;
  found: boolean;
  productName?: string;
  productGroup?: string;
  ownerName?: string;
  ownerInn?: string;
  status?: string;
  statusDetails?: string;
  brand?: string;
  producerName?: string;
  producerInn?: string;
}

export interface CrptCheckResponse {
  code?: string;
  codeFounded?: boolean;
  isOwner?: boolean;
  isValid?: boolean;
  productName?: string;
  productGroupName?: string;
  ownerName?: string;
  ownerInn?: string;
  status?: string;
  statusText?: string;
  brand?: string;
  producerName?: string;
  producerInn?: string;
  [key: string]: unknown;
}
