# AI Driven Cosmovision

Documentation

Authors

Batch: ________

Group: Group 2

Members:

- ______________________________
- ______________________________
- ______________________________
- ______________________________

Date: ____ / ____ / 2026

Instructor: ______________________________

Hanoi, ____ / ____ / 2026

# Index

1. Problem Definition
2. Customer Requirements Specification
3. System Designs
4. Task Sheet
5. Validation Checklists

# 1. Problem Definition

## 1.1. Problem Abstraction

AI Driven Cosmovision is an AI-assisted astronomy learning and stargazing web portal. The project combines a modern single page web application, a REST API backend, a PostgreSQL database, external astronomy/weather/news services, and AI modules to help users explore planets, constellations, observatories, astronomy news, and personalized stargazing recommendations.

Astronomy learners often need to gather information from many separate websites: planet facts, constellation visibility, weather conditions, nearby observatories, and recent astronomy news. These sources are usually static and do not adapt to a user's location, interests, experience level, or current sky conditions. AI Driven Cosmovision addresses this problem by creating one integrated portal where users can learn, search, ask questions, upload constellation images for recognition, and receive contextual recommendations.

The system is designed for students, astronomy beginners, casual sky watchers, and administrators who maintain astronomy content. It emphasizes responsive design, secure user accounts, AI-powered assistance, and practical astronomy workflows.

## 1.2. The Current System

Without the proposed application, users normally follow a manual workflow:

- Search planet and constellation facts on static websites.
- Use separate weather applications to judge whether the sky is clear.
- Search manually for observatories and stargazing locations.
- Read long astronomy articles without simplified AI summaries.
- Ask astronomy questions through general search engines or unrelated chat tools.
- Save interesting objects or events outside the astronomy learning platform.

This process is fragmented, repetitive, and difficult for beginners. The user must understand which data is relevant, compare many sources, and decide whether tonight is suitable for sky observation. There is also no unified profile, recommendation history, learning history, or AI-guided experience.

## 1.3. The Proposed System

AI Driven Cosmovision proposes a dynamic astronomy portal with the following major functions:

- User registration, login, email verification, profile, preferences, and saved items.
- Planet catalog with detail pages, facts, related objects, and admin management.
- Constellation catalog with month-based browsing, AI content, gallery images, related constellations, and image recognition from uploaded sky images.
- AI astronomy chatbot for question answering, learning support, portal guidance, and contextual recommendations.
- Personalized stargazing recommendations based on user location, weather, visible planets, visible constellations, observatories, and AI-generated suggestions.
- Observatory discovery with nearby search, detail pages, saving, ratings, sky quality, light pollution score, equipment, and admin management.
- Astronomy news module with fetched news, NASA/exoplanet sources, AI summary, AI category, importance, tags, and explanation helpers.
- Dashboard showing astronomy highlights, sky visibility information, recommendations, and activity data.
- Smart search across supported astronomy domains using query parsing and ranking.
- Analytics module for tracking page views, searches, recommendation requests, uploads, and popular content.

## 1.3.1. Boundaries of the System

The system focuses on astronomy learning, stargazing planning, and content discovery. It does not attempt to replace professional astronomical observatory software or scientific-grade telescope control systems.

Scope included:

- Public users can browse planets, constellations, observatories, news, dashboard data, and search results.
- Registered users can use protected functions such as chatbot history, recommendations, profile/preferences, saved events, saved observatories, image uploads, and constellation recognition.
- Admin users can manage catalog content such as planets, constellations, observatories, and news.
- The system integrates with external APIs for AI responses, weather, maps/geolocation, NASA/news data, and email.
- Local ML scripts support constellation recognition training and prediction, with fallback to vision AI when the local classifier is unavailable.

Scope excluded:

- Telescope hardware control.
- Professional astronomical calculations requiring observatory-grade precision.
- Payment, subscription, or commercial booking workflow.
- Native mobile applications.
- Offline-first synchronization.

## 1.3.2. Hardware and Software Requirements

Hardware requirements:

| Component | Minimum Requirement |
| --- | --- |
| Processor | Intel Core i3/i5 or equivalent |
| Memory | 8 GB RAM or higher |
| Storage | 500 GB HDD/SSD recommended |
| Display | Color display supporting modern browser UI |
| Input devices | Keyboard and mouse |
| Network | Internet connection for external APIs and package installation |

Software requirements:

