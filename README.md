# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Supabase Backend

This project can run against Supabase or fallback to local JSON file storage.

The admin portal is protected by an access key, so only authorized users can manage inventory, orders, promotions, and store settings.

To use Supabase, create a `.env` file with the following environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_KEY`)
- `ADMIN_SECRET` (required for admin portal access)
- `CLIENT_ORIGIN` (optional, defaults to `http://localhost:5173`)

A sample configuration is available in `.env.example`.

The backend expects these tables in Supabase:

- `products`
- `orders`
- `promotions`
- `store_config`

A SQL schema file is provided in `supabase-schema.sql`.

To start the app locally:

```bash
npm install
npm run dev
```

If Supabase is configured, the server will initialize seed data in the remote tables automatically when they are empty.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
