/**
 * AddressVerificationWidget
 * Standalone, zero-dependency Vanilla JavaScript address verification component.
 * Supports Nigeria (NIPOST), US (USPS), UK, and International address formats.
 */

class AddressVerificationWidget {
  /**
   * @param {Object} options
   * @param {string|HTMLElement} options.containerId  Target DOM element ID or reference
   * @param {Function} [options.onVerificationComplete]  Callback on verification complete
   * @param {Function} [options.onStateChange]  Callback on widget state change
   * @param {boolean} [options.autoFocus=true]  Auto-focus street input on mount
   * @param {string} [options.defaultCountry='NG']  Default country code
   */
  constructor(options = {}) {
    if (!options.containerId) {
      throw new Error('AddressVerificationWidget: "containerId" is required.');
    }

    this.container = typeof options.containerId === 'string'
      ? document.getElementById(options.containerId)
      : options.containerId;

    if (!this.container) {
      throw new Error(`AddressVerificationWidget: Element "${options.containerId}" not found.`);
    }

    this.onVerificationComplete = typeof options.onVerificationComplete === 'function'
      ? options.onVerificationComplete : null;
    this.onStateChange = typeof options.onStateChange === 'function'
      ? options.onStateChange : null;

    this.autoFocus = options.autoFocus !== false;
    this.defaultCountry = options.defaultCountry || 'NG';

    // Widget state
    this.currentState = 'initiation'; // 'initiation' | 'loading' | 'result'
    this.formData = { street: '', unit: '', city: '', state: '', zipcode: '', country: this.defaultCountry };
    this.validationErrors = {};
    this.verificationResult = null;
    this.activePreset = 'lagos'; // Default active preset chip

    // Loading step sequence
    this.loadingSteps = [
      { id: 'format',   label: 'Street address format',   detail: 'Standardizing to postal conventions...' },
      { id: 'lookup',   label: 'City and state lookup',   detail: 'Querying location master files...' },
      { id: 'postal',   label: 'Postal code registry',    detail: 'Validating delivery point...' }
    ];
    this.activeStepIndex = 0;
    this.stepTimer = null;

    // Presets database
    this.presets = {
      lagos:    { street: '15 Commercial Avenue', unit: 'Suite 3B', city: 'Yaba', state: 'Lagos', zipcode: '100001', country: 'NG' },
      abuja:    { street: '42 Ahmadu Bello Way', unit: 'Floor 4', city: 'Central Business District', state: 'Abuja', zipcode: '900001', country: 'NG' },
      newyork:  { street: '350 Fifth Avenue', unit: 'Floor 102', city: 'New York', state: 'New York', zipcode: '10118', country: 'US' },
      london:   { street: '10 Downing Street', unit: '', city: 'London', state: 'England', zipcode: 'SW1A 2AA', country: 'UK' },
      random:   { street: '742 Evergreen Terrace', unit: 'Apt 1B', city: 'Springfield', state: 'Oregon', zipcode: '97477', country: 'US' }
    };

    // Simulated postal database
    this.mockDatabase = [
      {
        street: '15 Commercial Avenue', unit: 'Suite 3B', city: 'Yaba', state: 'Lagos',
        zipcode: '100001', country: 'NG', verified: true, confidenceScore: 98,
        dpvConfirmation: 'Valid NIPOST Delivery Point', dpvFootnotes: 'NIPOST Verified Sector Match',
        carrierRoute: 'LGS-YAB-01',
        standardized: { street: '15 COMMERCIAL AVE STE 3B', city: 'YABA, LAGOS', state: 'LAGOS STATE', zipcode: '100001', country: 'NIGERIA' }
      },
      {
        street: '42 Ahmadu Bello Way', unit: 'Floor 4', city: 'Central Business District', state: 'Abuja',
        zipcode: '900001', country: 'NG', verified: true, confidenceScore: 96,
        dpvConfirmation: 'Valid FCT Delivery Point', dpvFootnotes: 'FCT Master Registry Match',
        carrierRoute: 'ABJ-CBD-04',
        standardized: { street: '42 AHMADU BELLO WAY FL 4', city: 'ABUJA', state: 'FEDERAL CAPITAL TERRITORY', zipcode: '900001', country: 'NIGERIA' }
      },
      {
        street: '350 Fifth Avenue', unit: 'Floor 102', city: 'New York', state: 'New York',
        zipcode: '10118', country: 'US', verified: true, confidenceScore: 97,
        dpvConfirmation: 'Valid USPS Delivery Point', dpvFootnotes: 'USPS CASS ZIP+4 Match',
        carrierRoute: 'R015',
        standardized: { street: '350 FIFTH AVE FL 102', city: 'NEW YORK', state: 'NY', zipcode: '10118-0110', country: 'UNITED STATES' }
      },
      {
        street: '10 Downing Street', unit: '', city: 'London', state: 'England',
        zipcode: 'SW1A 2AA', country: 'UK', verified: true, confidenceScore: 99,
        dpvConfirmation: 'Valid Royal Mail Delivery Point', dpvFootnotes: 'Royal Mail PAF Match',
        carrierRoute: 'SW1A',
        standardized: { street: '10 DOWNING ST', city: 'LONDON', state: 'ENGLAND', zipcode: 'SW1A 2AA', country: 'UNITED KINGDOM' }
      }
    ];

    this.init();
  }

