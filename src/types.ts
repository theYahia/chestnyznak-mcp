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

export interface CrptAuthSearchResponse {
  results?: CrptSearchItem[];
  total?: number;
  [key: string]: unknown;
}

export interface CrptSearchItem {
  cis?: string;
  gtin?: string;
  producerName?: string;
  productName?: string;
  brand?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CrptBatchResponse {
  results?: CrptBatchItem[];
  [key: string]: unknown;
}

export interface CrptBatchItem {
  cis?: string;
  codeFounded?: boolean;
  isValid?: boolean;
  status?: string;
  productName?: string;
  [key: string]: unknown;
}
