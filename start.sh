#!/bin/bash

# Set JAVA_TOOL_OPTIONS to ensure UTF-8 encoding
export JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"

cd docker/middleware/
docker compose up -d --build
sleep 5
cd ../../spring-ai-alibaba-admin-server
mvn clean install -DskipTests

