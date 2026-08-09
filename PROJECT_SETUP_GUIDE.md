# Legacy Lens — Project Setup & Initialization Guide

> This file is written to be used directly as a prompt/instruction set for an AI coding agent (e.g. Antigravity) to scaffold the full repository. Paste this whole file as the task, or feed it section by section.

## 0. What you are building

A single Git monorepo named `legacy-lens` containing three applications that all belong to one product:

1. **`mobile-app/`** — React Native (Expo, TypeScript) app used by elders, youth content creators, and youth learners.
2. **`admin-dashboard/`** — Angular app used by moderators/admins.
3. **`backend/`** — Spring Boot (Java 17) REST API used by both frontends, backed by PostgreSQL.

All three are organized around the same four functional modules, so the folder structure should mirror this consistently across all three apps:

| Module key | Meaning |
|---|---|
| `content-capture` | Elder content capturing & management (Member A) |
| `marketplace` | Youth content creator & marketplace (Member B) |
| `archive` | Archive, discovery & platform administration (Member C) |
| `learning` | Learning engine (Member D) |
| `auth` / `users` | Shared across all modules — accounts, profiles, roles |

---

## 1. Target repository structure

```
legacy-lens/
├── mobile-app/                      # React Native (Expo) app
├── admin-dashboard/                 # Angular app
├── backend/                         # Spring Boot app
├── docs/                            # Project charter, diagrams, research plan, etc.
│   ├── project-charter.docx
│   ├── architecture/
│   └── research/
├── .gitignore
├── .editorconfig
├── README.md
└── docker-compose.yml               # Local Postgres for development
```

---

## 2. Step 1 — Initialize the root repository

```bash
mkdir legacy-lens && cd legacy-lens
git init
git branch -M main
git checkout -b dev
```

Branching model to use for the rest of the project:
- `main` — always demo-ready, only updated via merge from `dev` at the end of a sprint
- `dev` — integration branch, all feature branches merge here first
- `feature/<module>-<short-description>` — one branch per task, e.g. `feature/content-capture-recording-ui`

Create the root `.gitignore` covering all three stacks:

```
# Node / React Native / Angular
node_modules/
dist/
.expo/
.expo-shared/
*.log
npm-debug.log*

# Java / Spring Boot
target/
*.class
*.jar
.mvn/
!.mvn/wrapper/maven-wrapper.jar

# Environment files
.env
.env.local
*.env

# IDE
.vscode/
.idea/
*.iml

# OS
.DS_Store
Thumbs.db
```

Add a root `.editorconfig`:

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.java]
indent_size = 4
```

---

## 3. Step 2 — Initialize the Spring Boot backend

From the repo root:

```bash
cd backend  # create this folder first, or use Spring Initializr to generate it directly
```

Use [Spring Initializr](https://start.spring.io) (web UI or CLI) with:

- **Project:** Maven
- **Language:** Java 17
- **Spring Boot version:** latest stable 3.x
- **Group:** `lk.ac.sliit`
- **Artifact:** `legacy-lens-backend`
- **Dependencies:** Spring Web, Spring Data JPA, PostgreSQL Driver, Spring Security, Validation, Lombok, Spring Boot DevTools

CLI equivalent:

```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,postgresql,security,validation,lombok,devtools \
  -d type=maven-project \
  -d language=java \
  -d javaVersion=17 \
  -d groupId=lk.ac.sliit \
  -d artifactId=legacy-lens-backend \
  -d name=legacy-lens-backend \
  -o backend.zip
unzip backend.zip -d backend && rm backend.zip
```

### Backend package structure (package-by-feature, one package per module)

```
backend/
└── src/main/java/lk/ac/sliit/legacylens/
    ├── LegacyLensApplication.java
    ├── config/
    │   ├── SecurityConfig.java
    │   ├── CorsConfig.java
    │   └── SwaggerConfig.java
    ├── common/
    │   ├── exception/
    │   │   ├── GlobalExceptionHandler.java
    │   │   └── ResourceNotFoundException.java
    │   ├── dto/
    │   │   └── ApiResponse.java
    │   └── util/
    ├── auth/
    │   ├── controller/AuthController.java
    │   ├── service/AuthService.java
    │   ├── dto/
    │   └── security/JwtUtil.java
    ├── users/
    │   ├── controller/UserController.java
    │   ├── service/UserService.java
    │   ├── repository/UserRepository.java
    │   ├── entity/User.java
    │   └── dto/
    ├── contentcapture/
    │   ├── controller/ContentController.java
    │   ├── service/ContentService.java
    │   ├── repository/ContentRepository.java
    │   ├── entity/Content.java
    │   └── dto/
    ├── marketplace/
    │   ├── controller/{JobController,ApplicationController,BookingController}.java
    │   ├── service/
    │   ├── repository/
    │   ├── entity/{Job,Application,Booking}.java
    │   └── dto/
    ├── archive/
    │   ├── controller/{TagController,SearchController,ModerationController}.java
    │   ├── service/
    │   ├── repository/
    │   ├── entity/{Tag,ModerationRecord}.java
    │   └── dto/
    └── learning/
        ├── controller/{LessonController,ProgressController,QuizController}.java
        ├── service/
        ├── repository/
        ├── entity/{Lesson,Track,Progress}.java
        └── dto/
