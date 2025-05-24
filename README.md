# Modern Habit Tracker

A web application for habit tracking that uses Excel files as the data source. Built with Next.js frontend and FastAPI backend, designed for deployment on Synology NAS using Docker Compose.

The application maintains Excel files as the source of truth while providing a modern web interface with real-time updates, streak tracking, and analytics. A SQLite cache layer ensures fast performance while file watching automatically syncs changes from Excel.

Development setup: `docker-compose up` then access frontend at http://localhost:3000 and backend at http://localhost:8000. Place Excel files in `backend/data/` directory for automatic detection and processing.