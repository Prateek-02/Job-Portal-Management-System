FROM maven:3.9.6-eclipse-temurin-17 AS builder
ENV TZ=UTC
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests 

FROM eclipse-temurin:17-jre
ENV TZ=UTC
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]