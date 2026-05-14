# Quantfoli — Founder Sprint
> Paste this into Claude Code at the root of your repo.

## Kontext
Du arbeitest an **Quantfoli** (quantfoli.com) — einem Portfolio Analytics SaaS für Schweizer Self-directed Investors.
Stack: Next.js 14 · TypeScript · Tailwind · Supabase · Vercel · Stripe

**Ziel dieser Session:** Pro Max entfernen, Stripe auf Live umstellen, Neon CSV Parser bauen → erster zahlender User → Founder.

Repo: https://github.com/dariushfinance/finance-dashboard-nextjs

---

## TASK 1 — Pro Max aus dem UI entfernen

**Was zu tun ist:**
- Finde die Pricing-Komponente (wahrscheinlich `components/pricing.tsx` oder `app/pricing/page.tsx`)
- Lösche die Pro Max Karte komplett aus dem JSX
- Behalte nur zwei Tiers: FREE (CHF 0) und PRO (CHF 12)
- Stelle sicher dass kein Button mehr auf den Pro Max Stripe Price ID zeigt
- Falls es eine `tier` TypeScript Union gibt (z.B. `'free' | 'pro' | 'pro_max'`): entferne `'pro_max'` überall

**Fix gleichzeitig:**
- Falls ein "Get Pro" Button bei Pro Max Usern noch aktiv ist: deaktivieren (`disabled` + grey out)
- Suche nach allen Stellen wo `pro_max` in der Codebase vorkommt: `grep -r "pro_max" .`

---

## TASK 2 — Stripe: Sandbox → Live

**Was zu tun ist:**

### 2a. Neue Live Keys holen
Gehe auf https://dashboard.stripe.com → oben rechts Toggle von "Test" auf "Live" → API Keys kopieren.

Dann in deiner `.env.local` (und auf Vercel unter Environment Variables):
```
# ERSETZE die alten Test-Keys:
STRIPE_SECRET_KEY=sk_live_...          # war: sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   # war: pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # NEU generieren (siehe 2c)
```

### 2b. Live Product + Price in Stripe erstellen
- Stripe Dashboard → Products → Add Product
- Name: "Quantfoli Pro"
- Price: CHF 12.00 / month (recurring)
- Den neuen `price_id` (Format: `price_live_...`) in deinen Code eintragen
- Suche nach dem alten `price_id` im Code: `grep -r "price_test\|price_1" .`
- Ersetze überall mit dem neuen Live Price ID

