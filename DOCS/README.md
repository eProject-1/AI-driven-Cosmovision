
```
COSMOVISION-AI
├─ BACKEND
│  ├─ context_dump.txt
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ migrations
│  │  │  ├─ 20260620083947_init_full_schema
│  │  │  │  └─ migration.sql
│  │  │  └─ migration_lock.toml
│  │  ├─ migrations_old_backup
│  │  │  ├─ 20260611081449_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260617053138_add_verification_token
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260618173913_update_planet_schema
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260618175057_update_observatory_schema
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260619043133_add
│  │  │  │  └─ migration.sql
│  │  │  └─ migration_lock.toml
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  ├─ README.md
│  ├─ render.yaml
│  └─ src
│     ├─ app.js
│     ├─ config
│     │  ├─ db.js
│     │  ├─ env.js
│     │  └─ groq.js
│     ├─ middlewares
│     │  ├─ auth.middleware.js
│     │  ├─ error.middleware.js
│     │  ├─ role.middleware.js
│     │  ├─ upload.middleware.js
│     │  └─ validate.middleware.js
│     ├─ modules
│     │  ├─ astronomy
│     │  │  ├─ constellations
│     │  │  │  ├─ constellation.controller.js
│     │  │  │  └─ constellation.service.js
│     │  │  └─ planets
│     │  │     ├─ planet.controller.js
│     │  │     └─ planet.service.js
│     │  ├─ auth
│     │  │  ├─ auth.controller.js
│     │  │  ├─ auth.service.js
│     │  │  └─ auth.validation.js
│     │  ├─ chatbot
│     │  │  ├─ chatbot.controller.js
│     │  │  ├─ chatbot.service.js
│     │  │  └─ chatbot.validation.js
│     │  ├─ dashboard
│     │  ├─ news
│     │  ├─ observatory
│     │  │  ├─ observatory.controller.js
│     │  │  └─ observatory.service.js
│     │  ├─ recommendation
│     │  │  ├─ recommendation.controller.js
│     │  │  ├─ recommendation.service.js
│     │  │  └─ recommendation.validation.js
│     │  └─ user
│     ├─ server.js
│     ├─ services
│     │  ├─ analytics
│     │  │  └─ analytics.service.js
│     │  ├─ chatbot
│     │  │  ├─ intent.service.js
│     │  │  ├─ memory.service.js
│     │  │  ├─ prompt.service.js
│     │  │  └─ recommendation.service.js
│     │  └─ external
│     │     ├─ maps.service.js
│     │     ├─ nasa.service.js
│     │     ├─ news.service.js
│     │     └─ weather.service.js
│     └─ utils
│        ├─ AppError.js
│        ├─ asyncHandler.js
│        ├─ fuzzyMatch.js
│        ├─ jwt.util.js
│        ├─ normalize.js
│        └─ response.util.js
├─ DOCS
├─ FRONTEND
│  ├─ eslint.config.js
│  ├─ index.css
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  └─ icons.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ chatbot
│  │  │  │  ├─ ChatBubble.jsx
│  │  │  │  ├─ ChatInput.jsx
│  │  │  │  ├─ ChatWidget.jsx
│  │  │  │  ├─ ChatWindow.jsx
│  │  │  │  ├─ MessageBubble.jsx
│  │  │  │  ├─ MessageList.jsx
│  │  │  │  └─ TypingIndicator.jsx
│  │  │  ├─ common
│  │  │  │  ├─ Footer.jsx
│  │  │  │  ├─ Loader.jsx
│  │  │  │  └─ Navbar.jsx
│  │  │  └─ lovable
│  │  │     ├─ Footer.jsx
│  │  │     ├─ Navbar.jsx
│  │  │     └─ PageShell.jsx
│  │  ├─ context
│  │  │  ├─ AuthContext.jsx
│  │  │  └─ ChatbotContext.jsx
│  │  ├─ hooks
│  │  │  ├─ useAuth.js
│  │  │  ├─ useChatbot.js
│  │  │  └─ useLocation.js
│  │  ├─ lovable-import
│  │  │  ├─ bun.lock
│  │  │  ├─ bunfig.toml
│  │  │  ├─ components.json
│  │  │  ├─ eslint.config.js
│  │  │  ├─ gitignore
│  │  │  ├─ package.json
│  │  │  ├─ prettierignore
│  │  │  ├─ prettierrc
│  │  │  ├─ src
│  │  │  │  ├─ assets
│  │  │  │  │  ├─ earth.png
│  │  │  │  │  ├─ jupiter.png
│  │  │  │  │  ├─ mars.png
│  │  │  │  │  ├─ mercury.png
│  │  │  │  │  ├─ neptune.png
│  │  │  │  │  ├─ saturn.png
│  │  │  │  │  ├─ starfield.jpg
│  │  │  │  │  ├─ sun.jpg
│  │  │  │  │  ├─ uranus.png
│  │  │  │  │  └─ venus.png
│  │  │  │  ├─ components
│  │  │  │  │  ├─ Footer.tsx
│  │  │  │  │  ├─ HyperspaceTransition.tsx
│  │  │  │  │  ├─ Navbar.tsx
│  │  │  │  │  ├─ PageShell.tsx
│  │  │  │  │  ├─ Planet3DStage.tsx
│  │  │  │  │  ├─ PlanetCinematic.tsx
│  │  │  │  │  ├─ SolarSystemStage.tsx
│  │  │  │  │  ├─ Starfield.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     ├─ accordion.tsx
│  │  │  │  │     ├─ alert-dialog.tsx
│  │  │  │  │     ├─ alert.tsx
│  │  │  │  │     ├─ aspect-ratio.tsx
│  │  │  │  │     ├─ avatar.tsx
│  │  │  │  │     ├─ badge.tsx
│  │  │  │  │     ├─ breadcrumb.tsx
│  │  │  │  │     ├─ button.tsx
│  │  │  │  │     ├─ calendar.tsx
│  │  │  │  │     ├─ card.tsx
│  │  │  │  │     ├─ carousel.tsx
│  │  │  │  │     ├─ chart.tsx
│  │  │  │  │     ├─ checkbox.tsx
│  │  │  │  │     ├─ collapsible.tsx
│  │  │  │  │     ├─ command.tsx
│  │  │  │  │     ├─ context-menu.tsx
│  │  │  │  │     ├─ dialog.tsx
│  │  │  │  │     ├─ drawer.tsx
│  │  │  │  │     ├─ dropdown-menu.tsx
│  │  │  │  │     ├─ form.tsx
│  │  │  │  │     ├─ hover-card.tsx
│  │  │  │  │     ├─ input-otp.tsx
│  │  │  │  │     ├─ input.tsx
│  │  │  │  │     ├─ label.tsx
│  │  │  │  │     ├─ menubar.tsx
│  │  │  │  │     ├─ navigation-menu.tsx
│  │  │  │  │     ├─ pagination.tsx
│  │  │  │  │     ├─ popover.tsx
│  │  │  │  │     ├─ progress.tsx
│  │  │  │  │     ├─ radio-group.tsx
│  │  │  │  │     ├─ resizable.tsx
│  │  │  │  │     ├─ scroll-area.tsx
│  │  │  │  │     ├─ select.tsx
│  │  │  │  │     ├─ separator.tsx
│  │  │  │  │     ├─ sheet.tsx
│  │  │  │  │     ├─ sidebar.tsx
│  │  │  │  │     ├─ skeleton.tsx
│  │  │  │  │     ├─ slider.tsx
│  │  │  │  │     ├─ sonner.tsx
│  │  │  │  │     ├─ switch.tsx
│  │  │  │  │     ├─ table.tsx
│  │  │  │  │     ├─ tabs.tsx
│  │  │  │  │     ├─ textarea.tsx
│  │  │  │  │     ├─ toggle-group.tsx
│  │  │  │  │     ├─ toggle.tsx
│  │  │  │  │     └─ tooltip.tsx
│  │  │  │  ├─ hooks
│  │  │  │  │  └─ use-mobile.tsx
│  │  │  │  ├─ lib
│  │  │  │  │  ├─ api
│  │  │  │  │  │  └─ example.functions.ts
│  │  │  │  │  ├─ config.server.ts
│  │  │  │  │  ├─ error-capture.ts
│  │  │  │  │  ├─ error-page.ts
│  │  │  │  │  ├─ lovable-error-reporting.ts
│  │  │  │  │  ├─ planets.ts
│  │  │  │  │  └─ utils.ts
│  │  │  │  ├─ server.ts
│  │  │  │  ├─ start.ts
│  │  │  │  └─ styles.css
│  │  │  ├─ tsconfig.json
│  │  │  └─ vite.config.ts
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ Constellation.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Home.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ lovable
│  │  │  │  ├─ Assistant.jsx
│  │  │  │  ├─ Constellations.jsx
│  │  │  │  ├─ Dashboard.jsx
│  │  │  │  ├─ Home.jsx
│  │  │  │  ├─ News.jsx
│  │  │  │  ├─ Observatory.jsx
│  │  │  │  ├─ PlanetDetail.jsx
│  │  │  │  ├─ Planets.jsx
│  │  │  │  ├─ Profile.jsx
│  │  │  │  └─ Register.jsx
│  │  │  ├─ News.jsx
│  │  │  ├─ Observatory.jsx
│  │  │  ├─ Planets.jsx
│  │  │  ├─ Profile.jsx
│  │  │  └─ Register.jsx
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  ├─ astronomy.api.js
│  │  │  ├─ auth.api.js
│  │  │  ├─ chatbot.api.js
│  │  │  ├─ dashboard.api.js
│  │  │  ├─ news.api.js
│  │  │  ├─ observatory.api.js
│  │  │  └─ user.api.js
│  │  └─ utils
│  │     ├─ astronomyData.js
│  │     ├─ constants.js
│  │     ├─ formatDate.js
│  │     └─ helper.js
│  ├─ tailwind.config.js
│  ├─ vercel.json
│  └─ vite.config.js
└─ README.md

```