| Layer | Technology |
| --- | --- |
| Operating system | Windows 10/11 or compatible development OS |
| Browser | Chrome, Edge, Firefox, or Safari |
| Frontend runtime | Node.js 20+, npm |
| Frontend framework | React 19, Vite, React Router, Tailwind CSS, Three.js |
| Backend runtime | Node.js 20+, Express 5 |
| Database | PostgreSQL |
| ORM | Prisma |
| AI/LLM | Groq SDK, configured Groq text and vision models |
| ML scripts | Python virtual environment with packages from `BACKEND/ml/requirements.txt` |
| External APIs | NASA API, OpenWeather API, maps/geolocation service, news sources, SMTP email |

# 2. Customer Requirements Specification

## 2.1. Users of the System

| User type | Description | Main permissions |
| --- | --- | --- |
| Guest user | Visitor who has not logged in. | Browse public astronomy content, dashboard, news, observatories, planet and constellation pages, and public search. |
| Registered user | User with verified account. | Use chatbot, create recommendation requests, save observatories/events, update profile/preferences, view upload and recommendation history. |
| Admin user | Authorized content manager. | Create, update, delete, refresh, fetch, and summarize managed astronomy content. |

## 2.2. System Functions

### 2.2.1. Authentication and User Profile

Input:

- Email, username, password, display name, verification token, login credentials.

Processing:

- Validate user input.
- Hash password with bcrypt.
- Create local account and verification token.
- Send verification email using SMTP.
- Authenticate users with JWT.
- Load and update profile and preference records.

Output:

- Registration response, login token, authenticated user profile, updated preferences, verification status.

Stored data:

- `User`, `UserProfile`, `UserPreference`, and `RefreshToken`.

### 2.2.2. Planet Information System

Input:

- Planet list filters, planet slug, admin planet form, AI fact refresh request.

Processing:

- Fetch planet catalog from PostgreSQL.
- Retrieve detail by slug.
- Generate or refresh AI fun facts where supported.
- Suggest related planet content.
- Allow admin-only create, update, and delete operations.

Output:

- Planet cards, detail page, facts page, related planet suggestions, admin mutation result.

Stored data:

- `Planet`.

### 2.2.3. Constellation Information and Recognition

Input:

- Constellation filters, month parameter, slug, uploaded image, admin catalog form.

Processing:

- Fetch constellation catalog and detail data.
- Load gallery images and cached AI content.
- Recognize uploaded night sky image using local CLIP classifier if available.
- Fall back to configured vision AI when local classifier is unavailable.
- Store upload metadata, recognition result, confidence score, and AI analysis.

Output:

- Constellation catalog, detail page, gallery, AI mythology/facts/observer tips, recognition result and upload history.

Stored data:

- `Constellation`, `ConstellationImage`, and `ImageUpload`.

### 2.2.4. AI Astronomy Chatbot

Input:

- Authenticated user message and chat session context.

Processing:

- Detect user intent such as planet information, constellation information, weather check, observatory search, image recognition, or general astronomy.
- Build contextual prompt with user profile, preferences, and relevant astronomy data.
- Send prompt to configured LLM.
- Persist conversation messages and metadata.

Output:

- AI answer, intent, session list, chat history.

Stored data:

- `ChatSession` and `ChatMessage`.

### 2.2.5. Personalized Stargazing Recommendations

Input:

- Latitude, longitude, optional location name, authenticated user profile.

Processing:

- Validate coordinates.
- Fetch or reuse weather cache.
- Calculate sky visibility score.
- Determine likely visible planets and constellations.
- Find nearby observatories.
- Generate AI suggestion.
- Cache recommendation with expiration.

Output:

- Best viewing time, weather condition, visibility score, visible planets, visible constellations, nearby observatories, AI suggestion.

Stored data:

- `Recommendation`, `WeatherCache`, `Observatory`, and user preferences.

### 2.2.6. Observatory Recommendation and Discovery

Input:

- Search/filter query, coordinates, observatory slug, save/unsave action, admin observatory form.

Processing:

- List observatories by active status, province, rating, featured flag, and distance.
- Calculate nearby observatories from coordinates.
- Allow authenticated users to save observatories.
- Allow admin-only create, update, and delete operations.

Output:

- Observatory list, nearby results, detail page, saved status, statistics, admin mutation result.

Stored data:

- `Observatory` and `SavedObservatory`.

### 2.2.7. Astronomy News and AI Summarizer

Input:

- News filter, slug, admin news form, fetch/refresh command, AI summary/category/tag requests.

Processing:

- Fetch news from external services.
- Store normalized news articles.
- Generate AI summaries and metadata.
- Provide dashboard highlights.
- Allow admin content maintenance.

Output:

