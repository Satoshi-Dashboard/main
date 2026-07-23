/**
 * Capital city coordinates for each currency used in S03_MultiCurrencyBoard.
 * Used to position MapLibre markers and flyTo on currency selection.
 *
 * Format: { [currencyCode]: [longitude, latitude] }
 */
export const CURRENCY_COORDS = {
  // ── Major / G10 ──────────────────────────────────────────────────────────
  USD: [ -77.0369,  38.9072],   // Washington D.C.
  EUR: [   2.3522,  48.8566],   // Paris (EU centroid)
  GBP: [  -0.1278,  51.5074],   // London
  JPY: [ 139.6917,  35.6895],   // Tokyo
  CNY: [ 116.4074,  39.9042],   // Beijing
  INR: [  77.2090,  28.6139],   // New Delhi
  KRW: [ 126.9780,  37.5665],   // Seoul
  CAD: [ -75.6972,  45.4215],   // Ottawa
  AUD: [ 149.1281, -35.2820],   // Canberra
  CHF: [   7.4474,  46.9481],   // Bern

  // ── Americas ──────────────────────────────────────────────────────────────
  BRL: [ -47.9292, -15.7801],   // Brasília
  MXN: [ -99.1332,  19.4326],   // Mexico City
  ARS: [ -58.3816, -34.6037],   // Buenos Aires
  CLP: [ -70.6483, -33.4489],   // Santiago
  COP: [ -74.0721,   4.7110],   // Bogotá
  PEN: [ -77.0428, -12.0464],   // Lima
  UYU: [ -56.1645, -34.9011],   // Montevideo
  BOB: [ -68.1193, -16.5000],   // La Paz
  PYG: [ -57.6359, -25.2867],   // Asunción
  DOP: [ -69.9312,  18.4861],   // Santo Domingo
  GTQ: [ -90.5328,  14.6349],   // Guatemala City
  CRC: [ -84.0879,   9.9281],   // San José

  // ── Europe ────────────────────────────────────────────────────────────────
  SEK: [  18.0686,  59.3293],   // Stockholm
  NOK: [  10.7522,  59.9139],   // Oslo
  DKK: [  12.5683,  55.6761],   // Copenhagen
  PLN: [  21.0122,  52.2297],   // Warsaw
  CZK: [  14.4378,  50.0755],   // Prague
  HUF: [  19.0402,  47.4979],   // Budapest
  RON: [  26.1025,  44.4268],   // Bucharest
  ISK: [ -21.9426,  64.1466],   // Reykjavík
  TRY: [  32.8597,  39.9334],   // Ankara
  UAH: [  30.5234,  50.4501],   // Kyiv
  BGN: [  23.3219,  42.6977],   // Sofia
  RSD: [  20.4612,  44.8047],   // Belgrade
  HRK: [  15.9819,  45.8150],   // Zagreb

  // ── Middle East / Gulf ────────────────────────────────────────────────────
  ILS: [  35.2137,  31.7683],   // Jerusalem
  SAR: [  46.6753,  24.6877],   // Riyadh
  AED: [  54.3705,  24.4539],   // Abu Dhabi
  KWD: [  47.9783,  29.3759],   // Kuwait City
  QAR: [  51.5310,  25.2854],   // Doha
  OMR: [  58.5922,  23.5880],   // Muscat
  BHD: [  50.5860,  26.2154],   // Manama
  JOD: [  35.9106,  31.9539],   // Amman
  IQD: [  44.3661,  33.3152],   // Baghdad
  IRR: [  51.3890,  35.6892],   // Tehran

  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  SGD: [ 103.8198,   1.3521],   // Singapore
  HKD: [ 114.1694,  22.3193],   // Hong Kong
  TWD: [ 121.5654,  25.0330],   // Taipei
  MYR: [ 101.6869,   3.1390],   // Kuala Lumpur
  IDR: [ 106.8456,  -6.2088],   // Jakarta
  THB: [ 100.5018,  13.7563],   // Bangkok
  PHP: [ 120.9842,  14.5995],   // Manila
  NZD: [ 174.7633, -36.8485],   // Auckland
  PKR: [  73.0479,  33.7292],   // Islamabad
  BDT: [  90.4125,  23.8103],   // Dhaka
  LKR: [  79.8612,   6.9271],   // Colombo
  NPR: [  85.3240,  27.7172],   // Kathmandu
  VND: [ 105.8412,  21.0278],   // Hanoi
  KHR: [ 104.9160,  11.5564],   // Phnom Penh
  MMK: [  96.0785,  16.8409],   // Yangon
  AFN: [  69.1713,  34.5281],   // Kabul

  // ── Central Asia / Caucasus ───────────────────────────────────────────────
  KZT: [  71.4598,  51.1801],   // Astana
  UZS: [  69.2401,  41.2995],   // Tashkent
  GEL: [  44.7916,  41.6938],   // Tbilisi
  AZN: [  49.8671,  40.4093],   // Baku
  MNT: [ 106.9057,  47.9077],   // Ulaanbaatar

  // ── Russia ────────────────────────────────────────────────────────────────
  RUB: [  37.6173,  55.7558],   // Moscow

  // ── Africa ────────────────────────────────────────────────────────────────
  ZAR: [  28.0473, -26.2041],   // Pretoria
  NGN: [   7.4898,   9.0765],   // Abuja
  EGP: [  31.2357,  30.0444],   // Cairo
  KES: [  36.8219,  -1.2921],   // Nairobi
  GHS: [  -0.1870,   5.5502],   // Accra
  TZS: [  35.7497,  -6.1722],   // Dodoma
  ETB: [  38.7578,   9.0092],   // Addis Ababa
  MAD: [  -6.8498,  33.9716],   // Rabat
  DZD: [   3.0588,  36.7372],   // Algiers
  TND: [  10.1815,  36.8190],   // Tunis
  ZMW: [  28.3228, -15.4167],   // Lusaka
  BWP: [  25.9231, -24.6541],   // Gaborone
  MUR: [  57.5012, -20.1609],   // Port Louis
  XOF: [ -17.4677,  14.6928],   // Dakar (West African CFA)
};