  init() {
    this.container.classList.add('avw-root');
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const card = document.createElement('div');
    card.className = `avw-card avw-state-${this.currentState}`;
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Address Verification Widget');

    // ARIA live region
    const live = document.createElement('div');
    live.className = 'avw-sr-only';
    live.setAttribute('aria-live', 'polite');
    live.textContent = `Widget state: ${this.currentState}`;
    card.appendChild(live);

    card.appendChild(this._renderStepper());

    const innerCard = document.createElement('div');
    innerCard.className = 'avw-inner-card';

    innerCard.appendChild(this._renderHeader());

    const content = document.createElement('div');
    content.className = 'avw-content avw-content-enter';

    switch (this.currentState) {
      case 'initiation': content.appendChild(this._renderInitiation()); break;
      case 'loading':    content.appendChild(this._renderLoading());    break;
      case 'result':     content.appendChild(this._renderResult());     break;
    }

    innerCard.appendChild(content);
    card.appendChild(innerCard);
    this.container.appendChild(card);

    // Trigger fade-in animation
    requestAnimationFrame(() => content.classList.add('avw-content-visible'));

    if (this.currentState === 'initiation' && this.autoFocus) {
      setTimeout(() => {
        const el = this.container.querySelector('#avw-street');
        if (el) el.focus();
      }, 50);
    }
  }

  // ─────────────────────────────────────────────
  //  Top Stepper Progress Bar (Step 1, 2, 3)
  // ─────────────────────────────────────────────
  _renderStepper() {
    const steps  = [
      { num: 1, label: 'Enter Address' },
      { num: 2, label: 'Verifying' },
      { num: 3, label: 'Complete' }
    ];
    const active = this.currentState === 'initiation' ? 0 : this.currentState === 'loading' ? 1 : 2;

    const el = document.createElement('div');
    el.className = 'avw-stepper-wrap';

    el.innerHTML = `
      <div class="avw-stepper">
        ${steps.map((step, i) => {
          const done    = i < active;
          const current = i === active;
          const cls     = done ? 'avw-step avw-step-done' : current ? 'avw-step avw-step-active' : 'avw-step';

          const circleContent = done
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
            : `<span>${step.num}</span>`;

          const connector = i < steps.length - 1
            ? `<div class="avw-connector ${done ? 'avw-connector-done' : current ? 'avw-connector-half' : ''}"></div>`
            : '';

          return `
            <div class="${cls}">
              <div class="avw-step-circle">${circleContent}</div>
              <span class="avw-step-label">${step.label}</span>
            </div>
            ${connector}
          `;
        }).join('')}
      </div>
    `;

    return el;
  }

