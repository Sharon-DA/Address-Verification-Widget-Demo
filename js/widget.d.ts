/**
 * Address Verification Widget — TypeScript Definitions & Type Contracts
 * Zero-dependency Vanilla JS SDK for Postal Address Verification (NIPOST, USPS, Universal)
 */

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
}

export interface AddressVerificationWidgetOptions {
  /** Target DOM element or element ID string (e.g. 'address-widget' or document.getElementById('address-widget')) */
  containerId: string | HTMLElement;
  /** ISO 2-letter country code default (default: 'NG') */
  defaultCountry?: string;
  /** Callback fired upon completion of address verification */
  onVerificationComplete?: (result: VerificationResult) => void;
  /** Callback fired on state transition ('initiation' | 'loading' | 'result') */
  onStateChange?: (state: WidgetStateSnapshot) => void;
  /** Whether to auto-focus street address input on load (default: true) */
  autoFocus?: boolean;
  /** Artificial latency in milliseconds for demonstration (default: 2000) */
  simulateLatencyMs?: number;
}

export class AddressVerificationWidget {
  /** Widget version */
  static readonly VERSION: string;

  constructor(options: AddressVerificationWidgetOptions);

  /** Initialize widget structure and mount event listeners */
  init(): void;

  /** Render active widget state view into container */
  render(): void;

  /** Transition widget to specified state */
  transitionToState(newState: 'initiation' | 'loading' | 'result'): void;

  /** Pre-fill address form fields with preset object */
  setPreset(data: Partial<AddressFormData>): void;

  /** Validate form input values according to regional rules */
  validateFormData(): boolean;

  /** Trigger asynchronous address verification mock pipeline */
  performVerification(): void;

  /** Compute mock verification result matching database records */
  computeVerificationResult(formData: AddressFormData): VerificationResult;

  /** Copy standardized address to user clipboard */
  copyStandardizedAddress(): void;

  /** Reset widget back to initiation state and clear inputs */
  reset(): void;

  /** Retrieve current widget state snapshot for inspection or host app state sync */
  getState(): WidgetStateSnapshot;

  /** Unmount widget, clear timers, and remove DOM children */
  destroy(): void;
}

export default AddressVerificationWidget;
