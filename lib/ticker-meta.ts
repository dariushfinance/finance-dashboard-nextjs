export interface TickerMeta {
  name: string
  sector: string
  industry: string
  country: string
  region: string
  marketCap: 'Mega' | 'Large' | 'Mid' | 'Small' | 'Nano' | 'N/A'
  assetType: 'Stock' | 'ETF' | 'Crypto' | 'REIT' | 'Fund'
  currency: string
}

const META: Record<string, TickerMeta> = {
  // ── US Technology ────────────────────────────────────────────
  AAPL:  { name: 'Apple',              sector: 'Technology',             industry: 'Consumer Electronics',   country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  MSFT:  { name: 'Microsoft',          sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  NVDA:  { name: 'Nvidia',             sector: 'Technology',             industry: 'Semiconductors',         country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  AVGO:  { name: 'Broadcom',           sector: 'Technology',             industry: 'Semiconductors',         country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  AMD:   { name: 'AMD',                sector: 'Technology',             industry: 'Semiconductors',         country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  INTC:  { name: 'Intel',              sector: 'Technology',             industry: 'Semiconductors',         country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  QCOM:  { name: 'Qualcomm',           sector: 'Technology',             industry: 'Semiconductors',         country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  MU:    { name: 'Micron',             sector: 'Technology',             industry: 'Semiconductors',         country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  ORCL:  { name: 'Oracle',             sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  CRM:   { name: 'Salesforce',         sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  ADBE:  { name: 'Adobe',              sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  NOW:   { name: 'ServiceNow',         sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  INTU:  { name: 'Intuit',             sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SNOW:  { name: 'Snowflake',          sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  PLTR:  { name: 'Palantir',           sector: 'Technology',             industry: 'Software',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  UBER:  { name: 'Uber',               sector: 'Technology',             industry: 'Ride-Sharing',           country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  ABNB:  { name: 'Airbnb',             sector: 'Consumer Discretionary', industry: 'Travel & Lodging',       country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Communication Services ────────────────────────────────
  GOOGL: { name: 'Alphabet A',         sector: 'Communication Services', industry: 'Internet Services',      country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  GOOG:  { name: 'Alphabet C',         sector: 'Communication Services', industry: 'Internet Services',      country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  META:  { name: 'Meta',               sector: 'Communication Services', industry: 'Social Media',           country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  NFLX:  { name: 'Netflix',            sector: 'Communication Services', industry: 'Streaming',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  DIS:   { name: 'Disney',             sector: 'Communication Services', industry: 'Entertainment',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  T:     { name: 'AT&T',               sector: 'Communication Services', industry: 'Telecom',                country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  VZ:    { name: 'Verizon',            sector: 'Communication Services', industry: 'Telecom',                country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  CMCSA: { name: 'Comcast',            sector: 'Communication Services', industry: 'Cable & Media',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SPOT:  { name: 'Spotify',            sector: 'Communication Services', industry: 'Streaming',              country: 'Sweden',        region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Consumer Discretionary ────────────────────────────────
  AMZN:  { name: 'Amazon',             sector: 'Consumer Discretionary', industry: 'E-Commerce',             country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  TSLA:  { name: 'Tesla',              sector: 'Consumer Discretionary', industry: 'Electric Vehicles',      country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  HD:    { name: 'Home Depot',         sector: 'Consumer Discretionary', industry: 'Retail',                 country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  MCD:   { name: "McDonald's",         sector: 'Consumer Discretionary', industry: 'Restaurants',            country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SBUX:  { name: 'Starbucks',          sector: 'Consumer Discretionary', industry: 'Restaurants',            country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  NKE:   { name: 'Nike',               sector: 'Consumer Discretionary', industry: 'Apparel',                country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  GM:    { name: 'General Motors',     sector: 'Consumer Discretionary', industry: 'Automotive',             country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  F:     { name: 'Ford',               sector: 'Consumer Discretionary', industry: 'Automotive',             country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  BABA:  { name: 'Alibaba',            sector: 'Consumer Discretionary', industry: 'E-Commerce',             country: 'China',         region: 'Asia-Pacific', marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Consumer Staples ──────────────────────────────────────
  WMT:   { name: 'Walmart',            sector: 'Consumer Staples',       industry: 'Retail',                 country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  COST:  { name: 'Costco',             sector: 'Consumer Staples',       industry: 'Retail',                 country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  PG:    { name: 'Procter & Gamble',   sector: 'Consumer Staples',       industry: 'Household Products',     country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  KO:    { name: 'Coca-Cola',          sector: 'Consumer Staples',       industry: 'Beverages',              country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  PEP:   { name: 'PepsiCo',            sector: 'Consumer Staples',       industry: 'Beverages',              country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  PM:    { name: 'Philip Morris',      sector: 'Consumer Staples',       industry: 'Tobacco',                country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Financials ────────────────────────────────────────────
  'BRK-B': { name: 'Berkshire B',      sector: 'Financials',             industry: 'Diversified',            country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  'BRK.B': { name: 'Berkshire B',      sector: 'Financials',             industry: 'Diversified',            country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  JPM:   { name: 'JPMorgan Chase',     sector: 'Financials',             industry: 'Banking',                country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  V:     { name: 'Visa',               sector: 'Financials',             industry: 'Payments',               country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  MA:    { name: 'Mastercard',         sector: 'Financials',             industry: 'Payments',               country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  BAC:   { name: 'Bank of America',    sector: 'Financials',             industry: 'Banking',                country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  GS:    { name: 'Goldman Sachs',      sector: 'Financials',             industry: 'Investment Banking',     country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  MS:    { name: 'Morgan Stanley',     sector: 'Financials',             industry: 'Investment Banking',     country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  WFC:   { name: 'Wells Fargo',        sector: 'Financials',             industry: 'Banking',                country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  AXP:   { name: 'American Express',   sector: 'Financials',             industry: 'Payments',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  PYPL:  { name: 'PayPal',             sector: 'Financials',             industry: 'Payments',               country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  BLK:   { name: 'BlackRock',          sector: 'Financials',             industry: 'Asset Management',       country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SCHW:  { name: 'Charles Schwab',     sector: 'Financials',             industry: 'Brokerage',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Healthcare ────────────────────────────────────────────
  UNH:   { name: 'UnitedHealth',       sector: 'Healthcare',             industry: 'Health Insurance',       country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  LLY:   { name: 'Eli Lilly',          sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  JNJ:   { name: 'Johnson & Johnson',  sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  ABBV:  { name: 'AbbVie',             sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  MRK:   { name: 'Merck',              sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  PFE:   { name: 'Pfizer',             sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  TMO:   { name: 'Thermo Fisher',      sector: 'Healthcare',             industry: 'Life Sciences Tools',    country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  GILD:  { name: 'Gilead Sciences',    sector: 'Healthcare',             industry: 'Biotechnology',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  AMGN:  { name: 'Amgen',              sector: 'Healthcare',             industry: 'Biotechnology',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  ISRG:  { name: 'Intuitive Surgical', sector: 'Healthcare',             industry: 'Medical Devices',        country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Energy ────────────────────────────────────────────────
  XOM:   { name: 'ExxonMobil',         sector: 'Energy',                 industry: 'Oil & Gas',              country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  CVX:   { name: 'Chevron',            sector: 'Energy',                 industry: 'Oil & Gas',              country: 'United States', region: 'Americas',     marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  COP:   { name: 'ConocoPhillips',     sector: 'Energy',                 industry: 'Oil & Gas',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SLB:   { name: 'SLB',                sector: 'Energy',                 industry: 'Oil Services',           country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Industrials ───────────────────────────────────────────
  CAT:   { name: 'Caterpillar',        sector: 'Industrials',            industry: 'Machinery',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  BA:    { name: 'Boeing',             sector: 'Industrials',            industry: 'Aerospace',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  RTX:   { name: 'RTX',                sector: 'Industrials',            industry: 'Aerospace & Defense',    country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  GE:    { name: 'GE Aerospace',       sector: 'Industrials',            industry: 'Aerospace',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  HON:   { name: 'Honeywell',          sector: 'Industrials',            industry: 'Conglomerate',           country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  UPS:   { name: 'UPS',                sector: 'Industrials',            industry: 'Logistics',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  DE:    { name: 'Deere & Company',    sector: 'Industrials',            industry: 'Machinery',              country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Utilities ─────────────────────────────────────────────
  NEE:   { name: 'NextEra Energy',     sector: 'Utilities',              industry: 'Electric Utilities',     country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  DUK:   { name: 'Duke Energy',        sector: 'Utilities',              industry: 'Electric Utilities',     country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SO:    { name: 'Southern Company',   sector: 'Utilities',              industry: 'Electric Utilities',     country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Materials ─────────────────────────────────────────────
  LIN:   { name: 'Linde',              sector: 'Materials',              industry: 'Industrial Gases',       country: 'United Kingdom', region: 'Global',      marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  FCX:   { name: 'Freeport-McMoRan',   sector: 'Materials',              industry: 'Copper Mining',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  NEM:   { name: 'Newmont',            sector: 'Materials',              industry: 'Gold Mining',            country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  // ── US Real Estate / REITs ───────────────────────────────────
  O:     { name: 'Realty Income',      sector: 'Real Estate',            industry: 'REIT - Retail',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'REIT', currency: 'USD' },
  SPG:   { name: 'Simon Property',     sector: 'Real Estate',            industry: 'REIT - Retail',          country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'REIT', currency: 'USD' },
  PLD:   { name: 'Prologis',           sector: 'Real Estate',            industry: 'REIT - Industrial',      country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'REIT', currency: 'USD' },
  WELL:  { name: 'Welltower',          sector: 'Real Estate',            industry: 'REIT - Healthcare',      country: 'United States', region: 'Americas',     marketCap: 'Large', assetType: 'REIT', currency: 'USD' },
  // ── European ─────────────────────────────────────────────────
  ASML:  { name: 'ASML',               sector: 'Technology',             industry: 'Semiconductors',         country: 'Netherlands',   region: 'Europe',       marketCap: 'Mega',  assetType: 'Stock', currency: 'EUR' },
  NVO:   { name: 'Novo Nordisk',       sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'Denmark',       region: 'Europe',       marketCap: 'Mega',  assetType: 'Stock', currency: 'DKK' },
  SAP:   { name: 'SAP',                sector: 'Technology',             industry: 'Software',               country: 'Germany',       region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'EUR' },
  NESN:  { name: 'Nestlé',             sector: 'Consumer Staples',       industry: 'Food & Beverage',        country: 'Switzerland',   region: 'Europe',       marketCap: 'Mega',  assetType: 'Stock', currency: 'CHF' },
  NOVN:  { name: 'Novartis',           sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'Switzerland',   region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'CHF' },
  ROG:   { name: 'Roche',              sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'Switzerland',   region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'CHF' },
  UBSG:  { name: 'UBS Group',          sector: 'Financials',             industry: 'Banking',                country: 'Switzerland',   region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'CHF' },
  CSGN:  { name: 'Credit Suisse',      sector: 'Financials',             industry: 'Banking',                country: 'Switzerland',   region: 'Europe',       marketCap: 'Mid',   assetType: 'Stock', currency: 'CHF' },
  MC:    { name: 'LVMH',               sector: 'Consumer Discretionary', industry: 'Luxury Goods',           country: 'France',        region: 'Europe',       marketCap: 'Mega',  assetType: 'Stock', currency: 'EUR' },
  OR:    { name: "L'Oréal",            sector: 'Consumer Staples',       industry: 'Personal Care',          country: 'France',        region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'EUR' },
  SHEL:  { name: 'Shell',              sector: 'Energy',                 industry: 'Oil & Gas',              country: 'United Kingdom', region: 'Europe',      marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  BP:    { name: 'BP',                 sector: 'Energy',                 industry: 'Oil & Gas',              country: 'United Kingdom', region: 'Europe',      marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  AZN:   { name: 'AstraZeneca',        sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United Kingdom', region: 'Europe',      marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  HSBC:  { name: 'HSBC',               sector: 'Financials',             industry: 'Banking',                country: 'United Kingdom', region: 'Europe',      marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  GSK:   { name: 'GSK',                sector: 'Healthcare',             industry: 'Pharmaceuticals',        country: 'United Kingdom', region: 'Europe',      marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  SIEGY: { name: 'Siemens',            sector: 'Industrials',            industry: 'Conglomerate',           country: 'Germany',       region: 'Europe',       marketCap: 'Large', assetType: 'Stock', currency: 'EUR' },
  // ── Asia-Pacific ─────────────────────────────────────────────
  TSM:   { name: 'TSMC',               sector: 'Technology',             industry: 'Semiconductors',         country: 'Taiwan',        region: 'Asia-Pacific', marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  TM:    { name: 'Toyota',             sector: 'Consumer Discretionary', industry: 'Automotive',             country: 'Japan',         region: 'Asia-Pacific', marketCap: 'Mega',  assetType: 'Stock', currency: 'USD' },
  SONY:  { name: 'Sony',               sector: 'Consumer Discretionary', industry: 'Electronics',            country: 'Japan',         region: 'Asia-Pacific', marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  BIDU:  { name: 'Baidu',              sector: 'Communication Services', industry: 'Internet Services',      country: 'China',         region: 'Asia-Pacific', marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  JD:    { name: 'JD.com',             sector: 'Consumer Discretionary', industry: 'E-Commerce',             country: 'China',         region: 'Asia-Pacific', marketCap: 'Large', assetType: 'Stock', currency: 'USD' },
  TCEHY: { name: 'Tencent',            sector: 'Communication Services', industry: 'Internet Services',      country: 'China',         region: 'Asia-Pacific', marketCap: 'Mega',  assetType: 'Stock', currency: 'HKD' },
  // ── ETFs ─────────────────────────────────────────────────────
  SPY:   { name: 'SPDR S&P 500 ETF',   sector: 'Broad Market',           industry: 'Index Fund',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  QQQ:   { name: 'Invesco QQQ',        sector: 'Technology',             industry: 'Index Fund',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  VOO:   { name: 'Vanguard S&P 500',   sector: 'Broad Market',           industry: 'Index Fund',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  VTI:   { name: 'Vanguard Total Mkt', sector: 'Broad Market',           industry: 'Index Fund',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  IWM:   { name: 'iShares Russell 2000',sector:'Small Cap',              industry: 'Index Fund',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  VEA:   { name: 'Vanguard Dev Mkt',   sector: 'Broad Market',           industry: 'Index Fund',             country: 'International', region: 'Global',       marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  VWO:   { name: 'Vanguard Emerging',  sector: 'Emerging Markets',       industry: 'Index Fund',             country: 'International', region: 'Asia-Pacific', marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  GLD:   { name: 'SPDR Gold Shares',   sector: 'Commodities',            industry: 'Gold',                   country: 'United States', region: 'Global',       marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  SLV:   { name: 'iShares Silver',     sector: 'Commodities',            industry: 'Silver',                 country: 'United States', region: 'Global',       marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  TLT:   { name: 'iShares 20+ Yr',     sector: 'Bonds',                  industry: 'Government Bonds',       country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  BND:   { name: 'Vanguard Total Bond',sector: 'Bonds',                  industry: 'Bond Market',            country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  HYG:   { name: 'iShares HY Bond',    sector: 'Bonds',                  industry: 'High Yield Bonds',       country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  ARKK:  { name: 'ARK Innovation',     sector: 'Technology',             industry: 'Innovation ETF',         country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLK:   { name: 'SPDR Technology',    sector: 'Technology',             industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLF:   { name: 'SPDR Financials',    sector: 'Financials',             industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLV:   { name: 'SPDR Healthcare',    sector: 'Healthcare',             industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLE:   { name: 'SPDR Energy',        sector: 'Energy',                 industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLI:   { name: 'SPDR Industrials',   sector: 'Industrials',            industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLU:   { name: 'SPDR Utilities',     sector: 'Utilities',              industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  XLP:   { name: 'SPDR Cons. Staples', sector: 'Consumer Staples',       industry: 'Sector ETF',             country: 'United States', region: 'Americas',     marketCap: 'N/A',   assetType: 'ETF',   currency: 'USD' },
  // ── Crypto ───────────────────────────────────────────────────
  'BTC-USD': { name: 'Bitcoin',        sector: 'Cryptocurrency',         industry: 'Store of Value',         country: 'Global',        region: 'Global',       marketCap: 'Mega',  assetType: 'Crypto', currency: 'USD' },
  'ETH-USD': { name: 'Ethereum',       sector: 'Cryptocurrency',         industry: 'Smart Contracts',        country: 'Global',        region: 'Global',       marketCap: 'Large', assetType: 'Crypto', currency: 'USD' },
  'SOL-USD': { name: 'Solana',         sector: 'Cryptocurrency',         industry: 'Smart Contracts',        country: 'Global',        region: 'Global',       marketCap: 'Large', assetType: 'Crypto', currency: 'USD' },
}

export function getTickerMeta(ticker: string): TickerMeta {
  const clean = ticker.replace(/\.(NYSE|NASDAQ|LSE|SWX|XETRA)$/, '').toUpperCase()
  return META[clean] ?? {
    name: clean,
    sector: 'Other',
    industry: 'Other',
    country: 'Unknown',
    region: 'Unknown',
    marketCap: 'N/A',
    assetType: 'Stock',
    currency: 'USD',
  }
}

// Color palette for each sector
export const SECTOR_COLORS: Record<string, string> = {
  'Technology':             '#6366f1',
  'Communication Services': '#8b5cf6',
  'Consumer Discretionary': '#f59e0b',
  'Consumer Staples':       '#10b981',
  'Financials':             '#3b82f6',
  'Healthcare':             '#22c55e',
  'Energy':                 '#ef4444',
  'Industrials':            '#f97316',
  'Materials':              '#84cc16',
  'Real Estate':            '#14b8a6',
  'Utilities':              '#06b6d4',
  'Broad Market':           '#94a3b8',
  'Bonds':                  '#64748b',
  'Commodities':            '#d97706',
  'Cryptocurrency':         '#f59e0b',
  'Emerging Markets':       '#a855f7',
  'Small Cap':              '#ec4899',
  'Other':                  '#475569',
}

export const COUNTRY_COLORS: Record<string, string> = {
  'United States':  '#3b82f6',
  'Netherlands':    '#f97316',
  'Denmark':        '#22c55e',
  'Switzerland':    '#ef4444',
  'Germany':        '#8b5cf6',
  'France':         '#6366f1',
  'United Kingdom': '#06b6d4',
  'Japan':          '#f59e0b',
  'China':          '#ef4444',
  'Taiwan':         '#10b981',
  'Sweden':         '#14b8a6',
  'International':  '#94a3b8',
  'Global':         '#64748b',
  'Unknown':        '#475569',
}

export const REGION_COLORS: Record<string, string> = {
  'Americas':     '#3b82f6',
  'Europe':       '#8b5cf6',
  'Asia-Pacific': '#22c55e',
  'Global':       '#94a3b8',
  'Unknown':      '#475569',
}

export const ASSET_TYPE_COLORS: Record<string, string> = {
  'Stock':  '#3b82f6',
  'ETF':    '#8b5cf6',
  'Crypto': '#f59e0b',
  'REIT':   '#22c55e',
  'Fund':   '#94a3b8',
}

export const MARKET_CAP_COLORS: Record<string, string> = {
  'Mega':  '#22c55e',
  'Large': '#3b82f6',
  'Mid':   '#f59e0b',
  'Small': '#f97316',
  'Nano':  '#ef4444',
  'N/A':   '#94a3b8',
}

export const MARKET_CAP_LABELS: Record<string, string> = {
  'Mega':  'Mega-cap (>$200B)',
  'Large': 'Large-cap ($10B–$200B)',
  'Mid':   'Mid-cap ($2B–$10B)',
  'Small': 'Small-cap (<$2B)',
  'Nano':  'Nano-cap',
  'N/A':   'ETF / Fund',
}
