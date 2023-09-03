# Nuxt 3 Minimal Starter with postgraphile integration

Configure server/tsconfig.json for enable export resolution used by postgraphile

```json
"compilerOptions": {
    "moduleResolution": "Bundler"
  }
```

define `DATABASE_URL` env...

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install
# pnpm
pnpm install
# yarn
yarn install
```

## Exporting schema

```bash
# npm
npm run export-schema
# pnpm
pnpm run export-schema
# yarn
yarn export-schema
```

## H3 (standalone) & postgraphile with subscription ws

Single h3 app (`h3Standalone.ts`)
using the grafserv adaptor for h3

```bash
# npm
npm run h3
# pnpm
pnpm run h3
# yarn
yarn h3
```

## Nuxt Development Server

Postgraphile integration is implemented in `@/server/graphql/**` and `@/server/api/graphql`.

ws are registering as explain by the nuxt team :

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
# pnpm
pnpm run dev
# yarn
yarn dev
```

## Nuxt Production

Build the application for production:

```bash
# npm
npm run build
# pnpm
pnpm run build
# yarn
yarn build
```

For Ruru working in prod, we must copy `node_modules/ruru/bundle` to `.output/server/node_modules/ruru/bundle`
the script `postbuild.mjs` do the job !

Locally preview production build:

```bash
# npm
npm run preview
# pnpm
pnpm run preview
# yarn
yarn preview
```
