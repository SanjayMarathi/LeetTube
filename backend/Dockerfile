# Stage 1: Build the application using Maven
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the JAR, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copy the built JAR from the previous stage
COPY --from=build /app/target/leettube-backend-1.0.0.jar app.jar

# Hugging Face Spaces require the application to run on port 7860
EXPOSE 7860

# Run the Spring Boot app, overriding the port to 7860
ENTRYPOINT ["java", "-Dserver.port=7860", "-jar", "app.jar"]