  // ─────────────────────────────────────────────
  //  Inner Card Header (Title + Secure & Private Badge)
  // ─────────────────────────────────────────────
  _renderHeader() {
    const el = document.createElement('div');
    el.className = 'avw-card-header';
    el.innerHTML = `
      <div class="avw-header-left">
        <div class="avw-header-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div>
          <h3 class="avw-card-title">Address Verification</h3>
          <p class="avw-card-subtitle">Enter an address to check deliverability and accuracy.</p>
        </div>
      </div>
      <div class="avw-secure-badge">
        <div class="avw-secure-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <div class="avw-secure-text">
          <span class="avw-secure-title">Secure & Private</span>
          <span class="avw-secure-sub">Your data is safe</span>
        </div>
      </div>
    `;
    return el;
  }

  // ─────────────────────────────────────────────
  //  State 1: Initiation Form
  // ─────────────────────────────────────────────
  _renderInitiation() {
    const fragment = document.createDocumentFragment();

    const containerDiv = document.createElement('div');
    containerDiv.className = 'avw-form-wrapper';

    containerDiv.innerHTML = `
      <!-- Quick Examples Section -->
      <div class="avw-chips-section">
        <span class="avw-chips-label">QUICK EXAMPLES</span>
        <div class="avw-chips">
          <button type="button" class="avw-chip ${this.activePreset === 'lagos' ? 'avw-chip-active' : ''}" data-preset="lagos">Lagos, Nigeria</button>
          <button type="button" class="avw-chip ${this.activePreset === 'abuja' ? 'avw-chip-active' : ''}" data-preset="abuja">Abuja, Nigeria</button>
          <button type="button" class="avw-chip ${this.activePreset === 'newyork' ? 'avw-chip-active' : ''}" data-preset="newyork">New York, USA</button>
          <button type="button" class="avw-chip ${this.activePreset === 'london' ? 'avw-chip-active' : ''}" data-preset="london">London, UK</button>
          <button type="button" class="avw-chip ${this.activePreset === 'random' ? 'avw-chip-active' : ''}" data-preset="random">Random Address</button>
        </div>
      </div>

      <!-- Main Form Grid -->
      <form class="avw-form" novalidate="true">
        <!-- Row 1: Country + Street Address -->
        <div class="avw-grid-2">
          <div class="avw-field-group">
            <label for="avw-country" class="avw-label">Country <span class="avw-req">*</span></label>
            <div class="avw-input-wrap">
              <span class="avw-flag-icon">${this.formData.country === 'NG' ? '🇳🇬' : this.formData.country === 'US' ? '🇺🇸' : this.formData.country === 'UK' ? '🇬🇧' : '🌐'}</span>
              <select id="avw-country" name="country" class="avw-input avw-select avw-has-flag">
                <option value="NG" ${this.formData.country === 'NG' ? 'selected' : ''}>Nigeria (NG)</option>
                <option value="US" ${this.formData.country === 'US' ? 'selected' : ''}>United States (US)</option>
                <option value="UK" ${this.formData.country === 'UK' ? 'selected' : ''}>United Kingdom (UK)</option>
                <option value="CA" ${this.formData.country === 'CA' ? 'selected' : ''}>Canada (CA)</option>
                <option value="DE" ${this.formData.country === 'DE' ? 'selected' : ''}>Germany (DE)</option>
              </select>
            </div>
          </div>

          <div class="avw-field-group">
            <label for="avw-street" class="avw-label">Street Address <span class="avw-req">*</span></label>
            <div class="avw-input-wrap">
              <svg class="avw-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
              </svg>
              <input type="text" id="avw-street" name="street"
                class="avw-input avw-has-icon ${this.validationErrors.street ? 'avw-input-err' : ''}"
                placeholder="e.g. 15 Commercial Avenue"
                value="${this.escapeHtml(this.formData.street)}"
                autocomplete="address-line1"
                ${this.validationErrors.street ? 'aria-invalid="true"' : ''} />
            </div>
            ${this.validationErrors.street ? `<p class="avw-err-msg">${this.validationErrors.street}</p>` : ''}
          </div>
        </div>

        <!-- Row 2: Apt/Suite + City/Town -->
        <div class="avw-grid-2">
          <div class="avw-field-group">
            <label for="avw-unit" class="avw-label">Apt, Suite, Estate, Floor <span class="avw-opt">(Optional)</span></label>
            <div class="avw-input-wrap">
              <svg class="avw-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <input type="text" id="avw-unit" name="unit"
                class="avw-input avw-has-icon"
                placeholder="e.g. Suite 3B, Sabo"
                value="${this.escapeHtml(this.formData.unit)}"
                autocomplete="address-line2" />
            </div>
          </div>

          <div class="avw-field-group">
            <label for="avw-city" class="avw-label">City / Town <span class="avw-req">*</span></label>
            <div class="avw-input-wrap">
              <svg class="avw-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
              <input type="text" id="avw-city" name="city"
                class="avw-input avw-has-icon ${this.validationErrors.city ? 'avw-input-err' : ''}"
                placeholder="e.g. Yaba or Ikeja"
                value="${this.escapeHtml(this.formData.city)}"
                autocomplete="address-level2"
                ${this.validationErrors.city ? 'aria-invalid="true"' : ''} />
            </div>
            ${this.validationErrors.city ? `<p class="avw-err-msg">${this.validationErrors.city}</p>` : ''}
          </div>
        </div>

        <!-- Row 3: State/Region + Postal Code -->
        <div class="avw-grid-2">
          <div class="avw-field-group">
            <label for="avw-state" class="avw-label">State / Region <span class="avw-req">*</span></label>
            <div class="avw-input-wrap">
              <svg class="avw-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                <line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line>
              </svg>
              <input type="text" id="avw-state" name="state"
                class="avw-input avw-has-icon ${this.validationErrors.state ? 'avw-input-err' : ''}"
                placeholder="e.g. Lagos, Rivers, FCT"
                value="${this.escapeHtml(this.formData.state)}"
                autocomplete="address-level1"
                ${this.validationErrors.state ? 'aria-invalid="true"' : ''} />
            </div>
            ${this.validationErrors.state ? `<p class="avw-err-msg">${this.validationErrors.state}</p>` : ''}
          </div>

          <div class="avw-field-group">
            <label for="avw-zipcode" class="avw-label">Postal Code <span class="avw-req">*</span></label>
            <div class="avw-input-wrap">
              <svg class="avw-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input type="text" id="avw-zipcode" name="zipcode"
                class="avw-input avw-has-icon ${this.validationErrors.zipcode ? 'avw-input-err' : ''}"
                placeholder="e.g. 900211" maxlength="10"
                value="${this.escapeHtml(this.formData.zipcode)}"
                autocomplete="postal-code"
                ${this.validationErrors.zipcode ? 'aria-invalid="true"' : ''} />
            </div>
            ${this.validationErrors.zipcode ? `<p class="avw-err-msg">${this.validationErrors.zipcode}</p>` : ''}
          </div>
        </div>

        <!-- Verify Address Button -->
        <button type="submit" class="avw-btn avw-btn-royal">
          <span>Verify Address</span>
          <svg class="avw-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <!-- Simulation Note Footer -->
        <div class="avw-footer-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Simulation only. Not connected to real postal services.</span>
        </div>
      </form>
    `;

    fragment.appendChild(containerDiv);

    // Bind event listeners
    setTimeout(() => {
      // Inputs event listener
      const allInputs = this.container.querySelectorAll('.avw-input');
      allInputs.forEach(el => {
        const evt = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(evt, (e) => {
          this.formData[e.target.name] = e.target.value;
          if (e.target.name === 'country') {
            const flagSpan = this.container.querySelector('.avw-flag-icon');
            if (flagSpan) {
              const flags = { NG: '🇳🇬', US: '🇺🇸', UK: '🇬🇧', CA: '🇨🇦', DE: '🇩🇪' };
              flagSpan.textContent = flags[e.target.value] || '🌐';
            }
          }
          if (this.onStateChange) this.onStateChange(this.getState());

          if (e.target.tagName !== 'SELECT' && this.validationErrors[e.target.name]) {
            delete this.validationErrors[e.target.name];
            e.target.classList.remove('avw-input-err');
            e.target.removeAttribute('aria-invalid');
            const errEl = e.target.closest('.avw-field-group').querySelector('.avw-err-msg');
            if (errEl) errEl.remove();
          }
        });
      });

      // Preset Chips listener
      this.container.querySelectorAll('.avw-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const key = e.target.getAttribute('data-preset');
          if (this.presets[key]) {
            this.activePreset = key;
            this.setPreset(this.presets[key]);
          }
        });
      });

