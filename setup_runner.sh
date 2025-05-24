#!/bin/bash

# Setup GitHub Actions Runner on Synology
echo "🚀 Setting up GitHub Actions Runner for personal-logs-20"
echo "===================================================="

# Stop any existing runner
echo "🛑 Stopping existing runner..."
docker-compose -f docker-compose.runner.yml down 2>/dev/null || true

# Start the new runner
echo "🏃 Starting GitHub Actions Runner..."
docker-compose -f docker-compose.runner.yml up -d

# Check status
echo "⏳ Waiting for runner to start..."
sleep 10

if docker ps | grep -q "github-actions-runner-personal-logs-20"; then
    echo "✅ GitHub Actions Runner started successfully!"
    echo ""
    echo "📊 Runner Status:"
    docker ps | grep github-actions-runner-personal-logs-20
    echo ""
    echo "📋 To view logs:"
    echo "docker logs -f github-actions-runner-personal-logs-20"
    echo ""
    echo "🚀 Push to main branch to trigger deployment!"
else
    echo "❌ Failed to start runner"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.runner.yml logs
    exit 1
fi