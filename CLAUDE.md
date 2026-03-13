# Cuentas — Finance App Context

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (auth + database)
- Framer Motion, Recharts, Lucide React

## Design System
- Light theme (#F4F4F6 background, white cards)
- Accent green for income, red for expenses, purple for MSI
- Border radius: 22px cards, 14px inputs, 100px pills
- Font: Nunito (headings) + DM Sans (body)
- All monetary values formatted as MXN by default

## Conventions
- Server Components by default, Client only when needed (forms, interactive)
- All DB calls via /lib/supabase/server.ts (server) or /lib/supabase/client.ts (browser)
- Hooks in /lib/hooks/ for reusable logic
- All amounts in DECIMAL(12,2) — never float for money

## Navigation (Bottom Tabs)
1. Home (Dashboard)
2. Cajitas (Budgets)
3. FAB — Add Transaction (center, elevated)
4. Tarjetas (Cards)
5. Analytics

## Additional screens (accessible from sections)
- /msi — Meses sin intereses
- /splits — Gastos compartidos
- /loans — Préstamos dados y recibidos
- /settings — Configuración de salario y categorías
