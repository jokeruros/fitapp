# React + TypeScript + Vite

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's API settings. A legacy anon key can be used instead by setting `VITE_SUPABASE_ANON_KEY`.
3. Run `supabase/migrations/20261031_user_data.sql` in the Supabase SQL Editor. It creates the user data table and row-level security policies.
4. Run `supabase/migrations/20261101_system_foods.sql` in the SQL Editor. It seeds the shared system-food catalog and permits per-user food overrides.
5. Run `supabase/migrations/20261101_daily_progress.sql` in the SQL Editor to allow per-user daily progress snapshots.
6. Run `supabase/migrations/20261101_user_preferences.sql` to allow per-user language preferences.
7. Run `npm run dev` and create an account in the app.

The app stores each user's foods, goals, meals, and system-food edits in PostgreSQL. Daily progress snapshots are stored in a dedicated `daily_progress` table, with one row per user and date. The dashboard button saves that day's achieved nutrition and goal values; the calendar displays those snapshots. Foods use grams, milliliters, pieces, or servings; the catalog migration assigns units from the source food list. New foods can choose their unit. The base system-food catalog is shared; editing a system food saves a private override for that account and updates matching saved meal entries so their totals recalculate. Row-level security limits private data to the signed-in user. On first sign-in, existing local foods, goals, and meals are copied to Supabase if that account has no cloud copy yet. Local data is retained. Passwords are handled by Supabase Auth and are not copied from the old local database.

Never put a Supabase service-role key in the browser app. Use the publishable key (or legacy anon key) with the SQL migration's row-level policies.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