- News list, news detail, dashboard highlights, AI summary, AI category, tags, importance, explanation, question helper.

Stored data:

- `NewsArticle`.

### 2.2.8. Smart Search

Input:

- Natural language query or structured search request.

Processing:

- Parse query intent.
- Search across supported domains such as planets, constellations, observatories, and news.
- Rank results with domain adapters and scoring logic.
- Track search analytics when available.

Output:

- Ranked search results with entity type, title, description, and navigation target.

Stored data:

- Search itself is computed from domain tables; `Analytics` may store search activity.

### 2.2.9. Dashboard and Analytics

Input:

- Optional coordinates, authenticated user context, analytics tracking events.

Processing:

- Aggregate recent content, sky visibility data, recommendations, and activity metrics.
- Track events such as page view, planet view, constellation view, chatbot message, news view, recommendation request, observatory view, image upload, and search.
- Provide admin analytics dashboards and popular entity lists.

Output:

- Dashboard view, public dashboard response, analytics overview, recent activities, popular entities.

Stored data:

- `Analytics` plus related astronomy content tables.

# 3. System Designs

## 3.1. Entity Relationship Diagram

The main database relationships are:

```text
User 1--1 UserProfile
User 1--1 UserPreference
User 1--N RefreshToken
User 1--N ChatSession
ChatSession 1--N ChatMessage
User 1--N Recommendation
User 1--N SavedEvent
CelestialEvent 1--N SavedEvent
User 1--N SavedObservatory
Observatory 1--N SavedObservatory
User 1--N ImageUpload
Constellation 1--N ImageUpload
Constellation 1--N ConstellationImage
User 1--N Analytics
```

Core independent catalog entities:

- `Planet`
- `Constellation`
- `Observatory`
- `NewsArticle`
- `CelestialEvent`
- `WeatherCache`

## 3.2. Database Design

| Table / Model | Purpose | Important fields |
| --- | --- | --- |
| User | Stores account identity and access role. | email, username, passwordHash, role, provider, isVerified, isActive |
| UserProfile | Stores personal profile data. | bio, location, latitude, longitude, timezone, website |
| UserPreference | Stores learning and display preferences. | favorite planets, favorite constellations, experience level, units, alerts |
| RefreshToken | Stores refresh/session tokens. | userId, token, expiresAt |
| Planet | Stores planet catalog data. | name, slug, type, description, mass, diameter, gravity, rings, moons, AI facts |
| Constellation | Stores constellation catalog data. | name, slug, latinName, abbreviation, coordinates, bestMonth, AI content |
| ConstellationImage | Stores gallery images for constellation pages. | constellationId, url, title, source, license, sortOrder |
| ImageUpload | Stores uploaded constellation recognition images. | userId, originalUrl, recognizedConstellation, confidenceScore, aiAnalysis |
| CelestialEvent | Stores astronomy events. | title, slug, type, startDate, peakDate, visibleFrom, aiSummary |
| SavedEvent | Links users to saved events. | userId, eventId, savedAt |
| ChatSession | Groups user chatbot conversations. | userId, title, createdAt, updatedAt |
| ChatMessage | Stores chatbot message history. | sessionId, role, content, intent, tokensUsed, modelUsed |
| NewsArticle | Stores astronomy news. | title, slug, source, sourceUrl, publishedAt, summary, aiSummary, tags |
| Recommendation | Stores stargazing recommendation results. | userId, coordinates, weather, skyVisibilityScore, visible objects, AI suggestion |
| Observatory | Stores observatory and stargazing site data. | name, slug, coordinates, address, equipment, rating, skyQualityScore |
| SavedObservatory | Links users to saved observatories. | userId, observatoryId, savedAt |
| Analytics | Stores behavior tracking events. | event, entityType, entityId, ipAddress, userAgent, metadata |
| WeatherCache | Caches weather lookups by rounded coordinates. | latRounded, lonRounded, condition, temperature, cloudCover, expiresAt |

Normalization notes:

- User profile and preferences are separated from user identity to keep authentication data small and secure.
- Many-to-many user saving behavior is represented through join tables (`SavedEvent`, `SavedObservatory`).
- Chat sessions and messages are separated so conversation history can be loaded efficiently.
- Catalog content such as planets, constellations, observatories, and news is stored independently.
- Cached and generated values such as weather cache, AI summaries, AI facts, and AI suggestions are stored to reduce repeated external API calls.

## 3.3. Sitemap

