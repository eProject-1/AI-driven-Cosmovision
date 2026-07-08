# CosmoVision AI - Frontend

Frontend app for CosmoVision AI, built with React, Vite, Tailwind CSS, and Three.js.

## Requirements

- Node.js 20+
- npm
- Backend running at `http://localhost:5000/api`

## Install

```bash
cd FRONTEND
npm install
```

Create `FRONTEND/.env` before running the app.

```env
VITE_API_URL=http://localhost:5000/api
```

## Run

Development:

```bash
npm run dev
```

Vite prints the local URL in the terminal, usually:

```text
http://localhost:5173
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Naming Convention

Folders:

- Use lowercase folder names.
- Use kebab-case for multi-word folders.
- Keep route pages in `src/pages`.
- Keep reusable UI in `src/components`.
- Keep API clients in `src/services`.
- Keep static domain data in `src/lib` or `src/data`.
- Keep small shared helpers in `src/utils`.

Frontend files:

- React page/component files use PascalCase: `Home.jsx`, `PlanetDetail.jsx`, `SiteHeader.jsx`.
- React context provider files use PascalCase when they export a provider/component: `AuthContext.jsx`.
- Plain state, data, and utility modules use camelCase: `authState.js`, `planetFacts.js`, `observatoryImages.js`.
- API client modules use `<domain>.api.js`: `auth.api.js`, `planet.api.js`, `cosmicKnowledgeSave.api.js`.
- CSS files use kebab-case or existing role names: `base.css`, `planet-cinematic.css`, `chatbot.css`.
- Type declaration files use descriptive lowercase names: `images.d.ts`.

Do not mix backend suffixes such as `.service.js` or `.controller.js` into frontend components. Keep component names focused on the UI they render.
