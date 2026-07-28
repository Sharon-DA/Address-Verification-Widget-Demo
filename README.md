# Address Verification Widget

**Author:** Sharon A  
**Repository:** [github.com/Sharon-DA/Address-Verification-Widget-Demo](https://github.com/Sharon-DA/Address-Verification-Widget-Demo)

A lightweight, standalone address verification component built with **Vanilla JavaScript** and **CSS** (no external frameworks or libraries).

---

## Features & Implementation

- **Zero Dependencies:** Pure ES6+ JavaScript and Vanilla CSS.
- **Three-State Component Workflow:**
  1. **Initiation Screen:** Address input form with real-time validation and quick preset buttons.
  2. **Loading State:** Animated spinner and step-by-step verification checklist.
  3. **Result Screen:** Displays verified standardized address (or failure reasons if unverified).
- **Interactive State Inspector:** Sidebar on the demo page showing live JSON state snapshots and callback event logs.
- **Dark Mode Support:** Built-in theme toggle.
- **TypeScript Support:** Included `widget.d.ts` declaration file.

---

## File Structure

```
address-ver-widget/
├── index.html          # Standalone demo web page with live inspector
├── css/
│   ├── base.css         # Base/reset styles and shared design tokens
│   └── widget.css       # Component stylesheet (design system, dark mode)
├── js/
│   ├── widget.js       # Encapsulated AddressVerificationWidget class
│   └── widget.d.ts     # TypeScript type definitions
└── README.md
```

---

## Quick Start

Open `index.html` directly in any web browser to view the interactive demo.

### Basic Integration Example

```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/widget.css">

<!-- Container where the widget mounts -->
<div id="address-widget"></div>

<script src="js/widget.js"></script>
<script>
  const widget = new AddressVerificationWidget({
    containerId: 'address-widget',
    defaultCountry: 'NG',
    onVerificationComplete: (result) => {
      console.log('Verification Result:', result);
    },
    onStateChange: (state) => {
      console.log('Widget State Changed:', state.currentState);
    }
  });
</script>
```

---

## Component API Reference

### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `containerId` | `string \| HTMLElement` | *(required)* | ID string or DOM element where the widget will mount |
| `defaultCountry` | `string` | `'NG'` | Default country selection |
| `onVerificationComplete` | `Function` | `null` | Callback executed when verification finishes |
| `onStateChange` | `Function` | `null` | Callback executed on any state transition |
| `autoFocus` | `boolean` | `true` | Auto-focuses the street input on mount |

### Core Instance Methods

| Method | Description |
| :--- | :--- |
| `getState()` | Returns current snapshot: `{ currentState, formData, verificationResult }` |
| `setPreset(data)` | Pre-fills form fields with an address object |
| `reset()` | Resets widget to initiation state and clears inputs |
| `transitionToState(state)` | Changes widget state programmatically (`'initiation'`, `'loading'`, `'result'`) |
| `destroy()` | Clears timers and unmounts DOM elements |

---

## Packaging as a Drop-In JavaScript Library

### Option 1: Direct CDN Integration

Host minified `widget.js`, `widget.css`, and `base.css` on a CDN (or load via jsDelivr from GitHub):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Sharon-DA/Address-Verification-Widget-Demo@main/css/base.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Sharon-DA/Address-Verification-Widget-Demo@main/css/widget.css">
<script src="https://cdn.jsdelivr.net/gh/Sharon-DA/Address-Verification-Widget-Demo@main/js/widget.js"></script>

<div id="address-widget"></div>
<script>
  const widget = new AddressVerificationWidget({ containerId: 'address-widget' });
</script>
```

### Option 2: NPM Package Module

To publish as a package, include a `package.json` manifest:

```json
{
  "name": "@sharon-da/address-verification-widget",
  "version": "1.0.0",
  "main": "js/widget.js",
  "types": "js/widget.d.ts",
  "style": "css/widget.css",
  "files": ["js/", "css/"]
}
```

Installation and import usage in bundled apps (Vite, Webpack, etc.):

```bash
npm install @sharon-da/address-verification-widget
```

```javascript
import AddressVerificationWidget from '@sharon-da/address-verification-widget';
import '@sharon-da/address-verification-widget/css/base.css';
import '@sharon-da/address-verification-widget/css/widget.css';

const widget = new AddressVerificationWidget({
  containerId: 'address-widget'
});
```

---

## License

MIT License &copy; 2026 Sharon A