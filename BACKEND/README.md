# CosmoVision AI - Backend

Backend API for CosmoVision AI, built with Node.js, Express, Prisma, and PostgreSQL.

## Requirements

- Node.js 20+
- npm
- PostgreSQL database URL

## Install

```bash
cd BACKEND
npm install
```

Create `BACKEND/.env` before running the app. Do not commit real secrets.

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="7d"
API_PUBLIC_URL="http://localhost:5000"

GROQ_API_KEY=""
GROQ_MODEL="llama-3.1-8b-instant"
GROQ_VISION_MODEL="meta-llama/llama-4-scout-17b-16e-instruct"
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=800

NASA_API_KEY=""
OPENWEATHER_API_KEY=""

SMTP_HOST=""
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="CosmoVision <no-reply@cosmovision.app>"
EMAIL_DEV_FALLBACK=true
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60
```

## Database

```bash
npm run db:push
npm run db:seed
```

Optional Prisma Studio:

```bash
npm run db:studio
```

## Run

Development:

```bash
npm run dev
```

Default API URL:

```text
http://localhost:5000/api
```

## Useful Scripts

```bash
npm run planets:sync
npm run constellations:sync
npm run ml:download:constellations
npm run ml:generate:constellations
npm run ml:curate:constellations
npm run ml:train:constellations
npm run ml:predict:constellation
```

ML scripts require the Python virtual environment under `BACKEND/.venv`.

## Naming Convention

Folders:

- Use lowercase names.
- Use kebab-case for multi-word folders.
- Group business features under `src/modules/<feature>`.
- Put shared integrations under `src/services/<provider-or-domain>`.
- Put shared cross-cutting helpers under `src/utils`.

Backend files:

- Use dot-separated names for multi-part backend files.
- Use role suffixes for module files: `<feature>.controller.js`, `<feature>.service.js`, `<feature>.routes.js`, `<feature>.validation.js`, `<feature>.helpers.js`.
- Use `<name>.middleware.js` for middleware files.
- Use `<name>.util.js` for shared utilities.
- Use `<name>.api.js` only in frontend, not backend.

Current utility names follow this standard:

```text
app.error.util.js
async.handler.util.js
email.verification.util.js
fuzzy.match.util.js
geo.util.js
jwt.util.js
logger.util.js
normalize.util.js
response.util.js
service.util.js
validation.util.js
```

Avoid adding new kebab-case, camelCase, or PascalCase backend filenames unless the existing folder already uses that convention.
