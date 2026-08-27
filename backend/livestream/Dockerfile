FROM gradle:8.13-jdk21 AS build
WORKDIR /src
COPY settings.gradle build.gradle ./
COPY src src
RUN gradle --no-daemon bootJar -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN mkdir -p /var/pixl/recordings
COPY --from=build /src/build/libs/*.jar /app/app.jar
EXPOSE 8085
ENTRYPOINT ["java","-jar","/app/app.jar"]
