#!/bin/bash

# Modern Habit Tracker - Synology Runner
# This script sets up and runs the app on Synology NAS

set -e

echo "🎯 Modern Habit Tracker - Synology Setup"
echo "=========================================="

# Configuration
PROJECT_DIR="/volume1/docker/personal-logs-20"
DATA_DIR="$PROJECT_DIR/data"
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Get Synology IP
SYNOLOGY_IP=$(hostname -I | awk '{print $1}')
echo "📍 Synology IP: $SYNOLOGY_IP"

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker on your Synology."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose found"
}

# Function to setup environment
setup_environment() {
    echo "⚙️  Setting up environment..."
    
    # Create .env file
    cat > "$PROJECT_DIR/.env" << EOF
# Backend Configuration
DATABASE_URL=sqlite:///./app.db
EXCEL_DATA_PATH=/app/data
CORS_ORIGINS=http://$SYNOLOGY_IP:$FRONTEND_PORT

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://$SYNOLOGY_IP:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=ws://$SYNOLOGY_IP:$BACKEND_PORT
EOF
    
    echo "✅ Environment configured"
}

# Function to check data directory
check_data() {
    echo "📁 Checking data directory..."
    
    if [ ! -d "$DATA_DIR" ]; then
        mkdir -p "$DATA_DIR"
        echo "📁 Created data directory: $DATA_DIR"
    fi
    
    # Check for Excel files
    excel_count=$(find "$DATA_DIR" -name "*.xlsx" -o -name "*.xls" | wc -l)
    if [ $excel_count -eq 0 ]; then
        echo "⚠️  No Excel files found in $DATA_DIR"
        echo "📝 Please copy your habit tracking Excel files to this directory"
    else
        echo "✅ Found $excel_count Excel file(s) in data directory"
        find "$DATA_DIR" -name "*.xlsx" -o -name "*.xls" | while read file; do
            echo "   📊 $(basename "$file")"
        done
    fi
}

# Function to start services
start_services() {
    echo "🚀 Starting services..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start containers
    docker-compose up -d --build
    
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Check container status
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Services started successfully!"
        echo ""
        echo "🌐 Access your app at:"
        echo "   Frontend: http://$SYNOLOGY_IP:$FRONTEND_PORT"
        echo "   Backend:  http://$SYNOLOGY_IP:$BACKEND_PORT"
        echo "   API Docs: http://$SYNOLOGY_IP:$BACKEND_PORT/docs"
        echo ""
        echo "📊 Container status:"
        docker-compose ps
    else
        echo "❌ Failed to start services"
        echo "📋 Container logs:"
        docker-compose logs
        exit 1
    fi
}

# Function to show logs
show_logs() {
    echo "📋 Showing application logs..."
    docker-compose logs -f
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping services..."
    docker-compose down
    echo "✅ Services stopped"
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://$SYNOLOGY_IP:$FRONTEND_PORT"
    echo "   Backend:  http://$SYNOLOGY_IP:$BACKEND_PORT"
    echo "   API Docs: http://$SYNOLOGY_IP:$BACKEND_PORT/docs"
}

# Main function
main() {
    case "${1:-start}" in
        "start")
            check_docker
            setup_environment
            check_data
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "setup")
            check_docker
            setup_environment
            check_data
            echo "✅ Setup complete. Run './run_synology.sh start' to start services."
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|logs|status|setup}"
            echo ""
            echo "Commands:"
            echo "  start   - Start the application (default)"
            echo "  stop    - Stop the application"
            echo "  restart - Restart the application"
            echo "  logs    - Show application logs"
            echo "  status  - Show service status"
            echo "  setup   - Setup environment only"
            exit 1
            ;;
    esac
}

# Change to project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "📝 Please copy the project files to $PROJECT_DIR first"
    exit 1
fi

cd "$PROJECT_DIR"

# Run main function
main "$@"