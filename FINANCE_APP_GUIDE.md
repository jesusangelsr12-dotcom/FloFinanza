# 💰 Finance App — Guía Completa para Claude Code

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + CSS Variables (tema dark/light)
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Animaciones**: Framer Motion
- **Icons**: Lucide React
- **Fuentes**: Sora (display) + DM Sans (body) — via Google Fonts
- **Deploy**: Vercel

---

## Estética Visual (inspirada en Buddy App)

### Paleta de colores
```css
:root {
  --bg-primary: #0A0A0F;        /* Fondo principal — negro azulado */
  --bg-card: #13131A;           /* Cards */
  --bg-elevated: #1C1C26;       /* Modales, overlays */
  --accent-green: #00E5A0;      /* Ingresos, positivo */
  --accent-red: #FF4D6A;        /* Gastos, negativo, deuda */
  --accent-blue: #4D9FFF;       /* Neutral, info */
  --accent-purple: #9B6DFF;     /* MSI, tarjetas */
  --text-primary: #F0F0F5;
  --text-secondary: #6B6B80;
  --border: rgba(255,255,255,0.06);
  --radius: 20px;
  --radius-sm: 12px;
}
```

### Principios de diseño
- Números grandes y prominentes (balance principal en 48-56px)
- Cards con fondo ligeramente elevado, sin bordes duros
- Bottom navigation con 5 tabs + FAB central para agregar transacción
- Transiciones suaves (300ms ease)
- Espaciado generoso — no cluttered
- Glassmorphism sutil en modales

---

## Estructura del Proyecto

```
finance-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← Bottom nav + FAB
│   │   ├── page.tsx            ← Dashboard/Home
│   │   ├── budgets/page.tsx    ← Cajitas
│   │   ├── cards/page.tsx      ← Tarjetas de crédito
│   │   ├── msi/page.tsx        ← Meses sin intereses
│   │   ├── splits/page.tsx     ← Gastos compartidos
│   │   ├── loans/page.tsx      ← Préstamos dados/recibidos
│   │   └── analytics/page.tsx  ← Dashboard analytics
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                     ← Componentes base
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── FAB.tsx             ← Floating Action Button
│   ├── transactions/
│   │   ├── AddTransactionSheet.tsx
│   │   ├── TransactionItem.tsx
│   │   └── CategoryPicker.tsx
│   ├── budgets/
│   │   ├── BudgetCard.tsx
│   │   └── BudgetProgress.tsx
│   ├── cards/
│   │   ├── CreditCardView.tsx
│   │   └── CardStatement.tsx
│   └── charts/
│       ├── SpendingDonut.tsx
│       └── MonthlyBar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts            ← Tipos generados de Supabase
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   ├── useCards.ts
│   │   └── useSalary.ts
│   └── utils/
│       ├── currency.ts         ← Formateo MXN/USD
│       └── dates.ts
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Schema de Supabase (SQL completo)

```sql
-- =============================================
-- USERS & SETTINGS
-- =============================================

-- La tabla auth.users ya existe en Supabase

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  salary DECIMAL(12,2),
  salary_currency VARCHAR(3) DEFAULT 'MXN',
  salary_frequency VARCHAR(20) DEFAULT 'biweekly', -- 'weekly','biweekly','monthly','custom'
  salary_custom_days INT,                           -- si es custom, cada cuántos días
  salary_next_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CATEGORIES
-- =============================================

CREATE TABLE category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('expense','income')),
  icon VARCHAR(50),
  color VARCHAR(7),   -- hex color
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('expense','income')),
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías default al registrarse (insertar via trigger o seed)

-- =============================================
-- BUDGETS (Cajitas)
-- =============================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  amount DECIMAL(12,2) NOT NULL,     -- cuánto se asigna cada periodo del salario
  accumulated DECIMAL(12,2) DEFAULT 0,  -- dinero acumulado actualmente
  period_days INT DEFAULT 14,           -- cada cuántos días se "recarga"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimientos manuales en cajitas (agregar/quitar fuera del salario)
CREATE TABLE budget_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,  -- positivo=agregar, negativo=quitar
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRANSACTIONS
-- =============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('expense','income')),
  amount DECIMAL(12,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,   -- cajita afectada
  card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL, -- si fue con tarjeta
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_msi BOOLEAN DEFAULT FALSE,
  msi_id UUID,  -- FK a installment_plans (se agrega después)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SPLIT EXPENSES (Gastos compartidos)
-- =============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,   -- cuánto debe esa persona
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREDIT CARDS
-- =============================================

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,       -- ej: "BBVA Azul"
  bank VARCHAR(100),
  last_four CHAR(4),
  color VARCHAR(7),                 -- color visual de la tarjeta
  credit_limit DECIMAL(12,2),
  cut_day INT NOT NULL,             -- día del mes que cierra el corte
  payment_day INT NOT NULL,         -- día límite para pagar sin intereses
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MSI — Meses Sin Intereses
-- =============================================

CREATE TABLE installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  monthly_amount DECIMAL(12,2) NOT NULL,  -- total / months
  total_months INT NOT NULL,
  paid_months INT DEFAULT 0,
  start_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cada cuota mensual
CREATE TABLE installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
  month_number INT NOT NULL,   -- 1, 2, 3...
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FK circular: transactions → installment_plans
ALTER TABLE transactions ADD CONSTRAINT fk_msi 
  FOREIGN KEY (msi_id) REFERENCES installment_plans(id) ON DELETE SET NULL;

-- =============================================
-- LOANS (Préstamos dados y recibidos)
-- =============================================

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('given','received')), 
  -- 'given' = yo presté | 'received' = me prestaron
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name VARCHAR(100),    -- fallback si no está en contacts
  principal DECIMAL(12,2) NOT NULL,  -- monto original
  monthly_payment DECIMAL(12,2) NOT NULL,
  total_months INT NOT NULL,
  paid_months INT DEFAULT 0,
  start_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  month_number INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