      // Form submit listener
      const formEl = this.container.querySelector('.avw-form');
      if (formEl) formEl.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }, 0);

    return fragment;
  }

  // ─────────────────────────────────────────────
  //  State 2: Loading / Verification in Progress
  // ─────────────────────────────────────────────
  _renderLoading() {
    const el = document.createElement('div');
    el.className = 'avw-loading';

    const checklistHtml = this.loadingSteps.map((step, i) => {
      if (i < this.activeStepIndex) {
        return `
          <div class="avw-check avw-check-done">
            <div class="avw-check-icon avw-icon-done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="avw-check-label">${step.label}</span>
          </div>`;
      } else if (i === this.activeStepIndex) {
        return `
          <div class="avw-check avw-check-active">
            <div class="avw-check-icon avw-icon-active"><div class="avw-mini-spin"></div></div>
            <div>
              <span class="avw-check-label">${step.label}</span>
              <span class="avw-check-detail">${step.detail}</span>
            </div>
          </div>`;
      } else {
        return `
          <div class="avw-check avw-check-pending">
            <div class="avw-check-icon avw-icon-pending"><div class="avw-dot"></div></div>
            <span class="avw-check-label">${step.label}</span>
          </div>`;
      }
    }).join('');

    const pct = Math.round(((this.activeStepIndex + 0.5) / this.loadingSteps.length) * 100);
    const preview = `${this.formData.street}${this.formData.unit ? ', ' + this.formData.unit : ''}, ${this.formData.city}, ${this.formData.state} ${this.formData.zipcode}`.toUpperCase();

    el.innerHTML = `
      <div class="avw-spinner-wrap">
        <div class="avw-ring"></div>
        <div class="avw-ring-inner"></div>
      </div>
      <h4 class="avw-loading-title">
        Checking<span class="avw-dots"><span>.</span><span>.</span><span>.</span></span>
      </h4>
      <p class="avw-loading-sub">Cross-referencing location master files</p>
      <div class="avw-progress-track">
        <div class="avw-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="avw-checklist">${checklistHtml}</div>
      <div class="avw-preview-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${this.escapeHtml(preview.length > 60 ? preview.slice(0, 60) + '…' : preview)}</span>
      </div>
    `;

    return el;
  }

  // ─────────────────────────────────────────────
  //  State 3: Result (Verified or Failed)
  // ─────────────────────────────────────────────
  _renderResult() {
    const fragment = document.createDocumentFragment();
    const result     = this.verificationResult;
    const isVerified = result && result.verified;

    const wrapper = document.createElement('div');
    wrapper.className = 'avw-result';

    if (isVerified) {
      const addr = result.standardized;
      wrapper.innerHTML = `
        <div class="avw-result-icon avw-icon-success">
          <div class="avw-icon-pulse"></div>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="avw-result-title">Address Verified</h3>

        <div class="avw-confidence">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Delivery Confidence</span>
          <strong>${result.confidenceScore}%</strong>
        </div>

        <div class="avw-address-card">
          <div class="avw-address-card-top">
            <span>STANDARDIZED ADDRESS</span>
            <div class="avw-verified-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Verified
            </div>
          </div>
          <div class="avw-address-body">
            <div class="avw-addr-main">${this.escapeHtml(addr.street)}</div>
            <div>${this.escapeHtml(addr.city)}</div>
            <div>${this.escapeHtml(addr.state)}</div>
            <div>${this.escapeHtml(addr.zipcode)}</div>
            <div class="avw-addr-country">${this.escapeHtml(addr.country)}</div>
          </div>
          <div class="avw-address-card-foot">
            <span>${this.escapeHtml(result.dpvConfirmation)}</span>
            <span class="avw-sep">·</span>
            <span>Route: ${this.escapeHtml(result.carrierRoute)}</span>
          </div>
        </div>

        <div class="avw-result-actions">
          <button type="button" class="avw-btn avw-btn-royal" id="avw-use-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span id="avw-use-txt">Use This Address</span>
          </button>
          <button type="button" class="avw-btn avw-btn-ghost" id="avw-reset-btn">Verify Another</button>
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="avw-result-icon avw-icon-warn">
          <div class="avw-icon-pulse"></div>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>

        <h3 class="avw-result-title">Could Not Be Verified</h3>
        <p class="avw-result-sub">We could not match this address against postal records.</p>

        <div class="avw-issues">
          <div class="avw-issues-title">Possible Issues</div>
          <ul class="avw-issues-list">
            <li>Invalid postcode for the specified state or region</li>
            <li>Street name or house number not found in postal registry</li>
            <li>Missing or incorrect building number</li>
          </ul>
          <div class="avw-submitted">
            <div class="avw-submitted-label">SUBMITTED ADDRESS</div>
            <div>${this.escapeHtml(this.formData.street)}${this.formData.unit ? `, ${this.escapeHtml(this.formData.unit)}` : ''}</div>
            <div>${this.escapeHtml(this.formData.city)}, ${this.escapeHtml(this.formData.state)} ${this.escapeHtml(this.formData.zipcode)}, ${this.escapeHtml(this.formData.country)}</div>
          </div>
        </div>

        <div class="avw-result-actions">
          <button type="button" class="avw-btn avw-btn-royal" id="avw-edit-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Address
          </button>
          <button type="button" class="avw-btn avw-btn-ghost" id="avw-reset-btn">Verify Another</button>
        </div>
      `;
    }

    fragment.appendChild(wrapper);

    setTimeout(() => {
      const r  = this.container.querySelector('#avw-reset-btn');
      const e  = this.container.querySelector('#avw-edit-btn');
      const u  = this.container.querySelector('#avw-use-btn');
      if (r) r.addEventListener('click', () => this.reset());
      if (e) e.addEventListener('click', () => this.transitionToState('initiation'));
      if (u) {
        u.addEventListener('click', () => {
          if (!result?.standardized) return;
          const a = result.standardized;
          navigator.clipboard.writeText(`${a.street}, ${a.city}, ${a.state} ${a.zipcode}, ${a.country}`)
            .then(() => {
              const t = this.container.querySelector('#avw-use-txt');
              if (t) { t.textContent = 'Copied!'; setTimeout(() => { t.textContent = 'Use This Address'; }, 2000); }
            });
        });
      }
    }, 0);

    return fragment;
  }

  // ─────────────────────────────────────────────
  //  Core Logic & Helpers
  // ─────────────────────────────────────────────
  setPreset(data) {
    this.formData = { ...data };
    this.validationErrors = {};
    this.render();
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  validateFormData() {
    this.validationErrors = {};
    const s = (this.formData.street  || '').trim();
    const c = (this.formData.city    || '').trim();
    const t = (this.formData.state   || '').trim();
    const z = (this.formData.zipcode || '').trim();

    if (!s || s.length < 3)    this.validationErrors.street  = 'Enter a valid street address.';
    if (!c)                    this.validationErrors.city    = 'City / Town is required.';
    if (!t)                    this.validationErrors.state   = 'State / Region is required.';
    if (!z)                    this.validationErrors.zipcode = 'Postal code is required.';
    else if (z.length < 4 || z.length > 10) this.validationErrors.zipcode = 'Enter a valid postal code.';

    return Object.keys(this.validationErrors).length === 0;
  }

  handleFormSubmit(e) {
    if (e) e.preventDefault();
    if (!this.validateFormData()) { this.render(); return; }
    this.transitionToState('loading');
    this.performVerification();
  }

  performVerification() {
    this.activeStepIndex = 0;
    this.render();
    if (this.stepTimer) clearInterval(this.stepTimer);

    this.stepTimer = setInterval(() => {
      this.activeStepIndex++;
      if (this.activeStepIndex < this.loadingSteps.length) {
        this.render();
      } else {
        clearInterval(this.stepTimer);
        this.stepTimer = null;
        setTimeout(() => {
          this.verificationResult = this.computeVerificationResult();
          this.transitionToState('result');
          if (this.onVerificationComplete) this.onVerificationComplete(this.verificationResult);
        }, 400);
      }
    }, 700);
  }

  computeVerificationResult() {
    const street  = (this.formData.street  || '').toLowerCase().trim();
    const zip     = (this.formData.zipcode || '').trim();
    const state   = (this.formData.state   || '').trim();
    const country = (this.formData.country || 'NG').toUpperCase();

    // Explicit unverified triggers
    if (street.includes('nonexistent') || zip === '00000' || zip === '000000' || state.toLowerCase().includes('invalid')) {
      return { verified: false, confidenceScore: 0, message: 'Address not found in regional postal master files.', timestamp: new Date().toISOString() };
    }

    // Match mock database
    const match = this.mockDatabase.find(item => {
      const words       = item.street.toLowerCase().split(' ');
      const streetMatch = words.some(w => w.length > 3 && street.includes(w));
      return item.zipcode === zip && streetMatch;
    });

    if (match) return { ...match, timestamp: new Date().toISOString() };

    // Generic standardized result
    const countryNames = { NG: 'NIGERIA', US: 'UNITED STATES', UK: 'UNITED KINGDOM', CA: 'CANADA', DE: 'GERMANY' };
    const countryName  = countryNames[country] || country;
    const stdStreet    = this._standardiseStreet(this.formData.street, this.formData.unit);

    return {
      verified: true, confidenceScore: 93,
      dpvConfirmation: `Valid ${countryName} Delivery Point`,
      carrierRoute: country === 'NG' ? `NG-${state.slice(0, 3).toUpperCase()}-01` : 'INT-001',
      standardized: {
        street: stdStreet,
        city:   (this.formData.city || '').trim().toUpperCase(),
        state:  state.toUpperCase(),
        zipcode: zip.toUpperCase(),
        country: countryName
      },
      timestamp: new Date().toISOString()
    };
  }

  _standardiseStreet(street, unit) {
    const abbr = {
      STREET: 'ST', AVENUE: 'AVE', ROAD: 'RD', BOULEVARD: 'BLVD',
      DRIVE: 'DR', LANE: 'LN', COURT: 'CT', HIGHWAY: 'HWY',
      PARKWAY: 'PKWY', CIRCLE: 'CIR', CLOSE: 'CL', CRESCENT: 'CRES',
      FLOOR: 'FL', SUITE: 'STE', APARTMENT: 'APT'
    };
    let s = (street || '').trim().toUpperCase();
    let u = (unit   || '').trim().toUpperCase();
    for (const [k, v] of Object.entries(abbr)) {
      s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
      u = u.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
    }
    return u ? `${s} ${u}` : s;
  }

  transitionToState(newState) {
    this.currentState = newState;
    this.render();
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  reset() {
    if (this.stepTimer) { clearInterval(this.stepTimer); this.stepTimer = null; }
    this.formData           = { street: '', unit: '', city: '', state: '', zipcode: '', country: this.defaultCountry };
    this.validationErrors   = {};
    this.verificationResult = null;
    this.activePreset       = 'lagos';
    this.transitionToState('initiation');
  }

  getState() {
    return {
      currentState:       this.currentState,
      formData:           { ...this.formData },
      verificationResult: this.verificationResult ? { ...this.verificationResult } : null,
      timestamp:          new Date().toISOString()
    };
  }

  destroy() {
    if (this.stepTimer) clearInterval(this.stepTimer);
    if (this.container) {
      this.container.innerHTML = '';
      this.container.classList.remove('avw-root');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddressVerificationWidget;
} else if (typeof window !== 'undefined') {
  window.AddressVerificationWidget = AddressVerificationWidget;
}