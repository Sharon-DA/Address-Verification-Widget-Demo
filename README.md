# Address Verification Widget SDK

**Designed & Developed by Sharon A**

A standalone, zero-dependency Vanilla JavaScript address verification widget. Supports **Nigerian (NIPOST)**, **US (USPS)**, and **International** postal formats. Built as a fully encapsulated, embeddable component — no frameworks, no build step required.

---

## Live Demo

Open `index.html` directly in any browser. The demo page includes:

- The embedded widget (left column)
- A real-time **Widget State Inspector** with a live JSON view and event log (right column)
- Dark mode toggle

---

## File Structure

```
address-ver-widget/
├── index.html          — Standalone demo page with inspector sidebar
├── css/
│   └── widget.css      — Full design system: tokens, layout, animations, dark mode
├── js/
│   ├── widget.js       — Core AddressVerificationWidget class (Vanilla JS)
│   └── widget.d.ts     — TypeScript declarations for library consumers
└── README.md
```

---

## Widget States

The widget is a **3-state component** driven by an internal state machine:

### State 1 — Initiation (Address Form)

- Country selector (Nigeria, US, UK, Canada, Germany) with flag indicator
- Street Address, Apt/Suite, City/Town, State/Region, Postal Code fields
- SVG icon for each input field
- Real-time validation with inline error messages
- **Quick Example chips**: Lagos, Nigeria · Abuja, Nigeria · New York, USA · London, UK · Random Address
- Royal blue "Verify Address →" submit button
- All fields match Nigerian (NIPOST) 6-digit postal codes and free-text state names

### State 2 — Loading (Verification in Progress)

- Dual-ring animated spinner
- Animated step checklist:
  1. Street address format — *Standardizing to postal conventions*
  2. City and state lookup — *Querying location master files*
  3. Postal code registry — *Validating delivery point*
- Animated progress bar
- Address preview pill showing input being verified

### State 3 — Result

**Verified:**
- Animated success icon with pulse ring
- Delivery Confidence score badge (e.g. 96%)
- Standardized postal address card (street, city, state, postcode, country)
- "Verified" green badge + carrier route reference
- "Use This Address" button — copies to clipboard
- "Verify Another" reset button

**Unverified:**
- Animated warning icon with pulse ring
- "Could Not Be Verified" heading
- Possible Issues list (invalid postcode, unknown street, missing building number)
- Submitted address shown for review
- "Edit Address" and "Verify Another" buttons

---

## Verification Logic

The widget simulates a postal verification pipeline against a built-in mock database:

- **Exact match**: Matches on postal code + street keyword → returns pre-defined standardized address with high confidence (96–99%)
- **Generic match**: Any valid input that doesn't match the mock DB → returns a standardized version with 93% confidence
- **Unverified**: Triggered by known invalid patterns (`nonexistent`, postal code `000000`, state containing `invalid`)

**Street standardization** converts long-form suffixes to postal abbreviations:
`STREET → ST`, `AVENUE → AVE`, `BOULEVARD → BLVD`, `FLOOR → FL`, `SUITE → STE`, etc.

---

## Embedding the Widget

### Basic Integration

```html
<link rel="stylesheet" href="css/widget.css">
<div id="address-widget"></div>
<script src="js/widget.js"></script>
<script>
  const widget = new AddressVerificationWidget({
    containerId: 'address-widget',
    defaultCountry: 'NG',
    onVerificationComplete: (result) => {
      if (result.verified) {
        console.log('Address:', result.standardized);
        console.log('Confidence:', result.confidenceScore + '%');
      } else {
        console.log('Failed:', result.message);
      }
    },
    onStateChange: (state) => {
      console.log('State changed to:', state.currentState);
    }
  });
</script>
```

---