-- Política genérica: solo tu data
CREATE POLICY "Users own data" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON category_groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON budget_movements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON transaction_splits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON credit_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON installment_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON installment_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON loan_payments FOR ALL USING (auth.uid() = user_id);
```

---

## CLAUDE.md (archivo en raíz del proyecto)

Crea un archivo `CLAUDE.md` en la raíz para que Claude Code mantenga contexto:

```markdown
# Finance App — Context for Claude Code

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (auth + database)
- Framer Motion, Recharts, Lucide React

## Design System
- Dark theme only (#0A0A0F background)
- Accent green for income, red for expenses, purple for MSI
- Border radius: 20px cards, 12px inputs
- Font: Sora (headings) + DM Sans (body)
- All monetary values formatted as MXN by default

## Conventions
- Server Components by default, Client only when needed (forms, interactive)
- All DB calls via /lib/supabase/server.ts (server) or /lib/supabase/client.ts (browser)
- Hooks in /lib/hooks/ para lógica reutilizable
- Todos los amounts en DECIMAL(12,2) — nunca float para dinero

## Navigation (Bottom Tabs)
1. 🏠 Home (Dashboard)
2. 📦 Cajitas (Budgets)
3. ➕ FAB — Add Transaction (center, elevated)
4. 💳 Tarjetas (Cards)
5. 📊 Analytics

## Screens adicionales (accesibles desde sus secciones)
- /msi — Meses sin intereses
- /splits — Gastos compartidos
- /loans — Préstamos dados y recibidos
- /settings — Configuración de salario y categorías
```

---

## Prompt inicial para Claude Code

Pega esto en Claude Code al inicio:

```
Crea una app de finanzas personales llamada "Cuentas" con Next.js 14, TypeScript, Tailwind CSS y Supabase.

ESTÉTICA: Dark theme minimalista. Fondo #0A0A0F. Cards en #13131A con border-radius 20px. 
Accent verde (#00E5A0) para ingresos, rojo (#FF4D6A) para gastos, morado (#9B6DFF) para MSI.
Fuentes: Sora para títulos (Google Fonts), DM Sans para cuerpo. Animaciones con Framer Motion.

NAVEGACIÓN: Bottom navigation bar con 5 tabs. El tab del centro es un FAB (Floating Action Button) 
elevado para agregar transacciones, tipo bottom sheet que sube desde abajo.

INICIO: Primero crea el proyecto base con:
1. Layout principal con bottom nav
2. Configuración de Supabase (variables de entorno en .env.local)
3. El schema SQL completo (ver CLAUDE.md)
4. Auth screens (login/register) con diseño consistente
5. Home page mostrando: balance total del mes, últimas 5 transacciones, 
   acceso rápido a cajitas y tarjeta principal

Sigue el CLAUDE.md para todas las decisiones de arquitectura.
```

---

## Variables de entorno (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

---

## Setup paso a paso

```bash
# 1. Crear proyecto
npx create-next-app@latest cuentas --typescript --tailwind --app

# 2. Instalar dependencias
npm install @supabase/supabase-js @supabase/ssr framer-motion recharts lucide-react

# 3. Supabase CLI (opcional, para migrations locales)
npm install -D supabase

# 4. Inicializar Supabase
npx supabase init
```

---

## Flujo de desarrollo sugerido (sprints)

### Sprint 1 — Base
- [ ] Layout + Bottom Nav + FAB
- [ ] Auth (login/register)
- [ ] Schema Supabase + RLS
- [ ] Configuración de salario

### Sprint 2 — Core
- [ ] Agregar transacciones (gastos/ingresos) con categorías
- [ ] Gestión de categorías y grupos
- [ ] Cajitas (CRUD + acumulado)
- [ ] Home dashboard básico

### Sprint 3 — Tarjetas y MSI
- [ ] Tarjetas de crédito CRUD
- [ ] Registrar gastos por tarjeta
- [ ] Meses sin intereses (plans + payments)
- [ ] Pantalla MSI

### Sprint 4 — Social
- [ ] Contactos
- [ ] Split de gastos
- [ ] Pantalla de cobros pendientes

### Sprint 5 — Préstamos y Analytics
- [ ] Préstamos dados/recibidos
- [ ] Dashboard analytics (donut chart, barras mensuales)
- [ ] Filtros por mes/año

---

## Notas importantes

- **Nunca** usar `float` para dinero. Siempre `DECIMAL(12,2)` en DB y `number` preciso en JS
- El FAB abre un `<Sheet>` (bottom drawer) con tabs: Gasto | Ingreso
- Las cajitas se recargan automáticamente cuando llega el salario (Supabase scheduled function o cron)
- Los cortes de tarjeta se calculan en tiempo real según `cut_day` de la tarjeta
- MSI: cada mes de corte se suma `monthly_amount` al statement de la tarjeta automáticamente
