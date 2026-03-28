A scalable and distributed **Job Portal Application** built using **Spring Boot Microservices Architecture**. This system enables users to register, apply for jobs, and receive notifications, while recruiters can post jobs and manage applications.

---

## 🚀 Tech Stack

- **Backend:** Spring Boot, Spring Cloud
- **Microservices:** REST APIs
- **Service Discovery:** Eureka Server
- **API Gateway:** Spring Cloud Gateway
- **Authentication:** JWT (JSON Web Token)
- **Messaging Queue:** RabbitMQ
- **Caching:** Redis
- **Database:** MySQL (Database per service)
- **Containerization:** Docker

---

## 🏗️ Architecture Overview


                    ┌───────────────────────────────┐
                    │   Client (Frontend/Postman)   │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │         API Gateway           │
                    │   (Routing + JWT Security)    │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────┬───────────────┬───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐
│ Auth       │  │ Job        │  │ Application  │  │ Admin      │
│ Service    │  │ Service    │  │ Service      │  │ Service    │
└─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └─────┬──────┘
      │               │               │                │
      ▼               ▼               ▼                ▼
 ┌──────────┐   ┌──────────┐   ┌──────────┐     ┌──────────┐
 │  MySQL   │   │  MySQL   │   │  MySQL   │     │  MySQL   │
 └──────────┘   └──────────┘   └──────────┘     └──────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   RabbitMQ   │
                  └──────┬───────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Notification Service │
              └─────────┬────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │  Redis   │
                  │ (Cache)  │
                  └──────────┘

                        
                ┌────────────────────────┐
                │     Eureka Server      │
                │   (Service Registry)   │
                └────────────────────────┘

---

## 🔁 Project Flow

1. **Client Request**
   - All requests go through the API Gateway.

2. **API Gateway**
   - Routes requests to appropriate services.
   - Validates JWT for secured endpoints.

3. **Service Discovery**
   - Eureka Server dynamically resolves service instances.

4. **Authentication (Auth Service)**
   - Handles login and registration.
   - Generates JWT tokens.

5. **Job Service**
   - Recruiters can post and manage jobs.
   - Uses Redis caching for performance.

6. **Application Service**
   - Candidates apply for jobs.
   - Publishes events to RabbitMQ.

7. **RabbitMQ**
   - Enables asynchronous communication between services.

8. **Notification Service**
   - Consumes messages from RabbitMQ.
   - Sends notifications (e.g., email alerts).

9. **Admin Service**
   - Manages users and system-level operations.

---

## 🧩 Microservices

### 🔐 Auth Service
- User registration & login
- JWT token generation & validation

### 💼 Job Service
- Create, update, delete jobs
- Fetch job listings
- Redis caching for optimization

### 📄 Application Service
- Apply for jobs
- Track application status
- Publish events to RabbitMQ

### 🔔 Notification Service
- Listens to RabbitMQ events
- Sends notifications

### 🛠️ Admin Service
- User management
- System monitoring

---

## ⚙️ Key Features

- ✅ Microservices Architecture
- ✅ API Gateway Routing
- ✅ Service Discovery with Eureka
- ✅ JWT-based Authentication
- ✅ Asynchronous Communication using RabbitMQ
- ✅ Redis Caching for Performance Optimization
- ✅ Database per Service Pattern
- ✅ Dockerized Deployment

---

## 🗄️ Database Design (ER Overview)

### Entities:

- **User**
  - id, name, email, role

- **Job**
  - id, title, description, company, posted_by

- **Application**
  - id, user_id, job_id, status

- **Notification**
  - id, message, user_id

### Relationships:

- One User → Many Jobs
- One User → Many Applications
- One Job → Many Applications
- One User → Many Notifications

---

## 📡 API Gateway Routing Example

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: lb://AUTH-SERVICE
          predicates:
            - Path=/auth/**

        - id: job-service
          uri: lb://JOB-SERVICE
          predicates:
            - Path=/jobs/**

        - id: application-service
          uri: lb://APPLICATION-SERVICE
          predicates:
            - Path=/applications/**
📨 RabbitMQ Flow
Application Service publishes event:
rabbitTemplate.convertAndSend(exchange, routingKey, message);
Notification Service consumes:
@RabbitListener(queues = "notificationQueue")
⚡ Redis Caching Example
@Cacheable(value = "jobs")
public List<Job> getAllJobs() {
    return jobRepository.findAll();
}
@CacheEvict(value = "jobs", key = "#id")
🐳 Docker Setup
Each service runs in a container
Includes:
MySQL
RabbitMQ
Redis
Eureka Server
API Gateway
📌 Advantages of This Architecture
🔹 Scalable and modular system
🔹 Loose coupling using RabbitMQ
🔹 High availability via Eureka
🔹 Improved performance with Redis
🔹 Easy deployment using Docker
🎯 Future Enhancements
Add frontend (React / Angular)
Implement role-based access control (RBAC)
Add search & filtering for jobs
Implement analytics dashboard
Use Kubernetes for orchestration
👨‍💻 Author

Prateek Raj