```text
Home (/)
├── Login (/login)
├── Register (/register)
├── Verify Email (/verify-email, /verify-email-sent)
├── Planets (/planets)
│   ├── Planet Detail (/planets/:slug)
│   └── Planet Facts (/planets/:slug/facts)
├── Constellations (/constellations)
│   └── Constellation Detail (/constellations/:slug)
├── Observatory (/observatory)
│   └── Observatory Detail (/observatory/:slug)
├── News (/news)
├── Dashboard (/dashboard)
├── Assistant (/assistant)
└── Profile (/profile, authenticated)
```

The application uses a shared header, footer, and chatbot widget around the route content. Public pages are accessible to all visitors, while profile and several API workflows require authentication.

## 3.4. System Functions Design

### 3.4.1. User Registration and Login Flow

```text
Start
User submits registration form
Validate input
Check duplicate email/username
Hash password
Create User, UserProfile, UserPreference
Generate verification token
Send verification email
User verifies email
User logs in
Backend validates password
Backend returns JWT and user profile
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/admin/login` | Login admin |
| POST | `/api/auth/verify-email` | Verify email by token |
| GET | `/api/auth/me` | Load authenticated user |

### 3.4.2. Planet Browsing Flow

```text
Start
User opens Planets page
Frontend calls planet list API
Backend queries Planet table
Frontend renders cards and filters
User opens a planet detail page
Backend loads planet by slug
Frontend renders detail, facts, and related content
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/astronomy/planets` | List planets |
| GET | `/api/astronomy/planets/:slug` | Planet detail |
| GET | `/api/astronomy/planets/:slug/facts` | Planet facts |
| GET | `/api/astronomy/planets/:slug/related` | Related planet |

### 3.4.3. Constellation Recognition Flow

```text
Start
Authenticated user uploads night sky image
Backend validates authentication
Multer stores uploaded image
Recognition service checks local classifier
If classifier exists: predict with Python CLIP model
Else: use configured vision AI fallback
Backend stores ImageUpload result
Frontend displays recognized constellation, confidence, and AI analysis
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/astronomy/constellations` | List constellations |
| GET | `/api/astronomy/constellations/month/:month` | List by best month |
| POST | `/api/astronomy/constellations/recognize` | Recognize uploaded image |
| GET | `/api/astronomy/constellations/uploads/me` | User upload history |
| GET | `/api/astronomy/constellations/:slug/gallery` | Gallery images |
| GET | `/api/astronomy/constellations/:slug/ai-content` | AI content |

### 3.4.4. Recommendation Flow

```text
Start
Authenticated user allows location or enters location
Frontend sends coordinates
Backend validates latitude and longitude
Backend checks weather cache
Backend calculates visibility score
Backend determines visible planets and constellations
Backend finds nearby observatories
Backend asks AI for final suggestion
Backend stores recommendation
Frontend displays stargazing plan
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/recommendations` | Create recommendation |
| GET | `/api/recommendations` | User recommendation history |
| GET | `/api/recommendations/:id` | Recommendation detail |
| POST | `/api/recommendations/:id/refresh` | Refresh recommendation |

### 3.4.5. Chatbot Flow

```text
Start
Authenticated user submits message
Backend validates message schema
Intent service classifies query
Context service gathers profile and astronomy context
Prompt service builds LLM prompt
LLM service requests AI response
Memory service stores user and assistant messages
Frontend renders response and updates session history
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/chatbot/message` | Send chatbot message |
| GET | `/api/chatbot/sessions` | List chat sessions |
| GET | `/api/chatbot/history` | Get conversation history |
| DELETE | `/api/chatbot/history` | Clear conversation history |

### 3.4.6. Observatory Flow

```text
Start
User opens Observatory page
Frontend calls list or nearby endpoint
Backend filters active observatories
If coordinates are provided: calculate distance
Frontend displays observatory cards
User opens detail or saves an observatory
Backend returns detail and saved state
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/observatory` | List observatories |
| GET | `/api/observatory/nearby` | Nearby observatories |
| GET | `/api/observatory/stats` | Observatory statistics |
| GET | `/api/observatory/:slug` | Observatory detail |
| POST | `/api/observatory/:id/save` | Save/unsave observatory |

### 3.4.7. News and AI Summary Flow

```text
Start
User opens News page
Frontend requests latest articles
Backend returns stored news articles
User opens an article detail
Admin may fetch, refresh, summarize, categorize, or tag articles
AI service stores generated metadata
End
```

