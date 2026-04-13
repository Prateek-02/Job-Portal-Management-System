# Job Portal Management System

Full-stack job portal built with **Spring Boot microservices** and an **Angular frontend**.  
The platform supports authentication, job posting, job applications, admin management, notifications, and observability.

---

## Tech Stack

### Backend
- Java 17, Spring Boot 3.x, Spring Cloud
- Spring Cloud Gateway (API Gateway)
- Eureka (service discovery)
- OpenFeign + Resilience4j (service communication/resilience)
- RabbitMQ (event-driven messaging)
- Redis (rate limiting/cache)
- MySQL 8 (persistence)
- Zipkin + Micrometer/Actuator (tracing/metrics)
- Prometheus + Grafana (monitoring dashboards)

### Frontend
- Angular 21 (standalone components + lazy routes)
- RxJS, Angular Router, Reactive Forms
- TailwindCSS
- Vitest + Angular unit-test builder for testing/coverage

### DevOps
- Docker Compose for local multi-service orchestration

---

## Repository Structure

```text
Job-Portal-Management-System/
├─ Job-Portal-Backend/
│  ├─ EurekaServer/
│  ├─ ApiGateway/
│  ├─ AuthService/
│  ├─ JobService/
│  ├─ ApplicationService/
│  ├─ AdminService/
│  ├─ NotificationService/
│  ├─ docker-compose.yml
│  └─ prometheus.yml
└─ job-portal-frontend/
   ├─ src/app/
   │  ├─ core/        (guards, interceptors, singleton services)
   │  ├─ shared/      (reusable UI, directives, pipes)
   │  ├─ layout/      (auth/main/admin shells)
   │  ├─ features/    (auth, dashboard, jobs, applications, profile, admin, notifications)
   │  └─ models/
   ├─ vitest.config.ts
   └─ package.json
```

---

## Project Architecture

### High-level flow

```text
[Angular Frontend]
       |
       v
[API Gateway :8085] --JWT validation + rate limiting--> [Redis]
       |
       +--> [AuthService :8081] <--> [MySQL]
       +--> [JobService :8082]  <--> [MySQL]
       +--> [ApplicationService :8083] <--> [MySQL] <--> [Cloudinary]
       +--> [AdminService :8084] <--> [MySQL]
       +--> [NotificationService :8086] --SMTP/Email

All services <--> [Eureka :8761] for discovery
Async events <--> [RabbitMQ :5672 / :15672]
Tracing ---------> [Zipkin :9411]
Metrics ---------> [Prometheus :9090] -> [Grafana :3000]
```

### Backend service responsibilities
- **AuthService**: registration/login, JWT/refresh, profile, forgot/reset password.
- **JobService**: jobs CRUD/search, recruiter job views, market stats.
- **ApplicationService**: apply to jobs, recruiter application views/status updates.
- **AdminService**: admin-level user/job/report endpoints.
- **NotificationService**: consumes async events and sends notifications/emails.
- **ApiGateway**: routing, auth filter, rate limiting, unified entrypoint.
- **EurekaServer**: registry for all services.

### Frontend architecture
- **Core layer**: auth/api/storage/cache/notification services + guards + interceptors.
- **Shared layer**: reusable components (navbar/sidebar/footer/modal/pagination etc.).
- **Layout layer**: route shells (`auth`, `main`, `admin`).
- **Feature layer**: domain modules (`jobs`, `applications`, `dashboard`, `profile`, `admin`, etc.).
- **Routing**: lazy-loaded feature routes with `authGuard` and `roleGuard` where needed.

---

## Ports

### Backend + Infra
- Eureka: `8761`
- API Gateway: `8085`
- Auth Service: `8081`
- Job Service: `8082`
- Application Service: `8083`
- Admin Service: `8084`
- Notification Service: `8086`
- MySQL: `3307` (container `3306`)
- RabbitMQ: `5672` (AMQP), `15672` (management UI)
- Redis: `6379`
- Zipkin: `9411`
- Prometheus: `9090`
- Grafana: `3000`

### Frontend
- Angular dev server: `4200`

---

## Prerequisites

- Docker + Docker Compose
- Node.js + npm (for frontend local dev)
- Java 17 + Maven (only if running backend services without Docker)

---

## Environment Variables

Create `Job-Portal-Backend/.env` (used by `docker-compose.yml`) with required values such as:

- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PASSWORD`
- `JWT_SECRET`, `INTERNAL_SECRET`
- `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`
- `REDIS_PASSWORD`
- `MAIL_USERNAME`, `MAIL_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GRAFANA_ADMIN_PASSWORD`
- optional admin seed values (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, etc.)

---

## Run the Project

### 1) Start backend (Docker Compose)

```bash
cd Job-Portal-Backend
docker compose up --build
```

Recommended startup dependency order is already configured in compose using `depends_on` + health checks.

### 2) Start frontend

```bash
cd job-portal-frontend
npm install
npm start
```

App URL: `http://localhost:4200`

---

## Testing & Coverage (Frontend)

From `job-portal-frontend/`:

```bash
npm test
npm run test:ui
npm run test:coverage
```

Coverage output is generated under:

- `job-portal-frontend/coverage/job-portal-frontend/`
- shortcut entry: `job-portal-frontend/coverage/index.html`

---

## API Entry Point

Use the API Gateway as the single backend entrypoint:

- Base URL: `http://localhost:8085`

---

## Notes

- Gateway handles cross-service routing and security checks.
- Services are discovered dynamically via Eureka (no hardcoded service hostnames in client-facing flows).
- RabbitMQ is used for async event propagation (application/job/user lifecycle notifications).
