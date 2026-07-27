# Standalone Address Verification Widget SDK

**Designed & Developed by**: Sharon A

This is a lightweight, zero-dependency Vanilla JavaScript widget for address verification. Built as an encapsulated, embeddable component supporting **Nigerian (NIPOST)**, **US (USPS CASS/DPV)**, and **International** address verification. Designed to be integrated directly into web applications or packaged as a drop-in JavaScript library.

---

## Technical Overview

- **Zero External Dependencies**: Pure DOM manipulation, native ES6+ JavaScript, and Vanilla CSS design tokens.
- **Three-State Workflow State Machine**:
  - **Initiation State**: Multi-region postal input form with dynamic field rules, SVG input icons, real-time validation, and quick-test preset chips.
  - **Loading / Verification State**: Multi-step animated progress sequence simulating CASS standardization, geocoding, and DPV database matching.
  - **Result State**: Detailed match analysis displaying standardized postal address, carrier route code, delivery confidence match score, or diagnostic failure reasons.
- **SDK Architecture**: Encapsulated component class with lifecycle event callbacks (`onStateChange`, `onVerificationComplete`), API methods (`getState()`, `setPreset()`, `reset()`, `destroy()`), ARIA accessibility compliance, and instant Dark/Light mode theme switching.

---

## File Structure

```
address-verification-widget/
├── index.html                 # Standalone demo web page with real-time state & event inspector
├── css/
│   └── widget.css            # Component design system (CSS variables, animations, dark mode)
├── js/
│   ├── widget.js             # Core AddressVerificationWidget component class
│   └── widget.d.ts           # TypeScript type declaration file for SDK consumers
├── README.md                 # Technical documentation & library packaging guide
└── .gitignore               # Version control exclusion rules
```

---

## Quick Start Guide

### Direct HTML Integration

1. **Include CSS and JavaScript files:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Address Verification SDK Integration</title>
  <link rel="stylesheet" href="css/widget.css">
</head>
<body>

  <!-- Target Container Element -->
  <div id="address-widget"></div>

  <!-- Include Widget SDK -->
  <script src="js/widget.js"></script>

  <script>
    // Instantiate Address Verification Widget
    const widget = new AddressVerificationWidget({
      containerId: 'address-widget',
      defaultCountry: 'NG',
      onVerificationComplete: (result) => {
        if (result.verified) {
          console.log('Verified Address:', result.standardized);
          console.log('Match Confidence:', result.confidenceScore + '%');
        } else {
          console.log('Verification Failed:', result.issues);
        }
      },
      onStateChange: (state) => {
        console.log('Widget State Changed:', state.currentState);
      }
    });
  </script>
</body>
</html>
```

2. **Launch `index.html` in any web browser** to test the interactive demo and live JSON state inspector.

---

## Component API Reference

### Constructor Options (`AddressVerificationWidgetOptions`)

```typescript
new AddressVerificationWidget(options: AddressVerificationWidgetOptions);
```

| Option | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `containerId` | `string \| HTMLElement` | **Yes** | `undefined` | Target element ID string or HTMLElement reference where the widget mounts. |
| `defaultCountry` | `string` | No | `'NG'` | ISO 2-letter default country selection (`'NG'`, `'US'`, `'GB'`, etc.). |
| `onVerificationComplete` | `Function` | No | `null` | Callback executed upon completion (`(result: VerificationResult) => void`). |
| `onStateChange` | `Function` | No | `null` | Callback executed on state transition (`(state: WidgetStateSnapshot) => void`). |
| `autoFocus` | `boolean` | No | `true` | Automatically focuses the street address input field on initiation. |
| `simulateLatencyMs` | `number` | No | `2000` | Simulated backend network latency in milliseconds. |

---

### Core SDK Methods

| Method | Return Type | Description |
| :--- | :--- | :--- |
| `init()` | `void` | Mounts component structure into the target container and renders initiation state. |
| `render()` | `void` | Renders view elements corresponding to the active state (`initiation`, `loading`, `result`). |
| `transitionToState(newState)` | `void` | Changes widget state programmatically and triggers re-render. |
| `setPreset(data)` | `void` | Pre-fills form input fields with specified address object. |
| `validateFormData()` | `boolean` | Validates required inputs according to regional rules (e.g. 5-6 digit postal code for NG/US). |
| `performVerification()` | `void` | Runs asynchronous verification pipeline sequence. |
| `computeVerificationResult(data)` | `VerificationResult` | Computes match score against mock postal database entries. |
| `copyStandardizedAddress()` | `void` | Copies the formatted standardized address text to the user's clipboard. |
| `reset()` | `void` | Resets widget internal state, clears inputs, and returns to initiation state. |
| `getState()` | `WidgetStateSnapshot` | Returns current snapshot `{ currentState, formData, verificationResult }`. |
| `destroy()` | `void` | Unmounts DOM elements, clears active timers, and removes event listeners. |

---

## State Machine Architecture

```
                       ┌─────────────────────────┐
                       │    Initiation State     │
                       │  (Address Input Form)   │
                       └───────────┬─────────────┘
                                   │
                           Submit & Validate
                                   │
                                   ▼
                       ┌─────────────────────────┐
                       │      Loading State      │
                       │ (Multi-step Verification)│
                       └───────────┬─────────────┘
                                   │
                           Complete (2000ms)
                                   │
                                   ▼
                       ┌─────────────────────────┐
                       │      Result State       │
                       │ (Verified / Unverified) │
                       └───────────┬─────────────┘
                                   │
                        Verify Another / Reset
                                   │
                                   └─────────► (Back to Initiation)
