#!/usr/bin/env python3
"""
Local development runner for Modern Habit Tracker
Runs both backend and frontend for easy debugging
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def run_backend():
    """Start the FastAPI backend"""
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    print("🚀 Starting FastAPI backend...")
    return subprocess.Popen([
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--host", "0.0.0.0", 
        "--port", "8000", 
        "--reload"
    ])

def run_frontend():
    """Start the Next.js frontend"""
    frontend_dir = Path(__file__).parent / "frontend"
    os.chdir(frontend_dir)
    
    print("🌐 Starting Next.js frontend...")
    return subprocess.Popen(["npm", "run", "dev"])

def main():
    print("🎯 Modern Habit Tracker - Local Development")
    print("=" * 50)
    
    try:
        # Start backend
        backend_process = run_backend()
        time.sleep(2)  # Give backend time to start
        
        # Start frontend
        frontend_process = run_frontend()
        
        print("\n✅ Both services started!")
        print("📊 Backend API: http://localhost:8000")
        print("🌐 Frontend: http://localhost:3000")
        print("📖 API Docs: http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop both services")
        
        # Wait for processes
        try:
            backend_process.wait()
            frontend_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping services...")
            backend_process.terminate()
            frontend_process.terminate()
            backend_process.wait()
            frontend_process.wait()
            print("✅ Services stopped")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nPress Enter to exit...")
        input()
        sys.exit(1)

if __name__ == "__main__":
    main()