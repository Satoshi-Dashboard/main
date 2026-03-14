export const POPULATION_FALLBACK = {
  US: 335, DE: 84, FR: 68, GB: 68, CA: 40, NL: 17.9, CH: 8.7,
  RU: 145, AU: 26, ES: 47, KR: 52, CZ: 10.9, SE: 10.5, IT: 60,
  AT: 9.1, FI: 5.5, NO: 5.5, DK: 5.9, PL: 37.7, BE: 11.6,
  SG: 6, HK: 7.5, JP: 125, CN: 1410, IN: 1440, BR: 215,
  ZA: 62, MX: 130, AR: 46, CL: 19.6, CO: 52, PE: 33,
  TR: 85, UA: 43, RO: 19, HU: 9.7, GR: 10.4, PT: 10.2,
  IL: 9.7, AE: 9.9, SA: 36, EG: 105, NG: 220, KE: 56,
  TH: 72, ID: 275, MY: 33, PH: 115, VN: 98, PK: 230,
  BD: 170, TW: 23.6, NZ: 5.1, IE: 5.1, LU: 0.66, IS: 0.37,
  LT: 2.8, LV: 1.8, EE: 1.3, SK: 5.5, SI: 2.1, HR: 3.9,
  BG: 6.5, RS: 6.8, MD: 2.5, GE: 3.7, AM: 3, AZ: 10.1,
  KZ: 19.5, UZ: 36, BY: 9.4, CY: 1.2, MT: 0.54,
};

export const ISO_COUNTRY_NAMES = {
  AD: 'Andorra', AE: 'UAE', AG: 'Antigua & Barbuda',
  AI: 'Anguilla', AW: 'Aruba', BB: 'Barbados',
  BH: 'Bahrain', BL: 'St. Barthelemy', BM: 'Bermuda',
  BN: 'Brunei', BQ: 'Bonaire', BS: 'Bahamas',
  BT: 'Bhutan', BV: 'Bouvet Island', CC: 'Cocos Islands',
  CK: 'Cook Islands', CV: 'Cape Verde', CW: 'Curacao',
  CX: 'Christmas Island', DJ: 'Djibouti', DM: 'Dominica',
  EH: 'W. Sahara', FJ: 'Fiji', FK: 'Falkland Islands',
  FM: 'Micronesia', FO: 'Faroe Islands', GD: 'Grenada',
  GG: 'Guernsey', GI: 'Gibraltar', GL: 'Greenland',
  GP: 'Guadeloupe', GQ: 'Eq. Guinea', GU: 'Guam',
  GW: 'Guinea-Bissau', HK: 'Hong Kong', HM: 'Heard Island',
  IM: 'Isle of Man', IO: 'British Indian Ocean',
  JE: 'Jersey', KI: 'Kiribati', KM: 'Comoros',
  KN: 'St. Kitts & Nevis', KY: 'Cayman Islands',
  LC: 'St. Lucia', LI: 'Liechtenstein', MF: 'St. Martin',
  MH: 'Marshall Islands', MO: 'Macao', MP: 'N. Mariana Islands',
  MQ: 'Martinique', MS: 'Montserrat', MT: 'Malta',
  MU: 'Mauritius', MV: 'Maldives', NF: 'Norfolk Island',
  NR: 'Nauru', NU: 'Niue', PF: 'French Polynesia',
  PM: 'St. Pierre & Miquelon', PN: 'Pitcairn', PR: 'Puerto Rico',
  PW: 'Palau', RE: 'Reunion', SC: 'Seychelles',
  SH: 'St. Helena', SJ: 'Svalbard', SM: 'San Marino',
  SS: 'South Sudan', ST: 'Sao Tome & Principe', SX: 'Sint Maarten',
  TC: 'Turks & Caicos', TF: 'French S. Territories',
  TK: 'Tokelau', TL: 'Timor-Leste', TO: 'Tonga',
  TV: 'Tuvalu', UM: 'U.S. Minor Islands',
  VA: 'Vatican', VC: 'St. Vincent', VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands', VU: 'Vanuatu', WF: 'Wallis & Futuna',
  WS: 'Samoa', XK: 'Kosovo', YT: 'Mayotte',
};

export const COUNTRY_NAME_ALIASES = {
  'united states': 'united states of america',
  'russian federation': 'russia',
  'korea the republic of': 'south korea',
  'czechia': 'czech republic',
  'n a': 'unknown',
};

export function getFeatureCountryCode(feature) {
  const primary = String(feature?.properties?.ISO_A2 || feature?.properties?.iso_a2 || feature?.properties?.['ISO3166-1-Alpha-2'] || '').toUpperCase();
  const fallback = String(feature?.properties?.ISO_A2_EH || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(primary)) return primary;
  if (/^[A-Z]{2}$/.test(fallback)) return fallback;
  return primary || fallback;
}

export function getFeatureCountryName(feature, idx) {
  return (
    feature?.properties?.ADMIN
    || feature?.properties?.NAME
    || feature?.properties?.name
    || `Country ${idx + 1}`
  );
}

export function normalizeCountryName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\(the\s+/gi, '(')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

export function isUnknownCountryValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized === 'n/a' || normalized === 'na' || normalized === 'unknown';
}