```

---

## Packaging as a Drop-In JavaScript Library

To package and distribute this SDK for external web applications or package registries:

### 1. Direct CDN / UMD Script Tag Distribution

Bundle and minify `js/widget.js` and `css/widget.css` using standard build tooling (e.g., Vite, Esbuild, or Rollup):

```html
<link rel="stylesheet" href="https://cdn.orgbyte.com/address-widget.min.css">
<script src="https://cdn.orgbyte.com/address-widget.min.js"></script>

<div id="checkout-address-widget"></div>
<script>
  const widget = new AddressVerificationWidget({
    containerId: 'checkout-address-widget',
    defaultCountry: 'NG'
  });
</script>
```

### 2. NPM Package Module Distribution

Define `package.json` package manifest for NPM:

```json
{
  "name": "@orgbyte/address-verification-widget",
  "version": "1.0.0",
  "description": "Standalone Vanilla JS Address Verification Widget SDK",
  "main": "js/widget.js",
  "types": "js/widget.d.ts",
  "style": "css/widget.css",
  "files": [
    "js/",
    "css/"
  ],
  "keywords": [
    "address-verification",
    "vanilla-js",
    "nipost",
    "usps",
    "cass",
    "dpv",
    "sdk"
  ]
}
```

Installation and Import Usage:

```bash
npm install @orgbyte/address-verification-widget
```

```javascript
import AddressVerificationWidget from 'address-verification-widget';

// Bundlers (Vite, Webpack, Parcel) can import CSS files directly.
// This tells the bundler to include widget.css in the final build.
// Not needed if you are using a plain <link> tag in HTML.
import 'address-verification-widget/css/widget.css';

const widget = new AddressVerificationWidget({
  containerId: 'checkout-address-container',
  defaultCountry: 'NG'
});
```

---

## TypeScript Declarations (`widget.d.ts`)

The project includes full TypeScript typings (`js/widget.d.ts`) allowing TypeScript projects to consume the widget with type safety and IntelliSense completion:

```typescript
import { AddressVerificationWidget, VerificationResult } from '@orgbyte/address-verification-widget';

const widget = new AddressVerificationWidget({
  containerId: 'address-widget',
  onVerificationComplete: (result: VerificationResult) => {
    console.log(`Verified status: ${result.verified}`);
  }
});
```

---

## Browser Support & Accessibility

- **Browsers**: Chrome, Firefox, Safari, Edge (Modern Evergreen Browsers).
- **Accessibility**:
  - ARIA attributes (`aria-live="polite"`, `aria-invalid`, `aria-describedby`).
  - Screen-reader text labels.
  - Keyboard navigation and focus rings (`:focus-visible`).

---

## License

MIT License