Main API endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/news` | List news |
| GET | `/api/news/:slug` | News detail |
| GET | `/api/news/dashboard/highlights` | Dashboard news highlights |
| POST | `/api/news/fetch` | Admin fetch news |
| POST | `/api/news/:id/ai/summary` | Admin generate AI summary |

# 4. Task Sheet

| No. | Task | Responsible member | Start date | Finish date | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Requirement analysis and project scope definition |  |  |  | Planned |
| 2 | Database schema design with Prisma and PostgreSQL |  |  |  | Planned |
| 3 | Backend project setup, middleware, environment configuration |  |  |  | Planned |
| 4 | Authentication, email verification, user profile and preferences |  |  |  | Planned |
| 5 | Planet catalog API and frontend pages |  |  |  | Planned |
| 6 | Constellation catalog, gallery, AI content, and recognition API |  |  |  | Planned |
| 7 | Chatbot intent/context/prompt/memory services |  |  |  | Planned |
| 8 | Stargazing recommendation service with weather and observatory data |  |  |  | Planned |
| 9 | Observatory module and saved observatory workflow |  |  |  | Planned |
| 10 | News module, fetching, and AI summarization |  |  |  | Planned |
| 11 | Dashboard, search, and analytics modules |  |  |  | Planned |
| 12 | Frontend UI integration, responsive design, and Three.js visuals |  |  |  | Planned |
| 13 | Testing, validation checklist, bug fixing |  |  |  | Planned |
| 14 | Documentation, demo preparation, and final packaging |  |  |  | Planned |

# 5. Validation Checklists

## 5.1. Functional Validation

| No. | Test case | Expected result | Pass/Fail |
| --- | --- | --- | --- |
| 1 | Register a new account with valid details. | Account is created and verification email/token is generated. |  |
| 2 | Login with correct credentials. | JWT token and user profile are returned. |  |
| 3 | Open planet list and planet detail pages. | Planet data is displayed correctly. |  |
| 4 | Open constellation list and detail pages. | Constellation data, gallery, and AI content are displayed. |  |
| 5 | Upload a night sky image for recognition. | Recognition result, confidence, and analysis are displayed and stored. |  |
| 6 | Send a chatbot message. | AI response is returned and stored in chat history. |  |
| 7 | Request stargazing recommendation with coordinates. | Weather, visibility score, visible objects, nearby observatories, and AI suggestion are returned. |  |
| 8 | Search using a natural language query. | Relevant ranked results are displayed. |  |
| 9 | View nearby observatories. | Observatories are sorted or filtered by location. |  |
| 10 | Save and unsave an observatory. | Saved state is updated for the authenticated user. |  |
| 11 | View news list and detail. | News data and AI summaries are shown. |  |
| 12 | Admin creates/updates/deletes managed content. | Only admin users can perform mutation operations. |  |

## 5.2. Non-Functional Validation

| No. | Area | Checklist item | Pass/Fail |
| --- | --- | --- | --- |
| 1 | Responsiveness | UI works on desktop, tablet, and mobile browser sizes. |  |
| 2 | Security | Protected APIs reject unauthenticated requests. |  |
| 3 | Role control | Admin-only APIs reject normal users. |  |
| 4 | Validation | Invalid request bodies return clear validation errors. |  |
| 5 | Performance | Main pages load without unnecessary blocking operations. |  |
| 6 | Error handling | API errors use consistent JSON responses. |  |
| 7 | Data privacy | Passwords are hashed and secrets are stored in `.env`. |  |
| 8 | Compatibility | Application runs on modern Chrome, Edge, Firefox, and Safari. |  |
| 9 | Maintainability | Backend modules follow controller/service/routes structure. |  |
| 10 | Documentation | Installation, environment variables, database setup, and run commands are documented. |  |

## 5.3. Installation Instructions

Backend:

```bash
cd BACKEND
npm install
create BACKEND/.env with the required backend environment variables
npm run db:push
npm run db:seed
npm run dev
```

Frontend:

```bash
cd FRONTEND
npm install
create FRONTEND/.env with VITE_API_URL
npm run dev
```

Required environment values include:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `CLIENT_URLS`
- `GROQ_API_KEY`
- `NASA_API_KEY`
- `OPENWEATHER_API_KEY`
- SMTP configuration for email verification
- `VITE_API_URL`

## 5.4. Assumptions

- The database uses PostgreSQL and is reachable through the configured `DATABASE_URL`.
- External AI, weather, NASA/news, maps, and SMTP services are available through valid API keys.
- Constellation recognition can use the local Python classifier when trained artifacts exist; otherwise the system can use the configured vision model fallback.
- Users allow location access or provide coordinates manually for location-based recommendations.
- Group member names are intentionally left blank for manual completion.
