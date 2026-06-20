## 1. Tổng quan dự án (Project Overview)
- **Công nghệ chính**: Node.js, Prisma ORM, JavaScript, Express.js ,PostgreSQL (Neon).
- **Mục tiêu ứng dụng**:  Ứng dụng cung cấp kiến thức thiên văn học và tích hợp Chatbot AI.
- **Các Module đã hoàn thành**:
  * `auth`: Quản lý xác thực, phân quyền người dùng.
  * `chatbot`: Xử lý logic hội thoại tích hợp AI.(hiện chưa có API NASA , Weather)

---

COSMOVISION-AI
├─ BACKEND
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ migrations
│  │  │  ├─ 20260611081449_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260617053138_add_verification_token
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260618173913_update_planet_schema
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260618175057_update_observatory_schema
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
│     │  ├─ recommendation
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
│  └─ ProjectContext.md
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
│  │     ├─ astronomyData.js
│  │     ├─ constants.js
│  │     ├─ formatDate.js
│  │     └─ helper.js
│  ├─ tailwind.config.js
│  ├─ vercel.json
│  └─ vite.config.js
└─ README.md

--------------------DATABASE--------------------

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id                 String             @id @default(cuid())
  email              String             @unique
  username           String             @unique
  passwordHash       String?
  displayName        String?
  avatarUrl          String?
  role               Role               @default(USER)
  provider           Provider           @default(LOCAL)
  providerId         String?
  isVerified         Boolean            @default(false)
  verificationToken  String?            @unique
  isActive           Boolean            @default(true)
  lastLoginAt        DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  analytics          Analytics[]
  chatSessions       ChatSession[]
  imageUploads       ImageUpload[]
  recommendations    Recommendation[]
  refreshTokens      RefreshToken[]
  savedEvents        SavedEvent[]
  savedObservatories SavedObservatory[]
  preferences        UserPreference?
  profile            UserProfile?

  @@map("users")
}

model ChatSession {
  id        String        @id @default(cuid())
  userId    String
  title     String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("chat_sessions")
}

model ChatMessage {
  id         String      @id @default(cuid())
  sessionId  String
  role       String
  content    String
  intent     IntentType  @default(UNKNOWN)
  tokensUsed Int?
  modelUsed  String?     @default("llama-3.1-8b-instant")
  createdAt  DateTime    @default(now())
  session    ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("chat_messages")
}

model Planet {
  id                  String   @id @default(cuid())

  name                String   @unique
  slug                String   @unique

  type                String
  description         String

  imageUrl            String?

  massKg              Float?
  diameterKm          Float?
  gravityMs2          Float?

  distanceFromSunAu   Float?
  distanceFromEarthKm Float?

  orbitalPeriodDays   Float?
  rotationPeriodHours Float?

  avgTempCelsius      Float?

  atmosphere          String[] @default([])

  numberOfMoons       Int?     @default(0)
  hasRings            Boolean  @default(false)

  discoveredBy        String?
  discoveryYear       Int?
  
  aiFunFacts          String[] @default([])
  isVisible           Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("planets")
}
