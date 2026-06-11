# AI-driven-Cosmovision
AI-Driven Sky Gazing Portal - eProject Aptech

```
COSMOVISION-AI
├─ BACKEND
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
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
│     │  ├─ auth
│     │  │  ├─ auth.controller.js
│     │  │  ├─ auth.service.js
│     │  │  ├─ auth.utils.js
│     │  │  └─ auth.validation.js
│     │  ├─ chatbot
│     │  │  ├─ chatbot.controller.js
│     │  │  ├─ chatbot.service.js
│     │  │  ├─ intent.service.js
│     │  │  └─ prompt.service.js
│     │  ├─ dashboard
│     │  ├─ news
│     │  ├─ recommendation
│     │  └─ user
│     ├─ repositories
│     │  ├─ chat.repository.js
│     │  ├─ observatory.repository.js
│     │  ├─ planet.repository.js
│     │  └─ user.repository.js
│     ├─ server.js
│     ├─ services
│     │  ├─ ai
│     │  │  ├─ intent.service.js
│     │  │  ├─ memory.service.js
│     │  │  ├─ prompt.service.js
│     │  │  └─ recommendation.service.js
│     │  ├─ analytics
│     │  │  └─ analytics.service.js
│     │  └─ external
│     │     ├─ maps.service.js
│     │     ├─ nasa.service.js
│     │     ├─ news.service.js
│     │     └─ weather.service.js
│     └─ utils
│        ├─ asyncHandler.js
│        ├─ constants.js
│        ├─ jwt.util.js
│        ├─ logger.js
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
│  │  │  └─ common
│  │  │     ├─ Footer.jsx
│  │  │     ├─ Loader.jsx
│  │  │     └─ Navbar.jsx
│  │  ├─ context
│  │  │  ├─ AuthContext.jsx
│  │  │  └─ ChatbotContext.jsx
│  │  ├─ hooks
│  │  │  ├─ useAuth.js
│  │  │  ├─ useChatbot.js
│  │  │  └─ useLocation.js
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ Constellation.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Home.jsx
│  │  │  ├─ Login.jsx
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
│  │     ├─ constants.js
│  │     ├─ formatDate.js
│  │     └─ helper.js
│  ├─ vercel.json
│  └─ vite.config.js
└─ README.md

```