### 2c. Live Webhook einrichten
- Stripe Dashboard → Developers → Webhooks → Add Endpoint
- URL: `https://quantfoli.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Den neuen Webhook Secret (`whsec_live_...`) als `STRIPE_WEBHOOK_SECRET` setzen

### 2d. Vercel Environment Variables updaten
- https://vercel.com → Project → Settings → Environment Variables
- Alle drei Keys ersetzen (STRIPE_SECRET_KEY, PUBLISHABLE_KEY, WEBHOOK_SECRET)
- **Wichtig:** Nach dem Update → Vercel Redeploy triggern

### 2e. Test des Live Flows
- Gehe auf quantfoli.com/pricing
- Klicke "Get Pro" → Stripe Checkout öffnet sich
- Zahle CHF 1 (Test mit echter Karte — du bekommst es zurück via Stripe Dashboard → Refund)
- Prüfe: Supabase → users Tabelle → `tier` sollte auf `'pro'` wechseln
- Prüfe: Stripe Dashboard → Payments → eine erfolgreiche Zahlung sichtbar

---

## TASK 3 — Neon CSV Parser bauen

**Ziel:** User exportiert CSV aus der Neon App → uploaded es im Dashboard → Positionen werden automatisch erkannt und importiert.

### 3a. Neon CSV Format
Neon Activity Export hat diese Spalten:
```
Date, Asset, Name, ISIN, Quantity, Price, Currency, Type, Fees, Total
```
Typische Zeilen:
```
2024-03-15,AAPL,Apple Inc.,US0378331005,5,180.50,USD,BUY,1.50,-903.50
2024-04-20,AAPL,Apple Inc.,US0378331005,2,185.00,USD,SELL,1.00,369.00
```

### 3b. Normalisiertes Schema (Output des Parsers)
```typescript
interface Transaction {
  date: string;        // ISO: "2024-03-15"
  ticker: string;      // "AAPL"
  isin: string;        // "US0378331005"
  name: string;        // "Apple Inc."
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  quantity: number;
  price: number;
  currency: string;    // "USD"
  fees: number;
  total: number;
}
```

### 3c. Was du bauen sollst

**1. Parser Funktion** (`lib/parsers/neon.ts`):
```typescript
export function parseNeonCSV(csvText: string): Transaction[] {
  // - Erste Zeile = Header, skippen
  // - Leere Zeilen skippen
  // - Type Mapping: "BUY" → "BUY", "SELL" → "SELL", "DIVIDEND" → "DIVIDEND"
  // - Fehlerhafte Zeilen loggen, nicht crashen
  // - Return: Transaction[]
}
```

**2. Broker Detector** (`lib/parsers/detector.ts`):
```typescript
export function detectBroker(headers: string[]): 'neon' | 'unknown' {
  if (headers.includes('Asset') && headers.includes('ISIN') && headers.includes('Side'))
    return 'neon';
  return 'unknown';
}
```

**3. Upload API Route** (`app/api/import/route.ts`):
- Empfängt `multipart/form-data` mit CSV File
- Liest den Text, ruft `detectBroker()` auf
- Falls Neon: `parseNeonCSV()` → Transaktionen in Supabase speichern
- Falls unknown: Return `{ error: "Broker not supported yet. Supported: Neon" }`
- Auth check: User muss eingeloggt sein (Supabase session prüfen)

**4. Upload UI** (`components/import-csv.tsx`):
- Einfaches Drag & Drop oder File Input (`.csv` only)
- Nach Upload: Preview Tabelle der erkannten Transaktionen (erste 5 Zeilen)
- "Confirm Import" Button → POST an `/api/import`
- Success State: "X Transaktionen importiert ✓"
- Error State: Fehlermeldung anzeigen

**5. Supabase Tabelle** (falls noch nicht vorhanden):
```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ticker TEXT,
  isin TEXT,
  name TEXT,
  type TEXT NOT NULL,  -- 'BUY' | 'SELL' | 'DIVIDEND'
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  fees NUMERIC DEFAULT 0,
  total NUMERIC,
  broker TEXT,         -- 'neon'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: User sieht nur eigene Transaktionen
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);
```

---

## TASK 4 — Domain quantfoli.com → Vercel

**Was zu tun ist (du machst das selbst im Browser, kein Code):**

1. Namecheap → Domain List → quantfoli.com → Manage → Advanced DNS
2. Lösche alle bestehenden A-Records
3. Füge hinzu:
   - Type: `A` | Host: `@` | Value: `76.76.21.21` | TTL: Automatic
   - Type: `CNAME` | Host: `www` | Value: `cname.vercel-dns.com` | TTL: Automatic
4. Vercel → Project → Settings → Domains → Add Domain → `quantfoli.com`
5. Warte 5–30 Min auf DNS Propagation
6. Vercel zeigt ✓ wenn Domain aktiv ist

**Danach:**
- Stripe Dashboard → Account Settings → Business URL → `https://quantfoli.com`
- Supabase → Authentication → URL Configuration → Site URL → `https://quantfoli.com`

---

## Reihenfolge

```
1. Task 1 — Pro Max entfernen (15 min)
2. Task 4 — Domain setzen (10 min, dann warten)
3. Task 2 — Stripe Live (30 min)
4. Task 3 — Neon Parser (1–2h)
5. Mom testet → CHF 1 Zahlung → Webhook → tier = 'pro' → Founder ✅
```

---

## Was du NICHT anfasst in dieser Session
- Kein neues Feature ausser dem Parser
- Kein Pro Max wieder einbauen
- Kein Refactoring der bestehenden Quant-Features
- Kein neues API Provider onboarden

Fokus: Founder-Trigger. Alles andere danach.
