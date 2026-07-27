export interface AddressFormData {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipcode: string;
  country?: string;
}

export interface StandardizedAddress {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface VerificationResult {
  verified: boolean;
  confidenceScore: number;
  message?: string;
  dpvConfirmation?: string;
  dpvFootnotes?: string;
  carrierRoute?: string;
  issues?: string[];
  submitted?: AddressFormData;
  standardized?: StandardizedAddress;
  timestamp: string;
}

export interface WidgetStateSnapshot {
  currentState: 'initiation' | 'loading' | 'result';
  formData: AddressFormData;
  verificationResult: VerificationResult | null;
  timestamp: string;
}

export interface AddressVerificationWidgetOptions {
  containerId: string | HTMLElement;
  defaultCountry?: string;
  onVerificationComplete?: (result: VerificationResult) => void;
  onStateChange?: (state: WidgetStateSnapshot) => void;
  autoFocus?: boolean;
}

export class AddressVerificationWidget {
  constructor(options: AddressVerificationWidgetOptions);

  init(): void;
  render(): void;
  transitionToState(newState: 'initiation' | 'loading' | 'result'): void;
  setPreset(data: Partial<AddressFormData>): void;
  validateFormData(): boolean;
  performVerification(): void;
  computeVerificationResult(): VerificationResult;
  reset(): void;
  getState(): WidgetStateSnapshot;
  destroy(): void;
}

export default AddressVerificationWidget;