## Constructor Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `containerId` | `string \| HTMLElement` | **required** | ID string or element reference where the widget mounts |
| `defaultCountry` | `string` | `'NG'` | ISO 2-letter default country code |
| `onVerificationComplete` | `function` | `null` | Called when verification finishes — receives `VerificationResult` |
| `onStateChange` | `function` | `null` | Called on every state transition — receives `WidgetStateSnapshot` |
| `autoFocus` | `boolean` | `true` | Auto-focuses the street field on load |

---

## Instance Methods

| Method | Returns | Description |
| :--- | :--- | :--- |
| `getState()` | `WidgetStateSnapshot` | Current state, form data, and verification result |
| `setPreset(data)` | `void` | Pre-fills form fields with an address object |
| `reset()` | `void` | Clears form and returns to initiation state |
| `transitionToState(state)` | `void` | Programmatically switch to `'initiation'`, `'loading'`, or `'result'` |
| `destroy()` | `void` | Unmounts widget, clears timers, removes DOM |

---

## State Machine

```
┌─────────────────────┐
│   Initiation State  │  ← User fills in address fields
│   (Address Form)    │
└──────────┬──────────┘
           │  Submit (validates first)
           ▼
┌─────────────────────┐
│    Loading State    │  ← Step-by-step animated verification
│  (3-step pipeline)  │
└──────────┬──────────┘
           │  Complete (~2s)
           ▼
┌─────────────────────┐
│    Result State     │  ← Verified or Unverified result card
│ (Verified/Unverified│
└──────────┬──────────┘
           │  "Verify Another" or "Edit Address"
           └──────────────────────────────────► Back to Initiation
```

---

## Packaging as a Drop-In Library

To package and distribute this SDK for external web applications or package registries:

### Option 1 — CDN Script Tag

Minify `widget.js` and `widget.css` with any bundler (Esbuild, Rollup, Vite) and serve via CDN:

```html
<link rel="stylesheet" href="https://cdn.example.com/address-widget.min.css">
<script src="https://cdn.example.com/address-widget.min.js"></script>
```

The widget registers itself on `window.AddressVerificationWidget` automatically.

### Option 2 — NPM Package

Add a `package.json` and publish to the NPM registry:

```json
{
  "name": "address-verification-widget",
  "version": "1.0.0",
  "main": "js/widget.js",
  "types": "js/widget.d.ts",
  "style": "css/widget.css",
  "files": ["js/", "css/"]
}
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

### TypeScript Support

Full type declarations are included in `js/widget.d.ts`:

```typescript
import { AddressVerificationWidget, VerificationResult } from 'address-verification-widget';

const widget = new AddressVerificationWidget({
  containerId: 'address-widget',
  onVerificationComplete: (result: VerificationResult) => {
    console.log(result.verified, result.confidenceScore);
  }
});
```

---

## Preset Address Data

The widget ships with four built-in test addresses:

| Chip | Address | Postcode | Result |
| :--- | :--- | :--- | :--- |
| Lagos, Nigeria | 15 Commercial Avenue, Suite 3B, Yaba | 100001 | ✅ Verified — 98% |
| Abuja, Nigeria | 42 Ahmadu Bello Way, Floor 4, CBD | 900001 | ✅ Verified — 96% |
| New York, USA | 350 Fifth Avenue, Floor 102 | 10118 | ✅ Verified — 97% |
| London, UK | 10 Downing Street, Westminster | SW1A 2AA | ✅ Verified — 99% |
| Random Address | 742 Evergreen Terrace, Springfield, Oregon | 97477 | ✅ Verified — 93% |

Enter any address not in the above list with a valid postal code to get a generic 93% confidence match. Enter an address with postal code `000000` or containing "nonexistent" for an unverified result.

---

## Browser Support

Chrome, Firefox, Safari, Edge — all modern evergreen browsers. No polyfills required.

**Accessibility:** ARIA live regions, `aria-invalid`, keyboard focus rings (`:focus-visible`), screen-reader labels.

---

## License

MIT — Sharon A, 2026