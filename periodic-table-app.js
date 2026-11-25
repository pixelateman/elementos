(() => {
  'use strict';

  // =========================================================================
  // 1. CHEMICAL ELEMENT VISUALISATION (Modelo atómico SVG animado)
  // =========================================================================
  class ChemicalElementVisualisation extends HTMLElement {
    static get observedAttributes() {
      return ['symbol'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    get symbol() {
      return (this.getAttribute('symbol') || 'h').toLowerCase();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'symbol' && oldValue !== newValue && this.isConnected) {
        this._render();
      }
    }

    connectedCallback() {
      this._render();
    }

    _render() {
      const elements = window.CHEMICAL_ELEMENTS || {};
      const element = elements[this.symbol];
      const displaySymbol = element ? element.symbol : this.symbol.toUpperCase();
      const groupColor = element ? `var(--${element.group}-primary-color, #888)` : '#888';

      const shells = Array.isArray(element?.['electron-configuration'])
        ? element['electron-configuration'].map(
            (shell) => (shell.s || 0) + (shell.p || 0) + (shell.d || 0) + (shell.f || 0)
          )
        : [];

      const cx = 100;
      const cy = 100;
      const minRadius = 26;
      const maxRadius = 90;
      const step = shells.length > 1 ? (maxRadius - minRadius) / (shells.length - 1) : 0;

      let svgShells = '';

      shells.forEach((electronCount, index) => {
        if (electronCount <= 0) return;
        const r = shells.length === 1 ? 55 : minRadius + index * step;

        svgShells += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--primary-color, #888)" stroke-width="1" opacity="0.45" />`;

        for (let i = 0; i < electronCount; i++) {
          const angle = (2 * Math.PI * i) / electronCount - Math.PI / 2;
          const ex = cx + r * Math.cos(angle);
          const ey = cy + r * Math.sin(angle);
          svgShells += `<circle cx="${ex.toFixed(2)}" cy="${ey.toFixed(2)}" r="3.2" fill="var(--secondary-color, #000)" />`;
        }
      });

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }

          svg {
            width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
            max-width: 180px;
            max-height: 180px;
          }

          .orbits {
            transform-origin: 100px 100px;
            animation: spin 25s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        </style>

        <svg viewBox="0 0 200 200">
          <g class="orbits">
            ${svgShells}
          </g>
          <circle cx="${cx}" cy="${cy}" r="16" fill="${groupColor}" />
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
                fill="#fff" font-family="sans-serif" font-size="13" font-weight="bold">
            ${displaySymbol}
          </text>
        </svg>
      `;
    }
  }

  customElements.define('chemical-element-visualisation', ChemicalElementVisualisation);

  // =========================================================================
  // 2. CHEMICAL ELEMENT (Casilla individual de la tabla)
  // =========================================================================
  class ChemicalElement extends HTMLElement {
    static get observedAttributes() {
      return ['symbol', 'selected-symbol'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    get symbol() {
      return (this.getAttribute('symbol') || '').toLowerCase();
    }

    get selectedSymbol() {
      return (this.getAttribute('selected-symbol') || '').toLowerCase();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.shadowRoot.innerHTML) {
        if (name === 'selected-symbol') {
          this._updateSelectedClass();
        } else if (name === 'symbol') {
          this._render();
        }
      }
    }

    connectedCallback() {
      this._render();
    }

    _render() {
      const chemicalElements = window.CHEMICAL_ELEMENTS || {};
      this.element = chemicalElements[this.symbol] || {
        symbol: this.symbol ? this.symbol.charAt(0).toUpperCase() + this.symbol.slice(1) : '',
        group: 'other-nonmetal'
      };

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 100%;
          }

          .element-card {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: clamp(15px, 2vw, 28px);
            width: 100%;
            height: 100%;
            font-family: sans-serif;
            color: white;
            text-align: center;
            cursor: pointer;
            border-radius: 2px;
            box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
                        0 1px 5px 0 rgba(0, 0, 0, 0.12),
                        0 3px 1px -2px rgba(0, 0, 0, 0.2);
            transition: box-shadow 0.2s ease, background-color 0.2s ease;
          }

          .element-symbol {
            flex: 0 0;
          }

          .element-card:hover {
            box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14),
                        0 1px 10px 0 rgba(0, 0, 0, 0.12),
                        0 2px 4px -1px rgba(0, 0, 0, 0.4);
          }

          .alkali-metal           { background-color: var(--alkali-metal-background-color); }
          .alkaline-earth-metal   { background-color: var(--alkaline-earth-metal-background-color); }
          .transition-metal       { background-color: var(--transition-metal-background-color); }
          .metalloid              { background-color: var(--metalloid-background-color); }
          .post-transition-metal  { background-color: var(--post-transition-metal-background-color); }
          .other-nonmetal         { background-color: var(--other-nonmetal-background-color); }
          .lanthanide             { background-color: var(--lanthanide-background-color); }
          .actinide               { background-color: var(--actinide-background-color); }
          .halogen                { background-color: var(--halogen-background-color); }
          .noble-gas              { background-color: var(--noble-gas-background-color); }

          .alkali-metal.selected          { background-color: var(--alkali-metal-primary-color); }
          .alkaline-earth-metal.selected  { background-color: var(--alkaline-earth-metal-primary-color); }
          .transition-metal.selected      { background-color: var(--transition-metal-primary-color); }
          .metalloid.selected             { background-color: var(--metalloid-primary-color); }
          .post-transition-metal.selected { background-color: var(--post-transition-metal-primary-color); }
          .other-nonmetal.selected        { background-color: var(--other-nonmetal-primary-color); }
          .lanthanide.selected            { background-color: var(--lanthanide-primary-color); }
          .actinide.selected              { background-color: var(--actinide-primary-color); }
          .halogen.selected               { background-color: var(--halogen-primary-color); }
          .noble-gas.selected             { background-color: var(--noble-gas-primary-color); }

          .selected,
          .selected:hover {
            box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
                        0 1px 18px 0 rgba(0, 0, 0, 0.12),
                        0 3px 5px -1px rgba(0, 0, 0, 0.4);
          }
        </style>

        <div id="paper-card" class="${this.element.group} element-card">
          <div class="element-symbol">${this.element.symbol}</div>
        </div>
      `;

      this.shadowRoot.querySelector('#paper-card').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('chemical-element-selected', {
          detail: { symbol: this.symbol },
          bubbles: true,
          composed: true
        }));
      });

      this._updateSelectedClass();
    }

    _updateSelectedClass() {
      const card = this.shadowRoot.querySelector('#paper-card');
      if (!card) return;

      if (this.selectedSymbol === this.symbol) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    }
  }

  customElements.define('chemical-element', ChemicalElement);

  // =========================================================================
  // 3. LANGUAGE SELECTION (Selector de idioma con banderas)
  // =========================================================================
  const FLAGS_BASE_PATH = './flags/';

  const LANGUAGE_SELECTION_LOCALES = {
    en: { language: 'Language' },
    de: { language: 'Sprache' },
    fr: { language: 'Langue' },
    'pt-br': { language: 'Idioma' },
    sp: { language: 'Idioma' },
    tk: { language: 'Dil' },
    hi: { language: 'भाषा' },
    ch: { language: '语言' },
    cz: { language: 'Český' },
    ru: { language: 'Язык' },
    pl: { language: 'Język' }
  };

  const AVAILABLE_LANGUAGES = ['sp', 'en', 'fr', 'de', 'pt-br', 'tk', 'hi', 'cz', 'ru', 'pl'];

  const ISO_TO_FLAG = {
    en: 'gb',
    de: 'de',
    fr: 'fr',
    sp: 'es',
    tk: 'tr',
    'pt-br': 'br',
    hi: 'in',
    cz: 'cz',
    ru: 'ru',
    pl: 'pl'
  };

  const ISO_TO_NAME = {
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    sp: 'Español',
    tk: 'Türk',
    'pt-br': 'Português',
    hi: 'हिन्दी',
    cz: 'čeština',
    ru: 'русский',
    pl: 'polski'
  };

  class LanguageSelection extends HTMLElement {
    static get observedAttributes() {
      return ['selected', 'language'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._selected = 'sp';
      this._isOpen = false;
    }

    get selected() {
      return this._selected;
    }

    set selected(value) {
      if (AVAILABLE_LANGUAGES.includes(value) && this._selected !== value) {
        this._selected = value;
        if (this.isConnected) this._render();
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'selected' && oldValue !== newValue && AVAILABLE_LANGUAGES.includes(newValue)) {
        this._selected = newValue;
        if (this.isConnected) this._render();
      } else if (name === 'language' && oldValue !== newValue && this.isConnected) {
        this._render();
      }
    }

    connectedCallback() {
      const initial = this.getAttribute('selected');
      if (initial && AVAILABLE_LANGUAGES.includes(initial)) {
        this._selected = initial;
      }
      this._render();
    }

    _getFlagPath(iso) {
      return `${FLAGS_BASE_PATH}${ISO_TO_FLAG[iso]}.svg`;
    }

    _getLabel() {
      const lang = this.getAttribute('language') || this._selected;
      return (LANGUAGE_SELECTION_LOCALES[lang] || LANGUAGE_SELECTION_LOCALES.sp).language;
    }

    _render() {
      const optionsHtml = AVAILABLE_LANGUAGES.map((iso) => `
        <div class="option ${iso === this._selected ? 'active' : ''}" data-iso="${iso}">
          <img src="${this._getFlagPath(iso)}" alt="${iso}" width="32" />
          <span>${ISO_TO_NAME[iso]}</span>
        </div>
      `).join('');

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            width: 100%;
            font-family: sans-serif;
            margin-bottom: 14px;
          }

          label {
            display: block;
            font-size: 0.85rem;
            color: var(--primary-color, #888);
            margin-bottom: 4px;
          }

          .trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: var(--background-color, #fff);
            color: var(--secondary-color, #000);
            cursor: pointer;
            user-select: none;
          }

          .trigger-content {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .dropdown {
            display: ${this._isOpen ? 'block' : 'none'};
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background-color: var(--background-color, #fff);
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            z-index: 100;
          }

          .option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            cursor: pointer;
            color: var(--secondary-color, #000);
          }

          .option:hover,
          .option.active {
            background-color: rgba(128, 128, 128, 0.2);
          }

          img {
            border-radius: 2px;
            object-fit: cover;
          }
        </style>

        <label>${this._getLabel()}</label>
        <div class="trigger" id="trigger">
          <div class="trigger-content">
            <img src="${this._getFlagPath(this._selected)}" alt="${this._selected}" width="32" />
            <span>${ISO_TO_NAME[this._selected]}</span>
          </div>
          <span>▾</span>
        </div>

        <div class="dropdown" id="dropdown">
          ${optionsHtml}
        </div>
      `;

      this.shadowRoot.querySelector('#trigger').addEventListener('click', () => {
        this._isOpen = !this._isOpen;
        this._render();
      });

      this.shadowRoot.querySelectorAll('.option').forEach((opt) => {
        opt.addEventListener('click', () => {
          const iso = opt.getAttribute('data-iso');
          this._selected = iso;
          this._isOpen = false;
          this._render();
          this.dispatchEvent(new CustomEvent('selected-changed', {
            detail: { value: iso },
            bubbles: true,
            composed: true
          }));
        });
      });
    }
  }

  customElements.define('language-selection', LanguageSelection);

  // =========================================================================
  // 4. CHEMICAL ELEMENT PAGE (Panel central de información)
  // =========================================================================
  const DEFAULT_LOCALES = {
    sp: {
      'group': 'Grupo',
      'atomic number': 'Número atómico',
      'atomic weight': 'Peso atómico',
      'electronegativity': 'Electronegatividad',
      'boiling point': 'Punto de ebullición',
      'melting point': 'Punto de fusión',
      'alkali-metal': 'Metal alcalino',
      'alkaline-earth-metal': 'Metal alcalinotérreo',
      'transition-metal': 'Metal de transición',
      'post-transition-metal': 'Metal del bloque p',
      'metalloid': 'Metaloide',
      'other-nonmetal': 'No metal',
      'halogen': 'Halógeno',
      'noble-gas': 'Gas noble',
      'lanthanide': 'Lantánido',
      'actinide': 'Actínido'
    },
    en: {
      'group': 'Group',
      'atomic number': 'Atomic number',
      'atomic weight': 'Atomic weight',
      'electronegativity': 'Electronegativity',
      'boiling point': 'Boiling point',
      'melting point': 'Melting point',
      'alkali-metal': 'Alkali metal',
      'alkaline-earth-metal': 'Alkaline earth metal',
      'transition-metal': 'Transition metal',
      'post-transition-metal': 'Post-transition metal',
      'metalloid': 'Metalloid',
      'other-nonmetal': 'Other nonmetal',
      'halogen': 'Halogen',
      'noble-gas': 'Noble gas',
      'lanthanide': 'Lanthanide',
      'actinide': 'Actinide'
    },
    de: {
      'group': 'Gruppe',
      'atomic number': 'Ordnungszahl',
      'atomic weight': 'Atommasse',
      'electronegativity': 'Elektronegativität',
      'boiling point': 'Siedepunkt',
      'melting point': 'Schmelzpunkt',
      'alkali-metal': 'Alkalimetall',
      'alkaline-earth-metal': 'Erdalkalimetall',
      'transition-metal': 'Übergangsmetall',
      'post-transition-metal': 'Nachübergangsmetall',
      'metalloid': 'Halbmetall',
      'other-nonmetal': 'Nichtmetall',
      'halogen': 'Halogen',
      'noble-gas': 'Edelgas',
      'lanthanide': 'Lanthanoid',
      'actinide': 'Actinoid'
    },
    fr: {
      'group': 'Groupe',
      'atomic number': 'Numéro atomique',
      'atomic weight': 'Masse atomique',
      'electronegativity': 'Électronégativité',
      'boiling point': "Point d'ébullition",
      'melting point': 'Point de fusion',
      'alkali-metal': 'Métal alcalin',
      'alkaline-earth-metal': 'Métal alcalino-terreux',
      'transition-metal': 'Métal de transition',
      'post-transition-metal': 'Métal pauvre',
      'metalloid': 'Métalloïde',
      'other-nonmetal': 'Non-métal',
      'halogen': 'Halogène',
      'noble-gas': 'Gaz noble',
      'lanthanide': 'Lanthanide',
      'actinide': 'Actinide'
    },
    'pt-br': {
      'group': 'Grupo',
      'atomic number': 'Número atômico',
      'atomic weight': 'Peso atômico',
      'electronegativity': 'Eletronegatividade',
      'boiling point': 'Ponto de ebulição',
      'melting point': 'Ponto de fusão',
      'alkali-metal': 'Metal alcalino',
      'alkaline-earth-metal': 'Metal alcalino-terroso',
      'transition-metal': 'Metal de transição',
      'post-transition-metal': 'Metal pós-transição',
      'metalloid': 'Semimetal',
      'other-nonmetal': 'Não metal',
      'halogen': 'Halogênio',
      'noble-gas': 'Gás nobre',
      'lanthanide': 'Lantanídeo',
      'actinide': 'Actinídeo'
    },
    tk: {
      'group': 'Grup',
      'atomic number': 'Atom numarası',
      'atomic weight': 'Atom ağırlığı',
      'electronegativity': 'Elektronegatiflik',
      'boiling point': 'Kaynama noktası',
      'melting point': 'Erime noktası',
      'alkali-metal': 'Alkali metal',
      'alkaline-earth-metal': 'Toprak alkali metal',
      'transition-metal': 'Geçiş metali',
      'post-transition-metal': 'Geçiş sonrası metal',
      'metalloid': 'Yarı metal',
      'other-nonmetal': 'Ametal',
      'halogen': 'Halojen',
      'noble-gas': 'Soygaz',
      'lanthanide': 'Lantanit',
      'actinide': 'Aktinit'
    },
    hi: {
      'group': 'समूह',
      'atomic number': 'परमाणु संख्या',
      'atomic weight': 'परमाणु भार',
      'electronegativity': 'विद्युत ऋणात्मकता',
      'boiling point': 'क्वथनांक',
      'melting point': 'गलनांक',
      'alkali-metal': 'क्षार धातु',
      'alkaline-earth-metal': 'क्षारीय मृदा धातु',
      'transition-metal': 'संक्रमण धातु',
      'post-transition-metal': 'संक्रमणोत्तर धातु',
      'metalloid': 'उपधातु',
      'other-nonmetal': 'अधातु',
      'halogen': 'हैलोजन',
      'noble-gas': 'उत्कृष्ट गैस',
      'lanthanide': 'लैंथेनाइड',
      'actinide': 'एक्टिनाइड'
    },
    cz: {
      'group': 'Skupina',
      'atomic number': 'Atomové číslo',
      'atomic weight': 'Atomová hmotnost',
      'electronegativity': 'Elektronegativita',
      'boiling point': 'Bod varu',
      'melting point': 'Bod tání',
      'alkali-metal': 'Alkalický kov',
      'alkaline-earth-metal': 'Kov alkalických zemin',
      'transition-metal': 'Přechodný kov',
      'post-transition-metal': 'Kov p-bloku',
      'metalloid': 'Polokov',
      'other-nonmetal': 'Nekov',
      'halogen': 'Halogen',
      'noble-gas': 'Vzácný plyn',
      'lanthanide': 'Lanthanoid',
      'actinide': 'Aktinoid'
    },
    ru: {
      'group': 'Группа',
      'atomic number': 'Атомный номер',
      'atomic weight': 'Атомная масса',
      'electronegativity': 'Электроотрицательность',
      'boiling point': 'Точка кипения',
      'melting point': 'Точка плавления',
      'alkali-metal': 'Щелочной металл',
      'alkaline-earth-metal': 'Щёлочноземельный металл',
      'transition-metal': 'Переходный металл',
      'post-transition-metal': 'Постпереходный металл',
      'metalloid': 'Металлоид',
      'other-nonmetal': 'Неметалл',
      'halogen': 'Галоген',
      'noble-gas': 'Благородный газ',
      'lanthanide': 'Лантаноид',
      'actinide': 'Актиноид'
    },
    pl: {
      'group': 'Grupa',
      'atomic number': 'Liczba atomowa',
      'atomic weight': 'Masa atomowa',
      'electronegativity': 'Elektroujemność',
      'boiling point': 'Temperatura wrzenia',
      'melting point': 'Temperatura topnienia',
      'alkali-metal': 'Metal alkaliczny',
      'alkaline-earth-metal': 'Metal ziem alkalicznych',
      'transition-metal': 'Metal przejściowy',
      'post-transition-metal': 'Metal bloku p',
      'metalloid': 'Półmetal',
      'other-nonmetal': 'Niemetal',
      'halogen': 'Halogen',
      'noble-gas': 'Gaz szlachetny',
      'lanthanide': 'Lantanowiec',
      'actinide': 'Aktynowiec'
    }
  };

  const ELEMENT_NAMES = {
    "en": {
      "h": "Hydrogen",
      "he": "Helium",
      "li": "Lithium",
      "be": "Beryllium",
      "b": "Boron",
      "c": "Carbon",
      "n": "Nitrogen",
      "o": "Oxygen",
      "f": "Fluorine",
      "ne": "Neon",
      "na": "Sodium",
      "mg": "Magnesium",
      "al": "Aluminium",
      "si": "Silicon",
      "p": "Phosphorus",
      "s": "Sulfur",
      "cl": "Chlorine",
      "ar": "Argon",
      "k": "Potassium",
      "ca": "Calcium",
      "sc": "Scandium",
      "ti": "Titanium",
      "v": "Vanadium",
      "cr": "Chromium",
      "mn": "Manganese",
      "fe": "Iron",
      "co": "Cobalt",
      "ni": "Nickel",
      "cu": "Copper",
      "zn": "Zinc",
      "ga": "Gallium",
      "ge": "Germanium",
      "as": "Arsenic",
      "se": "Selenium",
      "br": "Bromine",
      "kr": "Krypton",
      "rb": "Rubidium",
      "sr": "Strontium",
      "y": "Yttrium",
      "zr": "Zirconium",
      "nb": "Niobium",
      "mo": "Molybdenum",
      "tc": "Technetium",
      "ru": "Ruthenium",
      "rh": "Rhodium",
      "pd": "Palladium",
      "ag": "Silver",
      "cd": "Cadmium",
      "in": "Indium",
      "sn": "Tin",
      "sb": "Antimony",
      "te": "Tellurium",
      "i": "Iodine",
      "xe": "Xenon",
      "cs": "Caesium",
      "ba": "Barium",
      "la": "Lanthanum",
      "ce": "Cerium",
      "pr": "Praseodymium",
      "nd": "Neodymium",
      "pm": "Promethium",
      "sm": "Samarium",
      "eu": "Europium",
      "gd": "Gadolinium",
      "tb": "Terbium",
      "dy": "Dysprosium",
      "ho": "Holmium",
      "er": "Erbium",
      "tm": "Thulium",
      "yb": "Ytterbium",
      "lu": "Lutetium",
      "hf": "Hafnium",
      "ta": "Tantalum",
      "w": "Tungsten",
      "re": "Rhenium",
      "os": "Osmium",
      "ir": "Iridium",
      "pt": "Platinum",
      "au": "Gold",
      "hg": "Mercury",
      "tl": "Thallium",
      "pb": "Lead",
      "bi": "Bismuth",
      "po": "Polonium",
      "at": "Astatine",
      "rn": "Radon",
      "fr": "Francium",
      "ra": "Radium",
      "ac": "Actinium",
      "th": "Thorium",
      "pa": "Protactinium",
      "u": "Uranium",
      "np": "Neptunium",
      "pu": "Plutonium",
      "am": "Americium",
      "cm": "Curium",
      "bk": "Berkelium",
      "cf": "Californium",
      "es": "Einsteinium",
      "fm": "Fermium",
      "md": "Mendelevium",
      "no": "Nobelium",
      "lr": "Lawrencium",
      "rf": "Rutherfordium",
      "db": "Dubnium",
      "sg": "Seaborgium",
      "bh": "Bohrium",
      "hs": "Hassium",
      "mt": "Meitnerium",
      "ds": "Darmstadtium",
      "rg": "Roentgenium",
      "cn": "Copernicium",
      "nh": "Nihonium",
      "fl": "Flerovium",
      "mc": "Moscovium",
      "lv": "Livermorium",
      "ts": "Tennessine",
      "og": "Oganesson"
    },
    "sp": {
      "h": "Hidrógeno",
      "he": "Helio",
      "li": "Litio",
      "be": "Berilio",
      "b": "Boro",
      "c": "Carbono",
      "n": "Nitrógeno",
      "o": "Oxígeno",
      "f": "Flúor",
      "ne": "Neón",
      "na": "Sodio",
      "mg": "Magnesio",
      "al": "Aluminio",
      "si": "Silicio",
      "p": "Fósforo",
      "s": "Azufre",
      "cl": "Cloro",
      "ar": "Argón",
      "k": "Potasio",
      "ca": "Calcio",
      "sc": "Escandio",
      "ti": "Titanio",
      "v": "Vanadio",
      "cr": "Cromo",
      "mn": "Manganeso",
      "fe": "Hierro",
      "co": "Cobalto",
      "ni": "Níquel",
      "cu": "Cobre",
      "zn": "Zinc",
      "ga": "Galio",
      "ge": "Germanio",
      "as": "Arsénico",
      "se": "Selenio",
      "br": "Bromo",
      "kr": "Kriptón",
      "rb": "Rubidio",
      "sr": "Estroncio",
      "y": "Itrio",
      "zr": "Circonio",
      "nb": "Niobio",
      "mo": "Molibdeno",
      "tc": "Tecnecio",
      "ru": "Rutenio",
      "rh": "Rodio",
      "pd": "Paladio",
      "ag": "Plata",
      "cd": "Cadmio",
      "in": "Indio",
      "sn": "Estaño",
      "sb": "Antimonio",
      "te": "Telurio",
      "i": "Yodo",
      "xe": "Xenón",
      "cs": "Cesio",
      "ba": "Bario",
      "la": "Lantano",
      "ce": "Cerio",
      "pr": "Praseodimio",
      "nd": "Neodimio",
      "pm": "Prometio",
      "sm": "Samario",
      "eu": "Europio",
      "gd": "Gadolinio",
      "tb": "Terbio",
      "dy": "Disprosio",
      "ho": "Holmio",
      "er": "Erbio",
      "tm": "Tulio",
      "yb": "Iterbio",
      "lu": "Lutecio",
      "hf": "Hafnio",
      "ta": "Tántalo",
      "w": "Wolframio",
      "re": "Renio",
      "os": "Osmio",
      "ir": "Iridio",
      "pt": "Platino",
      "au": "Oro",
      "hg": "Mercurio",
      "tl": "Talio",
      "pb": "Plomo",
      "bi": "Bismuto",
      "po": "Polonio",
      "at": "Astato",
      "rn": "Radón",
      "fr": "Francio",
      "ra": "Radio",
      "ac": "Actinio",
      "th": "Torio",
      "pa": "Protactinio",
      "u": "Uranio",
      "np": "Neptunio",
      "pu": "Plutonio",
      "am": "Americio",
      "cm": "Curio",
      "bk": "Berkelio",
      "cf": "Californio",
      "es": "Einstenio",
      "fm": "Fermio",
      "md": "Mendelevio",
      "no": "Nobelio",
      "lr": "Lawrencio",
      "rf": "Rutherfordio",
      "db": "Dubnio",
      "sg": "Seaborgio",
      "bh": "Bohrio",
      "hs": "Hasio",
      "mt": "Meitnerio",
      "ds": "Darmstatio",
      "rg": "Roentgenio",
      "cn": "Copernicio",
      "nh": "Nihonio",
      "fl": "Flerovio",
      "mc": "Moscovio",
      "lv": "Livermorio",
      "ts": "Teneso",
      "og": "Oganesón"
    },
    "de": {
      "h": "Wasserstoff",
      "he": "Helium",
      "li": "Lithium",
      "be": "Beryllium",
      "b": "Bor",
      "c": "Kohlenstoff",
      "n": "Stickstoff",
      "o": "Sauerstoff",
      "f": "Fluor",
      "ne": "Neon",
      "na": "Natrium",
      "mg": "Magnesium",
      "al": "Aluminium",
      "si": "Silicium",
      "p": "Phosphor",
      "s": "Schwefel",
      "cl": "Chlor",
      "ar": "Argon",
      "k": "Kalium",
      "ca": "Calcium",
      "sc": "Scandium",
      "ti": "Titan",
      "v": "Vanadium",
      "cr": "Chrom",
      "mn": "Mangan",
      "fe": "Eisen",
      "co": "Cobalt",
      "ni": "Nickel",
      "cu": "Kupfer",
      "zn": "Zink",
      "ga": "Gallium",
      "ge": "Germanium",
      "as": "Arsen",
      "se": "Selen",
      "br": "Brom",
      "kr": "Krypton",
      "rb": "Rubidium",
      "sr": "Strontium",
      "y": "Yttrium",
      "zr": "Zirconium",
      "nb": "Niob",
      "mo": "Molybdän",
      "tc": "Technetium",
      "ru": "Ruthenium",
      "rh": "Rhodium",
      "pd": "Palladium",
      "ag": "Silber",
      "cd": "Cadmium",
      "in": "Indium",
      "sn": "Zinn",
      "sb": "Antimon",
      "te": "Tellur",
      "i": "Iod",
      "xe": "Xenon",
      "cs": "Caesium",
      "ba": "Barium",
      "la": "Lanthan",
      "ce": "Cer",
      "pr": "Praseodym",
      "nd": "Neodym",
      "pm": "Promethium",
      "sm": "Samarium",
      "eu": "Europium",
      "gd": "Gadolinium",
      "tb": "Terbium",
      "dy": "Dysprosium",
      "ho": "Holmium",
      "er": "Erbium",
      "tm": "Thulium",
      "yb": "Ytterbium",
      "lu": "Lutetium",
      "hf": "Hafnium",
      "ta": "Tantal",
      "w": "Wolfram",
      "re": "Rhenium",
      "os": "Osmium",
      "ir": "Iridium",
      "pt": "Platin",
      "au": "Gold",
      "hg": "Quecksilber",
      "tl": "Thallium",
      "pb": "Blei",
      "bi": "Bismut",
      "po": "Polonium",
      "at": "Astat",
      "rn": "Radon",
      "fr": "Francium",
      "ra": "Radium",
      "ac": "Actinium",
      "th": "Thorium",
      "pa": "Protactinium",
      "u": "Uran",
      "np": "Neptunium",
      "pu": "Plutonium",
      "am": "Americium",
      "cm": "Curium",
      "bk": "Berkelium",
      "cf": "Californium",
      "es": "Einsteinium",
      "fm": "Fermium",
      "md": "Mendelevium",
      "no": "Nobelium",
      "lr": "Lawrencium",
      "rf": "Rutherfordium",
      "db": "Dubnium",
      "sg": "Seaborgium",
      "bh": "Bohrium",
      "hs": "Hassium",
      "mt": "Meitnerium",
      "ds": "Darmstadtium",
      "rg": "Roentgenium",
      "cn": "Copernicium",
      "nh": "Nihonium",
      "fl": "Flerovium",
      "mc": "Moscovium",
      "lv": "Livermorium",
      "ts": "Tenness",
      "og": "Oganesson"
    },
    "fr": {
      "h": "Hydrogène",
      "he": "Hélium",
      "li": "Lithium",
      "be": "Béryllium",
      "b": "Bore",
      "c": "Carbone",
      "n": "Azote",
      "o": "Oxygène",
      "f": "Fluor",
      "ne": "Néon",
      "na": "Sodium",
      "mg": "Magnésium",
      "al": "Aluminium",
      "si": "Silicium",
      "p": "Phosphore",
      "s": "Soufre",
      "cl": "Chlore",
      "ar": "Argon",
      "k": "Potassium",
      "ca": "Calcium",
      "sc": "Scandium",
      "ti": "Titane",
      "v": "Vanadium",
      "cr": "Chrome",
      "mn": "Manganèse",
      "fe": "Fer",
      "co": "Cobalt",
      "ni": "Nickel",
      "cu": "Cuivre",
      "zn": "Zinc",
      "ga": "Gallium",
      "ge": "Germanium",
      "as": "Arsenic",
      "se": "Sélénium",
      "br": "Brome",
      "kr": "Krypton",
      "rb": "Rubidium",
      "sr": "Strontium",
      "y": "Yttrium",
      "zr": "Zirconium",
      "nb": "Niobium",
      "mo": "Molybdène",
      "tc": "Technétium",
      "ru": "Ruthénium",
      "rh": "Rhodium",
      "pd": "Palladium",
      "ag": "Argent",
      "cd": "Cadmium",
      "in": "Indium",
      "sn": "Étain",
      "sb": "Antimoine",
      "te": "Tellure",
      "i": "Iode",
      "xe": "Xénon",
      "cs": "Césium",
      "ba": "Baryum",
      "la": "Lanthane",
      "ce": "Cérium",
      "pr": "Praséodyme",
      "nd": "Néodyme",
      "pm": "Prométhium",
      "sm": "Samarium",
      "eu": "Europium",
      "gd": "Gadolinium",
      "tb": "Terbium",
      "dy": "Dysprosium",
      "ho": "Holmium",
      "er": "Erbium",
      "tm": "Thulium",
      "yb": "Ytterbium",
      "lu": "Lutécium",
      "hf": "Hafnium",
      "ta": "Tantale",
      "w": "Tungstène",
      "re": "Rhénium",
      "os": "Osmium",
      "ir": "Iridium",
      "pt": "Platine",
      "au": "Or",
      "hg": "Mercure",
      "tl": "Thallium",
      "pb": "Plomb",
      "bi": "Bismuth",
      "po": "Polonium",
      "at": "Astate",
      "rn": "Radon",
      "fr": "Francium",
      "ra": "Radium",
      "ac": "Actinium",
      "th": "Thorium",
      "pa": "Protactinium",
      "u": "Uranium",
      "np": "Neptunium",
      "pu": "Plutonium",
      "am": "Américium",
      "cm": "Curium",
      "bk": "Berkélium",
      "cf": "Californium",
      "es": "Einsteinium",
      "fm": "Fermium",
      "md": "Mendélévium",
      "no": "Nobélium",
      "lr": "Lawrencium",
      "rf": "Rutherfordium",
      "db": "Dubnium",
      "sg": "Seaborgium",
      "bh": "Bohrium",
      "hs": "Hassium",
      "mt": "Meitnérium",
      "ds": "Darmstadtium",
      "rg": "Roentgenium",
      "cn": "Copernicium",
      "nh": "Nihonium",
      "fl": "Flérovium",
      "mc": "Moscovium",
      "lv": "Livermorium",
      "ts": "Tennesse",
      "og": "Oganesson"
    },
    "pt-br": {
      "h": "Hidrogênio",
      "he": "Hélio",
      "li": "Lítio",
      "be": "Berílio",
      "b": "Boro",
      "c": "Carbono",
      "n": "Nitrogênio",
      "o": "Oxigênio",
      "f": "Flúor",
      "ne": "Neônio",
      "na": "Sódio",
      "mg": "Magnésio",
      "al": "Alumínio",
      "si": "Silício",
      "p": "Fósforo",
      "s": "Enxofre",
      "cl": "Cloro",
      "ar": "Argônio",
      "k": "Potássio",
      "ca": "Cálcio",
      "sc": "Escândio",
      "ti": "Titânio",
      "v": "Vanádio",
      "cr": "Cromo",
      "mn": "Manganês",
      "fe": "Ferro",
      "co": "Cobalto",
      "ni": "Níquel",
      "cu": "Cobre",
      "zn": "Zinco",
      "ga": "Gálio",
      "ge": "Germânio",
      "as": "Arsênio",
      "se": "Selênio",
      "br": "Bromo",
      "kr": "Criptônio",
      "rb": "Rubídio",
      "sr": "Estrôncio",
      "y": "Ítrio",
      "zr": "Zircônio",
      "nb": "Nióbio",
      "mo": "Molibdênio",
      "tc": "Tecnécio",
      "ru": "Rutênio",
      "rh": "Ródio",
      "pd": "Paládio",
      "ag": "Prata",
      "cd": "Cádmio",
      "in": "Índio",
      "sn": "Estanho",
      "sb": "Antimônio",
      "te": "Telúrio",
      "i": "Iodo",
      "xe": "Xenônio",
      "cs": "Césio",
      "ba": "Bário",
      "la": "Lantânio",
      "ce": "Cério",
      "pr": "Praseodímio",
      "nd": "Neodímio",
      "pm": "Promécio",
      "sm": "Samário",
      "eu": "Európio",
      "gd": "Gadolínio",
      "tb": "Térbio",
      "dy": "Disprósio",
      "ho": "Hólmio",
      "er": "Érbio",
      "tm": "Túlio",
      "yb": "Itérbio",
      "lu": "Lutécio",
      "hf": "Háfnio",
      "ta": "Tântalo",
      "w": "Tungstênio",
      "re": "Rênio",
      "os": "Ósmio",
      "ir": "Irídio",
      "pt": "Platina",
      "au": "Ouro",
      "hg": "Mercúrio",
      "tl": "Tálio",
      "pb": "Chumbo",
      "bi": "Bismuto",
      "po": "Polônio",
      "at": "Astato",
      "rn": "Radônio",
      "fr": "Frâncio",
      "ra": "Rádio",
      "ac": "Actínio",
      "th": "Tório",
      "pa": "Protactínio",
      "u": "Urânio",
      "np": "Netúnio",
      "pu": "Plutônio",
      "am": "Amerício",
      "cm": "Cúrio",
      "bk": "Berquélio",
      "cf": "Califórnio",
      "es": "Einstênio",
      "fm": "Férmio",
      "md": "Mendelévio",
      "no": "Nobélio",
      "lr": "Laurêncio",
      "rf": "Rutherfórdio",
      "db": "Dúbnio",
      "sg": "Seabórgio",
      "bh": "Bóhrio",
      "hs": "Hássio",
      "mt": "Meitnério",
      "ds": "Darmstádio",
      "rg": "Roentgênio",
      "cn": "Copernício",
      "nh": "Nihônio",
      "fl": "Fleróvio",
      "mc": "Moscóvio",
      "lv": "Livermório",
      "ts": "Tenessino",
      "og": "Oganessônio"
    },
    "tk": {
      "h": "Hidrojen",
      "he": "Helyum",
      "li": "Lityum",
      "be": "Berilyum",
      "b": "Bor",
      "c": "Karbon",
      "n": "Azot",
      "o": "Oksijen",
      "f": "Flor",
      "ne": "Neon",
      "na": "Sodyum",
      "mg": "Magnezyum",
      "al": "Alüminyum",
      "si": "Silisyum",
      "p": "Fosfor",
      "s": "Kükürt",
      "cl": "Klor",
      "ar": "Argon",
      "k": "Potasyum",
      "ca": "Kalsiyum",
      "sc": "Skandiyum",
      "ti": "Titanyum",
      "v": "Vanadyum",
      "cr": "Krom",
      "mn": "Mangan",
      "fe": "Demir",
      "co": "Kobalt",
      "ni": "Nikel",
      "cu": "Bakır",
      "zn": "Çinko",
      "ga": "Galyum",
      "ge": "Germanyum",
      "as": "Arsenik",
      "se": "Selenyum",
      "br": "Brom",
      "kr": "Kripton",
      "rb": "Rubidyum",
      "sr": "Stronsiyum",
      "y": "İtriyum",
      "zr": "Zirkonyum",
      "nb": "Niyobyum",
      "mo": "Molibden",
      "tc": "Teknesyum",
      "ru": "Rutenyum",
      "rh": "Rodyum",
      "pd": "Paladyum",
      "ag": "Gümüş",
      "cd": "Kadmiyum",
      "in": "İndiyum",
      "sn": "Kalay",
      "sb": "Antimon",
      "te": "Tellür",
      "i": "İyot",
      "xe": "Ksenon",
      "cs": "Sezyum",
      "ba": "Baryum",
      "la": "Lantan",
      "ce": "Seryum",
      "pr": "Praseodim",
      "nd": "Neodim",
      "pm": "Prometyum",
      "sm": "Samaryum",
      "eu": "Evropiyum",
      "gd": "Gadolinyum",
      "tb": "Terbiyum",
      "dy": "Disprozyum",
      "ho": "Holmiyum",
      "er": "Erbiyum",
      "tm": "Tulyum",
      "yb": "İterbiyum",
      "lu": "Lutesyum",
      "hf": "Hafniyum",
      "ta": "Tantal",
      "w": "Tungsten",
      "re": "Renyum",
      "os": "Osmiyum",
      "ir": "İridyum",
      "pt": "Platin",
      "au": "Altın",
      "hg": "Cıva",
      "tl": "Talyum",
      "pb": "Kurşun",
      "bi": "Bizmut",
      "po": "Polonyum",
      "at": "Astatin",
      "rn": "Radon",
      "fr": "Fransiyum",
      "ra": "Radyum",
      "ac": "Aktinyum",
      "th": "Toryum",
      "pa": "Protaktinyum",
      "u": "Uranyum",
      "np": "Neptünyum",
      "pu": "Plütonyum",
      "am": "Amerikyum",
      "cm": "Küriyum",
      "bk": "Berkelyum",
      "cf": "Kaliforniyum",
      "es": "Aynştaynyum",
      "fm": "Fermiyum",
      "md": "Mendelevyum",
      "no": "Nobelyum",
      "lr": "Lavrensiyum",
      "rf": "Rutherfordiyum",
      "db": "Dubniyum",
      "sg": "Seaborgiyum",
      "bh": "Bohriyum",
      "hs": "Hassiyum",
      "mt": "Meitneriyum",
      "ds": "Darmstadtiyum",
      "rg": "Röntgenyum",
      "cn": "Kopernikyum",
      "nh": "Nihonyum",
      "fl": "Flerovyum",
      "mc": "Moskovyum",
      "lv": "Livermoryum",
      "ts": "Tennesin",
      "og": "Oganesson"
    },
    "hi": {
      "h": "हाइड्रोजन",
      "he": "हीलियम",
      "li": "लिथियम",
      "be": "बेरिलियम",
      "b": "बोरॉन",
      "c": "कार्बन",
      "n": "नाइट्रोजन",
      "o": "ऑक्सीजन",
      "f": "फ़्लोरीन",
      "ne": "नियॉन",
      "na": "सोडियम",
      "mg": "मैग्नीशियम",
      "al": "एल्युमीनियम",
      "si": "सिलिकॉन",
      "p": "फ़ॉस्फ़ोरस",
      "s": "सल्फ़र",
      "cl": "क्लोरीन",
      "ar": "आर्गन",
      "k": "पोटैशियम",
      "ca": "कैल्शियम",
      "sc": "स्कैंडियम",
      "ti": "टाइटेनियम",
      "v": "वैनेडियम",
      "cr": "क्रोमियम",
      "mn": "मैंगनीज़",
      "fe": "लोहा",
      "co": "कोबाल्ट",
      "ni": "निकेल",
      "cu": "ताँबा",
      "zn": "जस्ता",
      "ga": "गैलियम",
      "ge": "जर्मेनियम",
      "as": "आर्सेनिक",
      "se": "सेलेनियम",
      "br": "ब्रोमीन",
      "kr": "क्रिप्टॉन",
      "rb": "रूबिडियम",
      "sr": "स्ट्रॉन्शियम",
      "y": "इट्रियम",
      "zr": "ज़िरकोनियम",
      "nb": "नायोबियम",
      "mo": "मोलिब्डेनम",
      "tc": "टेक्नीशियम",
      "ru": "रूथेनियम",
      "rh": "रोडियम",
      "pd": "पैलेडियम",
      "ag": "चाँदी",
      "cd": "कैडमियम",
      "in": "इंडियम",
      "sn": "टिन",
      "sb": "एंटिमनी",
      "te": "टेल्यूरियम",
      "i": "आयोडीन",
      "xe": "ज़ेनॉन",
      "cs": "सीज़ियम",
      "ba": "बेरियम",
      "la": "लैन्थेनम",
      "ce": "सीरियम",
      "pr": "प्रैसियोडिमियम",
      "nd": "नियोडिमियम",
      "pm": "प्रोमीथियम",
      "sm": "समैरियम",
      "eu": "यूरोपियम",
      "gd": "गैडोलिनियम",
      "tb": "टर्बियम",
      "dy": "डिस्प्रोसियम",
      "ho": "होल्मियम",
      "er": "अर्बियम",
      "tm": "थुलियम",
      "yb": "इटर्बियम",
      "lu": "ल्यूटेशियम",
      "hf": "हैफ़्नियम",
      "ta": "टैंटलम",
      "w": "टंगस्टन",
      "re": "रेनियम",
      "os": "ऑस्मियम",
      "ir": "इरीडियम",
      "pt": "प्लैटिनम",
      "au": "सोना",
      "hg": "पारा",
      "tl": "थैलियम",
      "pb": "सीसा",
      "bi": "बिस्मथ",
      "po": "पोलोनियम",
      "at": "एस्टैटिन",
      "rn": "रेडॉन",
      "fr": "फ़्रैन्शियम",
      "ra": "रेडियम",
      "ac": "एक्टिनियम",
      "th": "थोरियम",
      "pa": "प्रोटैक्टिनियम",
      "u": "यूरेनियम",
      "np": "नेप्च्यूनियम",
      "pu": "प्लूटोनियम",
      "am": "अमेरिशियम",
      "cm": "क्यूरियम",
      "bk": "बर्केलियम",
      "cf": "कैलिफ़ोर्नियम",
      "es": "आइंस्टीनियम",
      "fm": "फ़र्मियम",
      "md": "मेंडेलीवियम",
      "no": "नोबेलियम",
      "lr": "लॉरेंशियम",
      "rf": "रदरफ़ोर्डियम",
      "db": "डब्नियम",
      "sg": "सीबोर्गियम",
      "bh": "बोरियम",
      "hs": "हैसियम",
      "mt": "माइट्नेरियम",
      "ds": "डार्मस्टैडियम",
      "rg": "रोएंटजेनियम",
      "cn": "कोपरनिसियम",
      "nh": "निहोनियम",
      "fl": "फ़्लेरोवियम",
      "mc": "मॉस्कोवियम",
      "lv": "लिवरमोरियम",
      "ts": "टेनेसीन",
      "og": "ओगानेसन"
    },
    "cz": {
      "h": "Vodík",
      "he": "Helium",
      "li": "Lithium",
      "be": "Beryllium",
      "b": "Bor",
      "c": "Uhlík",
      "n": "Dusík",
      "o": "Kyslík",
      "f": "Fluor",
      "ne": "Neon",
      "na": "Sodík",
      "mg": "Hořčík",
      "al": "Hliník",
      "si": "Křemík",
      "p": "Fosfor",
      "s": "Síra",
      "cl": "Chlor",
      "ar": "Argon",
      "k": "Draslík",
      "ca": "Vápník",
      "sc": "Skandium",
      "ti": "Titan",
      "v": "Vanad",
      "cr": "Chrom",
      "mn": "Mangan",
      "fe": "Železo",
      "co": "Kobalt",
      "ni": "Nikl",
      "cu": "Měď",
      "zn": "Zinek",
      "ga": "Gallium",
      "ge": "Germanium",
      "as": "Arsen",
      "se": "Selen",
      "br": "Brom",
      "kr": "Krypton",
      "rb": "Rubidium",
      "sr": "Stroncium",
      "y": "Yttrium",
      "zr": "Zirkonium",
      "nb": "Niob",
      "mo": "Molybden",
      "tc": "Technecium",
      "ru": "Ruthenium",
      "rh": "Rhodium",
      "pd": "Palladium",
      "ag": "Stříbro",
      "cd": "Kadmium",
      "in": "Indium",
      "sn": "Cín",
      "sb": "Antimon",
      "te": "Tellur",
      "i": "Jod",
      "xe": "Xenon",
      "cs": "Cesium",
      "ba": "Baryum",
      "la": "Lanthan",
      "ce": "Cer",
      "pr": "Praseodym",
      "nd": "Neodym",
      "pm": "Promethium",
      "sm": "Samarium",
      "eu": "Europium",
      "gd": "Gadolinium",
      "tb": "Terbium",
      "dy": "Dysprosium",
      "ho": "Holmium",
      "er": "Erbium",
      "tm": "Thulium",
      "yb": "Ytterbium",
      "lu": "Lutecium",
      "hf": "Hafnium",
      "ta": "Tantal",
      "w": "Wolfram",
      "re": "Rhenium",
      "os": "Osmium",
      "ir": "Iridium",
      "pt": "Platina",
      "au": "Zlato",
      "hg": "Rtuť",
      "tl": "Thallium",
      "pb": "Olovo",
      "bi": "Bismut",
      "po": "Polonium",
      "at": "Astat",
      "rn": "Radon",
      "fr": "Francium",
      "ra": "Radium",
      "ac": "Aktinium",
      "th": "Thorium",
      "pa": "Protaktinium",
      "u": "Uran",
      "np": "Neptunium",
      "pu": "Plutonium",
      "am": "Americium",
      "cm": "Curium",
      "bk": "Berkelium",
      "cf": "Kalifornium",
      "es": "Einsteinium",
      "fm": "Fermium",
      "md": "Mendelevium",
      "no": "Nobelium",
      "lr": "Lawrencium",
      "rf": "Rutherfordium",
      "db": "Dubnium",
      "sg": "Seaborgium",
      "bh": "Bohrium",
      "hs": "Hassium",
      "mt": "Meitnerium",
      "ds": "Darmstadtium",
      "rg": "Roentgenium",
      "cn": "Kopernicium",
      "nh": "Nihonium",
      "fl": "Flerovium",
      "mc": "Moscovium",
      "lv": "Livermorium",
      "ts": "Tennessin",
      "og": "Oganesson"
    },
    "ru": {
      "h": "Водород",
      "he": "Гелий",
      "li": "Литий",
      "be": "Бериллий",
      "b": "Бор",
      "c": "Углерод",
      "n": "Азот",
      "o": "Кислород",
      "f": "Фтор",
      "ne": "Неон",
      "na": "Натрий",
      "mg": "Магний",
      "al": "Алюминий",
      "si": "Кремний",
      "p": "Фосфор",
      "s": "Сера",
      "cl": "Хлор",
      "ar": "Аргон",
      "k": "Калий",
      "ca": "Кальций",
      "sc": "Скандий",
      "ti": "Титан",
      "v": "Ванадий",
      "cr": "Хром",
      "mn": "Марганец",
      "fe": "Железо",
      "co": "Кобальт",
      "ni": "Никель",
      "cu": "Медь",
      "zn": "Цинк",
      "ga": "Галлий",
      "ge": "Германий",
      "as": "Мышьяк",
      "se": "Селен",
      "br": "Бром",
      "kr": "Криптон",
      "rb": "Рубидий",
      "sr": "Стронций",
      "y": "Иттрий",
      "zr": "Цирконий",
      "nb": "Ниобий",
      "mo": "Молибден",
      "tc": "Технеций",
      "ru": "Рутений",
      "rh": "Родий",
      "pd": "Палладий",
      "ag": "Серебро",
      "cd": "Кадмий",
      "in": "Индий",
      "sn": "Олово",
      "sb": "Сурьма",
      "te": "Теллур",
      "i": "Иод",
      "xe": "Ксенон",
      "cs": "Цезий",
      "ba": "Барий",
      "la": "Лантан",
      "ce": "Церий",
      "pr": "Празеодим",
      "nd": "Неодим",
      "pm": "Прометий",
      "sm": "Самарий",
      "eu": "Европий",
      "gd": "Гадолиний",
      "tb": "Тербий",
      "dy": "Диспрозий",
      "ho": "Гольмий",
      "er": "Эрбий",
      "tm": "Тулий",
      "yb": "Иттербий",
      "lu": "Лютеций",
      "hf": "Гафний",
      "ta": "Тантал",
      "w": "Вольфрам",
      "re": "Рений",
      "os": "Осмий",
      "ir": "Иридий",
      "pt": "Платина",
      "au": "Золото",
      "hg": "Ртуть",
      "tl": "Таллий",
      "pb": "Свинец",
      "bi": "Висмут",
      "po": "Полоний",
      "at": "Астат",
      "rn": "Радон",
      "fr": "Франций",
      "ra": "Радий",
      "ac": "Актиний",
      "th": "Торий",
      "pa": "Протактиний",
      "u": "Уран",
      "np": "Нептуний",
      "pu": "Плутоний",
      "am": "Америций",
      "cm": "Кюрий",
      "bk": "Берклий",
      "cf": "Калифорний",
      "es": "Эйнштейний",
      "fm": "Фермий",
      "md": "Менделевий",
      "no": "Нобелий",
      "lr": "Лоуренсий",
      "rf": "Резерфордий",
      "db": "Дубний",
      "sg": "Сиборгий",
      "bh": "Борий",
      "hs": "Хассий",
      "mt": "Мейтнерий",
      "ds": "Дармштадтий",
      "rg": "Рентгений",
      "cn": "Коперниций",
      "nh": "Нихоний",
      "fl": "Флеровий",
      "mc": "Московий",
      "lv": "Ливерморий",
      "ts": "Теннессин",
      "og": "Оганесон"
    },
    "pl": {
      "h": "Wodór",
      "he": "Hel",
      "li": "Lit",
      "be": "Beryl",
      "b": "Bor",
      "c": "Węgiel",
      "n": "Azot",
      "o": "Tlen",
      "f": "Fluor",
      "ne": "Neon",
      "na": "Sód",
      "mg": "Magnez",
      "al": "Glin",
      "si": "Krzem",
      "p": "Fosfor",
      "s": "Siarka",
      "cl": "Chlor",
      "ar": "Argon",
      "k": "Potas",
      "ca": "Wapń",
      "sc": "Skand",
      "ti": "Tytan",
      "v": "Wanad",
      "cr": "Chrom",
      "mn": "Mangan",
      "fe": "Żelazo",
      "co": "Kobalt",
      "ni": "Nikiel",
      "cu": "Miedź",
      "zn": "Cynk",
      "ga": "Gal",
      "ge": "German",
      "as": "Arsen",
      "se": "Selen",
      "br": "Brom",
      "kr": "Krypton",
      "rb": "Rubid",
      "sr": "Stront",
      "y": "Itr",
      "zr": "Cyrkon",
      "nb": "Niob",
      "mo": "Molibden",
      "tc": "Technet",
      "ru": "Ruten",
      "rh": "Rod",
      "pd": "Pallad",
      "ag": "Srebro",
      "cd": "Kadm",
      "in": "Ind",
      "sn": "Cyna",
      "sb": "Antymon",
      "te": "Tellur",
      "i": "Jod",
      "xe": "Ksenon",
      "cs": "Cez",
      "ba": "Bar",
      "la": "Lantan",
      "ce": "Cer",
      "pr": "Prazeodym",
      "nd": "Neodym",
      "pm": "Promet",
      "sm": "Samar",
      "eu": "Europ",
      "gd": "Gadolin",
      "tb": "Terb",
      "dy": "Dysproz",
      "ho": "Holm",
      "er": "Erb",
      "tm": "Tul",
      "yb": "Iterb",
      "lu": "Lutet",
      "hf": "Hafn",
      "ta": "Tantal",
      "w": "Wolfram",
      "re": "Ren",
      "os": "Osm",
      "ir": "Iryd",
      "pt": "Platyna",
      "au": "Złoto",
      "hg": "Rtęć",
      "tl": "Tal",
      "pb": "Ołów",
      "bi": "Bizmut",
      "po": "Polon",
      "at": "Astat",
      "rn": "Radon",
      "fr": "Frans",
      "ra": "Rad",
      "ac": "Aktyn",
      "th": "Tor",
      "pa": "Protaktyn",
      "u": "Uran",
      "np": "Neptun",
      "pu": "Pluton",
      "am": "Ameryk",
      "cm": "Kiur",
      "bk": "Berkel",
      "cf": "Kaliforn",
      "es": "Einstein",
      "fm": "Ferm",
      "md": "Mendelew",
      "no": "Nobel",
      "lr": "Lorens",
      "rf": "Rutherford",
      "db": "Dubn",
      "sg": "Seaborg",
      "bh": "Bohr",
      "hs": "Has",
      "mt": "Meitner",
      "ds": "Darmsztadt",
      "rg": "Roentgen",
      "cn": "Kopernik",
      "nh": "Nihon",
      "fl": "Flerow",
      "mc": "Moskow",
      "lv": "Liwermor",
      "ts": "Tenes",
      "og": "Oganeson"
    }
  };

  class ChemicalElementPage extends HTMLElement {
    static get observedAttributes() {
      return ['symbol', 'language', 'temperature-indicator'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    get symbol() {
      return (this.getAttribute('symbol') || 'h').toLowerCase();
    }

    get language() {
      return this.getAttribute('language') || 'sp';
    }

    get temperatureIndicator() {
      return this.getAttribute('temperature-indicator') || 'c';
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this._render();
      }
    }

    connectedCallback() {
      this._render();
    }

    _localize(key) {
      if (!key) return '';
      const lang = this.language;
      const customLocales = (window.ELEMENT_LOCALES && window.ELEMENT_LOCALES[lang]) || {};
      const defaultLocales = DEFAULT_LOCALES[lang] || DEFAULT_LOCALES.sp;
      return customLocales[key] || defaultLocales[key] || key;
    }

    _localizeElementName(symbol, fallbackName) {
      const lang = this.language;
      const langNames = ELEMENT_NAMES[lang] || ELEMENT_NAMES.sp;
      return (langNames && langNames[symbol]) || fallbackName || symbol.toUpperCase();
    }

    displayTemperaturIndication(kelvin, temperatureIndicator) {
      let value = '-';

      if (typeof kelvin === 'number') {
        if (temperatureIndicator === 'k') {
          value = kelvin;
          if (('' + value).length >= 6) value = ('' + value).substring(0, 6);
          value += ' K';
        } else if (temperatureIndicator === 'f') {
          value = (kelvin - 273) * 1.8 + 32;
          if (('' + value).length >= 6) value = ('' + value).substring(0, 6);
          value += ' °F';
        } else {
          value = kelvin - 273;
          if (('' + value).length >= 6) value = ('' + value).substring(0, 6);
          value += ' °C';
        }
      }

      return value;
    }

    _render() {
      const chemicalElements = window.CHEMICAL_ELEMENTS || {};
      const element = chemicalElements[this.symbol] || {
        name: this.symbol.toUpperCase(),
        group: 'other-nonmetal',
        'atomic-number': '-',
        'atomic-weight': '-',
        electronegativity: '-',
        'boiling-point': null,
        'melting-point': null
      };

      const boiling = this.displayTemperaturIndication(element['boiling-point'], this.temperatureIndicator);
      const melting = this.displayTemperaturIndication(element['melting-point'], this.temperatureIndicator);

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 100%;
            font-size: clamp(13px, 1.1vw, 18px);
            font-family: sans-serif;
            background-color: var(--background-color);
            color: var(--text-color, var(--secondary-color));
          }

          .paper-card {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            padding: clamp(8px, 0.5vw, 14px);
            border-radius: 4px;
            background-color: var(--background-color);
            color: var(--text-color, var(--secondary-color));
            box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
                        0 1px 5px 0 rgba(0, 0, 0, 0.12),
                        0 3px 1px -2px rgba(0, 0, 0, 0.2);
          }

          .element-name {
            font-size: clamp(18px, 1.6vw, 28px);
          }

          .container {
            display: flex;
            align-items: center;
            height: 100%;
            width: 100%;
            gap: 8px;
          }

          .value-field {
            user-select: text;
          }

          .item-3x {
            flex: 3;
            padding: 4px;
            min-width: 100px;
          }

          .item-5x {
            flex: 5;
            padding: clamp(6px, 1vw, 16px);
          }

          table {
            width: 100%;
            border-spacing: 2px;
          }

          td {
            width: 40%;
          }

          .blank {
            height: 6px;
          }

          td.indexer {
            width: 60%;
          }

          @media (max-width: 520px) {
            .container {
              flex-direction: column;
              text-align: left;
            }

            .item-3x {
              width: 130px;
              height: 130px;
              flex: none;
            }

            .item-5x {
              width: 100%;
              box-sizing: border-box;
              padding: 4px 8px;
            }
          }

          chemical-element-visualisation {
            --chemical-element-visualisation-background-color: var(--background-color);
          }

          .not-metal              { color: var(--non-metal-primary-color); }
          .alkali-metal           { color: var(--alkali-metal-primary-color); }
          .alkaline-earth-metal   { color: var(--alkaline-earth-metal-primary-color); }
          .transition-metal       { color: var(--transition-metal-primary-color); }
          .metalloid              { color: var(--metalloid-primary-color); }
          .post-transition-metal  { color: var(--post-transition-metal-primary-color); }
          .other-nonmetal         { color: var(--other-nonmetal-primary-color); }
          .lanthanide             { color: var(--lanthanide-primary-color); }
          .actinide               { color: var(--actinide-primary-color); }
          .halogen                { color: var(--halogen-primary-color); }
          .noble-gas              { color: var(--noble-gas-primary-color); }
        </style>

        <div class="paper-card">
          <div class="container">
            <div class="item-3x">
              <chemical-element-visualisation symbol="${this.symbol}"></chemical-element-visualisation>
            </div>
            <div class="item-5x">
              <div id="details-area">
                <table>
                  <tr>
                    <td class="indexer">
                      <b class="${element.group} element-name">${this._localizeElementName(this.symbol, element.name)}</b>
                    </td>
                    <td>&nbsp;</td>
                  </tr>
                  <tr>
                    <td class="indexer"><b>${this._localize('group')}</b></td>
                    <td><span class="value-field ${element.group}">${this._localize(element.group)}</span></td>
                  </tr>
                  <tr>
                    <td class="indexer blank"></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td class="indexer"><b>${this._localize('atomic number')}</b></td>
                    <td><span class="value-field">${element['atomic-number'] ?? '-'}</span></td>
                  </tr>
                  <tr>
                    <td class="indexer"><b>${this._localize('atomic weight')}</b></td>
                    <td><span class="value-field">${element['atomic-weight'] ?? '-'}</span>&nbsp;u</td>
                  </tr>
                  <tr>
                    <td class="indexer"><b>${this._localize('electronegativity')}</b></td>
                    <td><span class="value-field">${element.electronegativity ?? '-'}</span></td>
                  </tr>
                  <tr>
                    <td class="indexer blank"></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td class="indexer"><b>${this._localize('boiling point')}</b></td>
                    <td><span class="value-field">${boiling}</span></td>
                  </tr>
                  <tr>
                    <td class="indexer"><b>${this._localize('melting point')}</b></td>
                    <td><span class="value-field">${melting}</span></td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  customElements.define('chemical-element-page', ChemicalElementPage);

  // =========================================================================
  // 5. SETTINGS DIALOG (Ventana modal de ajustes)
  // =========================================================================
  const SETTINGS_LOCALES = {
    sp: { settings: 'Ajustes', language: 'Idioma', temperature: 'Temperatura', display: 'Tema', light: 'Claro', dark: 'Oscuro' },
    en: { settings: 'Settings', language: 'Language', temperature: 'Temperature', display: 'Display', light: 'Light', dark: 'Dark' },
    de: { settings: 'Einstellungen', language: 'Sprache', temperature: 'Temperatur', display: 'Anzeige', light: 'Hell', dark: 'Dunkel' },
    fr: { settings: 'Paramètres', language: 'Langue', temperature: 'Température', display: 'Affichage', light: 'Clair', dark: 'Sombre' },
    'pt-br': { settings: 'Configurações', language: 'Idioma', temperature: 'Temperatura', display: 'Tema', light: 'Claro', dark: 'Escuro' },
    tk: { settings: 'Ayarlar', language: 'Dil', temperature: 'Sıcaklık', display: 'Görünüm', light: 'Açık', dark: 'Koyu' },
    hi: { settings: 'सेटिंग्स', language: 'भाषा', temperature: 'तापमान', display: 'थीम', light: 'हल्का', dark: 'गहरा' },
    cz: { settings: 'Nastavení', language: 'Jazyk', temperature: 'Teplota', display: 'Zobrazení', light: 'Světlý', dark: 'Tmavý' },
    ru: { settings: 'Настройки', language: 'Язык', temperature: 'Температура', display: 'Тема', light: 'Светлая', dark: 'Тёмная' },
    pl: { settings: 'Ustawienia', language: 'Język', temperature: 'Temperatura', display: 'Motyw', light: 'Jasny', dark: 'Ciemny' }
  };

  class SettingsDialog extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      const savedLang = localStorage.getItem('language');
      this._language = (savedLang && AVAILABLE_LANGUAGES.includes(savedLang)) ? savedLang : 'sp';
      this._temperatureIndicator = localStorage.getItem('temperatureIndicator') || 'c';
      this._display = localStorage.getItem('display') || 'light';
    }

    connectedCallback() {
      this._render();
      this._emit('language-changed', this._language);
      this._emit('temperature-indicator-changed', this._temperatureIndicator);
      this._emit('display-changed', this._display);
    }

    open() {
      const dialog = this.shadowRoot.querySelector('dialog');
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    }

    _t(key) {
      const dict = SETTINGS_LOCALES[this._language] || SETTINGS_LOCALES.sp;
      return dict[key] || key;
    }

    _emit(eventName, value) {
      this.dispatchEvent(new CustomEvent(eventName, {
        detail: { value },
        bubbles: true,
        composed: true
      }));
    }

    _render() {
      const wasOpen = this.shadowRoot.querySelector('dialog')?.open || false;

      this.shadowRoot.innerHTML = `
        <style>
          dialog {
            box-sizing: border-box;
            width: min(90vw, 380px);
            border: none;
            border-radius: 6px;
            padding: 20px 24px;
            font-family: sans-serif;
            background-color: var(--background-color, #fff);
            color: var(--secondary-color, #000);
            box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
                        0 24px 38px 3px rgba(0, 0, 0, 0.14),
                        0 9px 46px 8px rgba(0, 0, 0, 0.12);
          }

          dialog::backdrop {
            background: rgba(0, 0, 0, 0.5);
          }

          h2 {
            margin: 0 0 16px 0;
            font-size: 1.3rem;
            color: var(--primary-color, #888);
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .field {
            margin-bottom: 14px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          label {
            font-size: 0.85rem;
            color: var(--primary-color, #888);
          }

          select {
            padding: 8px;
            font-size: 0.95rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: var(--background-color, #fff);
            color: var(--secondary-color, #000);
            cursor: pointer;
          }

          .actions {
            margin-top: 20px;
            text-align: right;
          }

          button {
            padding: 8px 18px;
            font-size: 0.9rem;
            border: none;
            border-radius: 4px;
            background-color: var(--primary-color, #888);
            color: var(--background-color, #fff);
            cursor: pointer;
          }

          button:hover {
            opacity: 0.9;
          }
        </style>

        <dialog>
          <h2>${this._t('settings')}</h2>

          <language-selection id="lang-select" selected="${this._language}" language="${this._language}"></language-selection>

          <div class="field">
            <label for="temp-select">${this._t('temperature')}</label>
            <select id="temp-select">
              <option value="k" ${this._temperatureIndicator === 'k' ? 'selected' : ''}>Kelvin (K)</option>
              <option value="f" ${this._temperatureIndicator === 'f' ? 'selected' : ''}>Fahrenheit (°F)</option>
              <option value="c" ${this._temperatureIndicator === 'c' ? 'selected' : ''}>Celsius (°C)</option>
            </select>
          </div>

          <div class="field">
            <label for="display-select">${this._t('display')}</label>
            <select id="display-select">
              <option value="light" ${this._display === 'light' ? 'selected' : ''}>${this._t('light')}</option>
              <option value="dark" ${this._display === 'dark' ? 'selected' : ''}>${this._t('dark')}</option>
            </select>
          </div>

          <div class="actions">
            <button id="ok-btn" autofocus>Ok</button>
          </div>
        </dialog>
      `;

      const dialog = this.shadowRoot.querySelector('dialog');
      if (wasOpen) dialog.showModal();

      this.shadowRoot.querySelector('#lang-select').addEventListener('selected-changed', (e) => {
        this._language = e.detail.value;
        localStorage.setItem('language', this._language);
        this._emit('language-changed', this._language);
        this._render();
      });

      this.shadowRoot.querySelector('#temp-select').addEventListener('change', (e) => {
        this._temperatureIndicator = e.target.value;
        localStorage.setItem('temperatureIndicator', this._temperatureIndicator);
        this._emit('temperature-indicator-changed', this._temperatureIndicator);
      });

      this.shadowRoot.querySelector('#display-select').addEventListener('change', (e) => {
        this._display = e.target.value;
        localStorage.setItem('display', this._display);
        this._emit('display-changed', this._display);
      });

      this.shadowRoot.querySelector('#ok-btn').addEventListener('click', () => {
        dialog.close();
      });
    }
  }

  customElements.define('settings-dialog', SettingsDialog);

  // =========================================================================
  // 6. PERIODIC TABLE CONTENT (Cuadrícula completa de la tabla periódica)
  // =========================================================================
  const SIZE_X = 18;
  const SIZE_Y = 9;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const ELEMENT_GRID = [
    ['h', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'he'],
    ['li', 'be', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'b', 'c', 'n', 'o', 'f', 'ne'],
    ['na', 'mg', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'al', 'si', 'p', 's', 'cl', 'ar'],
    ['k', 'ca', 'sc', 'ti', 'v', 'cr', 'mn', 'fe', 'co', 'ni', 'cu', 'zn', 'ga', 'ge', 'as', 'se', 'br', 'kr'],
    ['rb', 'sr', 'y', 'zr', 'nb', 'mo', 'tc', 'ru', 'rh', 'pd', 'ag', 'cd', 'in', 'sn', 'sb', 'te', 'i', 'xe'],
    ['cs', 'ba', '-', 'hf', 'ta', 'w', 're', 'os', 'ir', 'pt', 'au', 'hg', 'tl', 'pb', 'bi', 'po', 'at', 'rn'],
    ['fr', 'ra', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', '-', '-', 'la', 'ce', 'pr', 'nd', 'pm', 'sm', 'eu', 'gd', 'tb', 'dy', 'ho', 'er', 'tm', 'yb', 'lu'],
    ['-', '-', '-', 'ac', 'th', 'pa', 'u', 'np', 'pu', 'am', 'cm', 'bk', 'cf', 'es', 'fm', 'md', 'no', 'lr']
  ];

  class PeriodicTableContent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      this._selectedElementSymbol = (localStorage.getItem('selectedElementSymbol') || 'h').toLowerCase();
      this.positionToElementSymbol = ELEMENT_GRID;
      this.elementSymbolToPosition = {};

      for (let x = 0; x < SIZE_X; x++) {
        for (let y = 0; y < SIZE_Y; y++) {
          const symbol = this.positionToElementSymbol[y][x];
          if (symbol !== '-') {
            this.elementSymbolToPosition[symbol] = { x, y };
          }
        }
      }

      this._onKeyDown = this._onKeyDown.bind(this);
    }

    get selectedElementSymbol() {
      return this._selectedElementSymbol;
    }

    set selectedElementSymbol(value) {
      this._selectedElementSymbol = (value || 'h').toLowerCase();
      localStorage.setItem('selectedElementSymbol', this._selectedElementSymbol);
      this._syncSelectedSymbol();
    }

    connectedCallback() {
      const savedLang = localStorage.getItem('language');
      const initialLang = (savedLang && AVAILABLE_LANGUAGES.includes(savedLang)) ? savedLang : 'sp';
      const initialTemp = localStorage.getItem('temperatureIndicator') || 'c';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            background-color: var(--background-color);
            color: var(--primary-color);
          }

          #mobile-detail-slot {
            display: none;
            padding: 8px 10px 12px;
          }

          .table-scroll-wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 12px;
          }

          .table-container {
            width: 100%;
            height: calc(100vw * (10.0 / 18.0));
            display: grid;
            grid-auto-rows: 1fr;
            grid-template-columns: repeat(18, 1fr);
            gap: 5px 5px;
            grid-template-areas:
              ". . . p p p p p p p p . . . . . . ."
              ". . . p p p p p p p p . . . . . . ."
              ". . . p p p p p p p p . . . . . . ."
              ". . . . . . . . . . . . . . . . . ."
              ". . . . . . . . . . . . . . . . . ."
              ". . . . . . . . . . . . . . . . . ."
              ". . . . . . . . . . . . . . . . . ."
              ". . . . . . . . . . . . . . . . . ."
              ". . . . . . . . . . . . . . . . . ."
              ". . . . . . . . . . . . . . . . . .";
          }

          .grid-spacer {
            display: none;
            grid-area: p;
          }

          @media (max-width: 900px) {
            #mobile-detail-slot {
              display: block;
            }

            .grid-spacer {
              display: block;
            }

            .table-container {
              min-width: 760px;
              height: 430px;
              gap: 4px;
              padding: 0 8px;
              box-sizing: border-box;
            }

            .index {
              font-size: 11px !important;
            }
          }

          chemical-element-page {
            grid-area: p;
            height: 100%;
            width: 100%;
          }

          chemical-element {
            width: 100%;
            height: 100%;
            cursor: pointer;
            display: block;
          }

          .align-right {
            text-align: right;
            padding: 8px 12px 0;
          }

          #settings-icon {
            cursor: pointer;
            width: 24px;
            height: 24px;
            fill: var(--primary-color);
          }

          .index {
            position: absolute;
            bottom: 0;
            width: 100%;
            font-size: 1vw;
            text-align: center;
            color: #cfd8dc;
            border-bottom: 1px ridge #cfd8dc;
          }

          .item {
            position: relative;
          }

          .card {
            width: 100%;
            height: 100%;
            font-family: sans-serif;
            font-size: 1em;
            color: white;
            text-align: center;
            border-radius: 2px;
            box-shadow: 0 2px 2px rgba(0, 0, 0, 0.14);
          }

          .card.lanthanide {
            background-color: var(--lanthanide-background-color);
          }

          .card.actinide {
            background-color: var(--actinide-background-color);
          }
        </style>

        <settings-dialog id="settings-dialog"></settings-dialog>

        <div class="align-right">
          <svg id="settings-icon" viewBox="0 0 24 24" title="Ajustes">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </div>

        <div id="mobile-detail-slot"></div>

        <div class="table-scroll-wrapper">
        <div class="table-container" id="table-container">
          <div class="grid-spacer"></div>
          <div class="item"><div class="index">A I</div></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"><div class="index">A VIII</div></div>

          <div class="item"><chemical-element symbol="h"></chemical-element></div>
          <div class="item"><div class="index">A II</div></div>
          <div class="item"></div>

          <chemical-element-page
            symbol="${this._selectedElementSymbol}"
            language="${initialLang}"
            temperature-indicator="${initialTemp}">
          </chemical-element-page>

          <div class="item"></div>
          <div class="item"><div class="index">A III</div></div>
          <div class="item"><div class="index">A IV</div></div>
          <div class="item"><div class="index">A V</div></div>
          <div class="item"><div class="index">A VI</div></div>
          <div class="item"><div class="index">A VII</div></div>
          <div class="item"><chemical-element symbol="he"></chemical-element></div>

          <div class="item"><chemical-element symbol="li"></chemical-element></div>
          <div class="item"><chemical-element symbol="be"></chemical-element></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"><chemical-element symbol="b"></chemical-element></div>
          <div class="item"><chemical-element symbol="c"></chemical-element></div>
          <div class="item"><chemical-element symbol="n"></chemical-element></div>
          <div class="item"><chemical-element symbol="o"></chemical-element></div>
          <div class="item"><chemical-element symbol="f"></chemical-element></div>
          <div class="item"><chemical-element symbol="ne"></chemical-element></div>

          <div class="item"><chemical-element symbol="na"></chemical-element></div>
          <div class="item"><chemical-element symbol="mg"></chemical-element></div>
          <div class="item"><div class="index">B III</div></div>
          <div class="item"><div class="index">B IV</div></div>
          <div class="item"><div class="index">B V</div></div>
          <div class="item"><div class="index">B VI</div></div>
          <div class="item"><div class="index">B VII</div></div>
          <div class="item"><div class="index">B VIII</div></div>
          <div class="item"><div class="index">B VIII</div></div>
          <div class="item"><div class="index">B VIII</div></div>
          <div class="item"><div class="index">B I</div></div>
          <div class="item"><div class="index">B II</div></div>
          <div class="item"><chemical-element symbol="al"></chemical-element></div>
          <div class="item"><chemical-element symbol="si"></chemical-element></div>
          <div class="item"><chemical-element symbol="p"></chemical-element></div>
          <div class="item"><chemical-element symbol="s"></chemical-element></div>
          <div class="item"><chemical-element symbol="cl"></chemical-element></div>
          <div class="item"><chemical-element symbol="ar"></chemical-element></div>

          <div class="item"><chemical-element symbol="k"></chemical-element></div>
          <div class="item"><chemical-element symbol="ca"></chemical-element></div>
          <div class="item"><chemical-element symbol="sc"></chemical-element></div>
          <div class="item"><chemical-element symbol="ti"></chemical-element></div>
          <div class="item"><chemical-element symbol="v"></chemical-element></div>
          <div class="item"><chemical-element symbol="cr"></chemical-element></div>
          <div class="item"><chemical-element symbol="mn"></chemical-element></div>
          <div class="item"><chemical-element symbol="fe"></chemical-element></div>
          <div class="item"><chemical-element symbol="co"></chemical-element></div>
          <div class="item"><chemical-element symbol="ni"></chemical-element></div>
          <div class="item"><chemical-element symbol="cu"></chemical-element></div>
          <div class="item"><chemical-element symbol="zn"></chemical-element></div>
          <div class="item"><chemical-element symbol="ga"></chemical-element></div>
          <div class="item"><chemical-element symbol="ge"></chemical-element></div>
          <div class="item"><chemical-element symbol="as"></chemical-element></div>
          <div class="item"><chemical-element symbol="se"></chemical-element></div>
          <div class="item"><chemical-element symbol="br"></chemical-element></div>
          <div class="item"><chemical-element symbol="kr"></chemical-element></div>

          <div class="item"><chemical-element symbol="rb"></chemical-element></div>
          <div class="item"><chemical-element symbol="sr"></chemical-element></div>
          <div class="item"><chemical-element symbol="y"></chemical-element></div>
          <div class="item"><chemical-element symbol="zr"></chemical-element></div>
          <div class="item"><chemical-element symbol="nb"></chemical-element></div>
          <div class="item"><chemical-element symbol="mo"></chemical-element></div>
          <div class="item"><chemical-element symbol="tc"></chemical-element></div>
          <div class="item"><chemical-element symbol="ru"></chemical-element></div>
          <div class="item"><chemical-element symbol="rh"></chemical-element></div>
          <div class="item"><chemical-element symbol="pd"></chemical-element></div>
          <div class="item"><chemical-element symbol="ag"></chemical-element></div>
          <div class="item"><chemical-element symbol="cd"></chemical-element></div>
          <div class="item"><chemical-element symbol="in"></chemical-element></div>
          <div class="item"><chemical-element symbol="sn"></chemical-element></div>
          <div class="item"><chemical-element symbol="sb"></chemical-element></div>
          <div class="item"><chemical-element symbol="te"></chemical-element></div>
          <div class="item"><chemical-element symbol="i"></chemical-element></div>
          <div class="item"><chemical-element symbol="xe"></chemical-element></div>

          <div class="item"><chemical-element symbol="cs"></chemical-element></div>
          <div class="item"><chemical-element symbol="ba"></chemical-element></div>
          <div class="item"><div class="card lanthanide">&nbsp;</div></div>
          <div class="item"><chemical-element symbol="hf"></chemical-element></div>
          <div class="item"><chemical-element symbol="ta"></chemical-element></div>
          <div class="item"><chemical-element symbol="w"></chemical-element></div>
          <div class="item"><chemical-element symbol="re"></chemical-element></div>
          <div class="item"><chemical-element symbol="os"></chemical-element></div>
          <div class="item"><chemical-element symbol="ir"></chemical-element></div>
          <div class="item"><chemical-element symbol="pt"></chemical-element></div>
          <div class="item"><chemical-element symbol="au"></chemical-element></div>
          <div class="item"><chemical-element symbol="hg"></chemical-element></div>
          <div class="item"><chemical-element symbol="tl"></chemical-element></div>
          <div class="item"><chemical-element symbol="pb"></chemical-element></div>
          <div class="item"><chemical-element symbol="bi"></chemical-element></div>
          <div class="item"><chemical-element symbol="po"></chemical-element></div>
          <div class="item"><chemical-element symbol="at"></chemical-element></div>
          <div class="item"><chemical-element symbol="rn"></chemical-element></div>

          <div class="item"><chemical-element symbol="fr"></chemical-element></div>
          <div class="item"><chemical-element symbol="ra"></chemical-element></div>
          <div class="item"><div class="card actinide">&nbsp;</div></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>

          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"><chemical-element symbol="la"></chemical-element></div>
          <div class="item"><chemical-element symbol="ce"></chemical-element></div>
          <div class="item"><chemical-element symbol="pr"></chemical-element></div>
          <div class="item"><chemical-element symbol="nd"></chemical-element></div>
          <div class="item"><chemical-element symbol="pm"></chemical-element></div>
          <div class="item"><chemical-element symbol="sm"></chemical-element></div>
          <div class="item"><chemical-element symbol="eu"></chemical-element></div>
          <div class="item"><chemical-element symbol="gd"></chemical-element></div>
          <div class="item"><chemical-element symbol="tb"></chemical-element></div>
          <div class="item"><chemical-element symbol="dy"></chemical-element></div>
          <div class="item"><chemical-element symbol="ho"></chemical-element></div>
          <div class="item"><chemical-element symbol="er"></chemical-element></div>
          <div class="item"><chemical-element symbol="tm"></chemical-element></div>
          <div class="item"><chemical-element symbol="yb"></chemical-element></div>
          <div class="item"><chemical-element symbol="lu"></chemical-element></div>

          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"><chemical-element symbol="ac"></chemical-element></div>
          <div class="item"><chemical-element symbol="th"></chemical-element></div>
          <div class="item"><chemical-element symbol="pa"></chemical-element></div>
          <div class="item"><chemical-element symbol="u"></chemical-element></div>
          <div class="item"><chemical-element symbol="np"></chemical-element></div>
          <div class="item"><chemical-element symbol="pu"></chemical-element></div>
          <div class="item"><chemical-element symbol="am"></chemical-element></div>
          <div class="item"><chemical-element symbol="cm"></chemical-element></div>
          <div class="item"><chemical-element symbol="bk"></chemical-element></div>
          <div class="item"><chemical-element symbol="cf"></chemical-element></div>
          <div class="item"><chemical-element symbol="es"></chemical-element></div>
          <div class="item"><chemical-element symbol="fm"></chemical-element></div>
          <div class="item"><chemical-element symbol="md"></chemical-element></div>
          <div class="item"><chemical-element symbol="no"></chemical-element></div>
          <div class="item"><chemical-element symbol="lr"></chemical-element></div>
        </div>
        </div>
      `;

      this._syncSelectedSymbol();

      this.shadowRoot.querySelectorAll('chemical-element').forEach((el) => {
        el.addEventListener('chemical-element-selected', (e) => {
          if (e.detail && e.detail.symbol) {
            this.selectedElementSymbol = e.detail.symbol;
          }
        });
      });

      this.shadowRoot.querySelectorAll('chemical-element-page').forEach((page) => {
        page.addEventListener('back-link-clicked', () => {
          this.selectedElementSymbol = '0';
        });
      });

      const settingsDialog = this.shadowRoot.querySelector('#settings-dialog');
      const page = this.shadowRoot.querySelector('chemical-element-page');

      this.shadowRoot.querySelector('#settings-icon').addEventListener('click', () => {
        if (settingsDialog && typeof settingsDialog.open === 'function') {
          settingsDialog.open();
        }
      });

      if (settingsDialog) {
        settingsDialog.addEventListener('css-variable-changed', (e) => {
          if (e.detail) {
            this.style.setProperty(e.detail.key, e.detail.value);
          }
        });

        settingsDialog.addEventListener('language-changed', (e) => {
          if (page) page.setAttribute('language', e.detail.value);
        });

        settingsDialog.addEventListener('temperature-indicator-changed', (e) => {
          if (page) page.setAttribute('temperature-indicator', e.detail.value);
        });
      }

      // Mueve el panel de detalles arriba de la tabla en pantallas móviles
      this._mobileQuery = window.matchMedia('(max-width: 900px)');
      this._handleResponsiveLayout = () => {
        const mobileSlot = this.shadowRoot.querySelector('#mobile-detail-slot');
        const tableContainer = this.shadowRoot.querySelector('#table-container');
        if (!page || !mobileSlot || !tableContainer) return;

        if (this._mobileQuery.matches) {
          if (page.parentElement !== mobileSlot) {
            mobileSlot.appendChild(page);
          }
        } else {
          if (page.parentElement !== tableContainer) {
            tableContainer.appendChild(page);
          }
        }
      };
      this._handleResponsiveLayout();
      this._mobileQuery.addEventListener('change', this._handleResponsiveLayout);

      document.addEventListener('keydown', this._onKeyDown);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onKeyDown);
      if (this._mobileQuery && this._handleResponsiveLayout) {
        this._mobileQuery.removeEventListener('change', this._handleResponsiveLayout);
      }
    }

    _syncSelectedSymbol() {
      if (!this.shadowRoot) return;
      this.shadowRoot.querySelectorAll('chemical-element').forEach((el) => {
        el.setAttribute('selected-symbol', this._selectedElementSymbol);
      });
      const page = this.shadowRoot.querySelector('chemical-element-page');
      if (page) {
        page.setAttribute('symbol', this._selectedElementSymbol);
      }
    }

    _onKeyDown(e) {
      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          this._changeSelectedElementByPosition(-1, 0);
          break;
        case 'arrowright':
        case 'd':
          this._changeSelectedElementByPosition(1, 0);
          break;
        case 'arrowup':
        case 'w':
          this._changeSelectedElementByPosition(0, -1);
          break;
        case 'arrowdown':
        case 's':
          this._changeSelectedElementByPosition(0, 1);
          break;
      }
    }

    _changeSelectedElementByPosition(deltaX, deltaY) {
      const position = this.elementSymbolToPosition[this.selectedElementSymbol];
      if (!position) return;

      const nextPosition = {
        x: clamp(position.x + deltaX, 0, SIZE_X - 1),
        y: clamp(position.y + deltaY, 0, SIZE_Y - 1)
      };

      const horizontalBridges = [
        { left: 'h', right: 'he' },
        { left: 'be', right: 'b' },
        { left: 'mg', right: 'al' },
        { left: 'he', right: 'li' },
        { left: 'ne', right: 'na' },
        { left: 'ar', right: 'k' },
        { left: 'kr', right: 'rb' },
        { left: 'xe', right: 'cs' },
        { left: 'rn', right: 'fr' },
        { left: 'ba', right: 'la' },
        { left: 'lu', right: 'hf' },
        { left: 'ra', right: 'ac' }
      ];

      if (deltaX === 1) {
        for (const bridge of horizontalBridges) {
          if (this.selectedElementSymbol === bridge.left) {
            this.selectedElementSymbol = bridge.right;
            return;
          }
        }
      }

      if (deltaX === -1) {
        for (const bridge of horizontalBridges) {
          if (this.selectedElementSymbol === bridge.right) {
            this.selectedElementSymbol = bridge.left;
            return;
          }
        }
      }

      if (this.selectedElementSymbol === 'y' && deltaX === 0 && deltaY === 1) {
        this.selectedElementSymbol = 'la';
        return;
      }

      if (this.positionToElementSymbol[nextPosition.y][nextPosition.x] !== '-') {
        this.selectedElementSymbol = this.positionToElementSymbol[nextPosition.y][nextPosition.x];
      } else {
        const afterNextPosition = {
          x: clamp(nextPosition.x + deltaX, 0, SIZE_X - 1),
          y: clamp(nextPosition.y + deltaY, 0, SIZE_Y - 1)
        };

        if (this.positionToElementSymbol[afterNextPosition.y][afterNextPosition.x] !== '-') {
          this.selectedElementSymbol = this.positionToElementSymbol[afterNextPosition.y][afterNextPosition.x];
        }
      }
    }
  }

  customElements.define('periodic-table-content', PeriodicTableContent);

  // =========================================================================
  // 7. PERIODIC TABLE (Componente raíz con pantalla de carga)
  // =========================================================================
  class PeriodicTable extends HTMLElement {
    static get observedAttributes() {
      return ['display'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._fullscreen = false;
      this._display = localStorage.getItem('display') || 'light';
    }

    get display() {
      return this._display;
    }

    set display(value) {
      if (this._display !== value) {
        this._display = value;
        this._updateCSSVariables();
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'display' && oldValue !== newValue) {
        this.display = newValue;
      }
    }

    connectedCallback() {
      this._updateCSSVariables();
      const randomSymbol = this._pickRandomElementSymbol();

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: 'Roboto', system-ui, -apple-system, sans-serif;
          }

          h1 {
            color: var(--primary-color);
          }

          #chemical-element-visualisation-container {
            text-align: center;
            width: min(80%, 260px);
          }

          #loading-bar-container {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          #periodic-table-content-container {
            height: 100%;
            display: none;
          }

          chemical-element-visualisation {
            --chemical-element-visualisation-background-color: var(--background-color);
          }
        </style>

        <div id="loading-bar-container">
          <div id="chemical-element-visualisation-container">
            <h1>Elementos</h1>
            <chemical-element-visualisation symbol="${randomSymbol}"></chemical-element-visualisation>
          </div>
        </div>

        <div id="periodic-table-content-container">
          <periodic-table-content></periodic-table-content>
        </div>
      `;

      const loadingContainer = this.shadowRoot.querySelector('#loading-bar-container');
      const contentContainer = this.shadowRoot.querySelector('#periodic-table-content-container');
      const tableContent = this.shadowRoot.querySelector('periodic-table-content');

      tableContent.addEventListener('display-changed', (e) => {
        if (e.detail && e.detail.value) {
          this.display = e.detail.value;
        }
      });

      loadingContainer.animate(
        [{ opacity: 0.0 }, { opacity: 1.0 }],
        { duration: 500, fill: 'forwards' }
      );

      setTimeout(() => {
        const animation = loadingContainer.animate(
          [{ opacity: 1.0 }, { opacity: 0.0 }],
          { duration: 500, fill: 'forwards' }
        );

        animation.onfinish = () => {
          loadingContainer.style.display = 'none';
          contentContainer.style.display = 'block';

          contentContainer.animate(
            [{ opacity: 0.0 }, { opacity: 1.0 }],
            { duration: 500, fill: 'forwards' }
          );
        };
      }, 2500);
    }

    _pickRandomElementSymbol() {
      const symbols = [
        'h', 'he',
        'li', 'be', 'b', 'c', 'n', 'o', 'f', 'ne',
        'na', 'mg', 'al', 'si', 'p', 's', 'cl', 'ar',
        'fe', 'au', 'cu', 'pt', 'u', 'ag', 'zn', 'ti'
      ];

      return symbols[Math.floor(Math.random() * symbols.length)];
    }

    _updateCSSVariables() {
      if (this.display === 'light') {
        document.documentElement.style.setProperty('--primary-color', '#888');
        document.documentElement.style.setProperty('--secondary-color', '#000');
        document.documentElement.style.setProperty('--background-color', '#fff');
      }

      if (this.display === 'dark') {
        document.documentElement.style.setProperty('--primary-color', '#eee');
        document.documentElement.style.setProperty('--secondary-color', '#fff');
        document.documentElement.style.setProperty('--background-color', '#333');
      }
    }
  }

  customElements.define('periodic-table', PeriodicTable);
})();
