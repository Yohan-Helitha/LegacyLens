# Legacy Lens

**Local Language & Culture Preservation Hub**

Legacy Lens is a mobile platform that captures cultural knowledge directly from Sri Lankan elders — either self-recorded or through a youth creator marketplace — organizes it by region and occupation, and turns it into a gamified learning experience for youth. Built for SE3080 – Software Project Management, using Agile (Scrum) over Sprint 0–4.

**SDG Alignment:** SDG 4 (Quality Education) & SDG 11 (Sustainable Cities and Communities)

---

## Repository structure

```
legacy-lens/
├── mobile-app/          # React Native (Expo, TypeScript) — elder, creator, and learner-facing app
├── admin-dashboard/      # Angular — moderator/admin dashboard
├── backend/              # Spring Boot (Java 17) — shared REST API
├── docs/                 # Project charter, research plan, architecture notes
└── docker-compose.yml    # Local PostgreSQL for development
```

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo) + TypeScript |
| Admin dashboard | Angular |
| Backend | Spring Boot (Java 17), Spring Data JPA, Spring Security (JWT) |
| Database | PostgreSQL |
| API style | REST, documented with Swagger/OpenAPI |

## System modules

| Module | Description | Owner |
|---|---|---|
| Content Capturing & Management | Elder-side recording, voice-guided tutorial, native voice typing, trust score | Member A |
| Youth Content Creator & Marketplace | Creator profiles, job matching, messaging, booking | Member B |
| Archive, Discovery & Platform Administration | Feed, search, tagging, cultural map, moderation, analytics | Member C |
| Learning Engine | Gamified quizzes, course tracks, pronunciation, progress, certificates | Member D |

## Getting started

### Prerequisites
- Node.js 18+
- Java 17+ and Maven
- Docker (for local PostgreSQL)
- Expo CLI (`npm install -g expo-cli`) and Angular CLI (`npm install -g @angular/cli`)

### 1. Start the database
```bash
docker compose up -d
```

### 2. Run the backend
```bash
cd backend
cp src/main/resources/application-example.yml src/main/resources/application-local.yml
./mvnw spring-boot:run
```
API available at `http://localhost:8080/api/v1`, Swagger UI at `http://localhost:8080/swagger-ui.html`.

### 3. Run the mobile app
```bash
cd mobile-app
npm install
cp .env.example .env
npx expo start
```

### 4. Run the admin dashboard
```bash
cd admin-dashboard
npm install
ng serve
```
Available at `http://localhost:4200`.

## Branching strategy

- `main` — always demo-ready, updated only from `dev` at the end of a sprint
- `dev` — integration branch
- `feature/<module>-<description>` — one branch per task, merged into `dev` via pull request

## Team

| Member | Role (rotates per sprint) | Primary Module |
|---|---|---|
| Member A | Product Owner / Scrum Master / Dev Team | Content Capturing & Management |
| Member B | Product Owner / Scrum Master / Dev Team | Youth Content Creator & Marketplace |
| Member C | Product Owner / Scrum Master / Dev Team | Archive, Discovery & Platform Administration |
| Member D | Product Owner / Scrum Master / Dev Team | Learning Engine |

## Documentation

Additional project documentation is in `docs/`, including the Project Charter, User Research Plan, and architecture notes.

## License

Academic project for SLIIT SE3080 – Software Project Management. Not licensed for commercial use.