```

### Backend setup checklist

1. Configure `src/main/resources/application.yml` with placeholders (no real secrets committed):
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/legacylens
       username: ${DB_USERNAME:postgres}
       password: ${DB_PASSWORD:postgres}
     jpa:
       hibernate:
         ddl-auto: update
       show-sql: true
   server:
     port: 8080
   ```
2. Add an `application-example.yml` (committed) and keep the real `application-local.yml` gitignored.
3. Set up Spring Security with JWT filter chain and a default permit-all on `/api/v1/auth/**`.
4. Add Swagger/OpenAPI dependency and expose `/swagger-ui.html` for API documentation.
5. Confirm the app boots with `./mvnw spring-boot:run` before writing any feature code.

---

## 4. Step 3 — Initialize the React Native mobile app

From the repo root:

```bash
npx create-expo-app@latest mobile-app --template blank-typescript
cd mobile-app
npx expo install react-native-screens react-native-safe-area-context
npm install @react-navigation/native @react-navigation/native-stack
npm install axios
npm install zustand   # lightweight state management; swap for Redux Toolkit if preferred
```

### Mobile app folder structure

```
mobile-app/
└── src/
    ├── screens/
    │   ├── auth/                  # Login, onboarding (elder voice-guided + standard)
    │   ├── content-capture/       # Recording, voice typing, review
    │   ├── marketplace/           # Job posting, browse, apply, booking, messaging
    │   ├── archive/               # Feed, search, cultural map
    │   └── learning/              # Lessons, quizzes, progress
    ├── components/
    │   ├── common/                 # Buttons, cards, inputs shared across screens
    │   └── module-specific/        # Component subfolders per module, mirroring screens/
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   └── types.ts
    ├── services/
    │   ├── api/
    │   │   ├── client.ts           # Axios instance with base URL + interceptors
    │   │   ├── authApi.ts
    │   │   ├── contentApi.ts
    │   │   ├── marketplaceApi.ts
    │   │   ├── archiveApi.ts
    │   │   └── learningApi.ts
    ├── store/                      # Zustand/Redux slices, one per module
    ├── hooks/
    ├── types/                      # Shared TypeScript interfaces/DTOs
    ├── constants/
    └── theme/                      # Colors, spacing, typography
```

### Mobile app setup checklist

1. Confirm the app runs with `npx expo start` before adding feature code.
2. Set up `src/services/api/client.ts` with the backend base URL read from an environment variable (use `expo-constants` or `.env` via `react-native-dotenv`).
3. Create a `.env.example` with `API_BASE_URL=http://localhost:8080/api/v1`.
4. Set up ESLint + Prettier (`npx expo lint`) before the first feature commit.

---

## 5. Step 4 — Initialize the Angular admin dashboard

From the repo root:

```bash
npm install -g @angular/cli
ng new admin-dashboard --routing --style=scss --skip-git
cd admin-dashboard
ng generate module core
ng generate module shared
```

### Admin dashboard folder structure

```
admin-dashboard/
└── src/app/
    ├── core/                       # Singletons: auth guard, http interceptor, layout
    │   ├── guards/
    │   ├── interceptors/
    │   └── services/
    ├── shared/                     # Reusable components, pipes, directives
    ├── features/
    │   ├── moderation/             # Content moderation queue
    │   ├── verification/           # Creator verification review
    │   ├── disputes/               # Dispute resolution tools
    │   └── analytics/              # Basic analytics dashboards
    ├── app-routing.module.ts
    └── app.module.ts
```

### Admin dashboard setup checklist

1. Confirm the app runs with `ng serve` before adding feature code.
2. Create an `environments/environment.ts` and `environment.prod.ts` with `apiBaseUrl` pointing at the backend.
3. Add an HTTP interceptor for attaching the JWT token to outgoing requests.
4. Set up a route guard so only authenticated admin users can access `features/*`.

---

## 6. Step 5 — Local development database

Add a root-level `docker-compose.yml` so every team member can run the same PostgreSQL instance locally:

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16
    container_name: legacy-lens-db
    restart: always
    environment:
      POSTGRES_DB: legacylens
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - legacy_lens_pgdata:/var/lib/postgresql/data
volumes:
  legacy_lens_pgdata:
```

Run with `docker compose up -d` before starting the backend.

---

## 7. Step 6 — First commit

Once all three apps boot successfully on their own:

```bash
git add .
git commit -m "chore: initialize monorepo with backend, mobile-app, and admin-dashboard scaffolds"
git push -u origin dev
```

From here, each member works on `feature/<module>-<description>` branches off `dev`, opens a pull request into `dev` at the end of each task, and the team merges `dev` into `main` at the end of each sprint for the demo.
