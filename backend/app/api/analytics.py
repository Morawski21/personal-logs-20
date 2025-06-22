from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import pandas as pd
from app.services.excel_service import ExcelService
from app.core.config import settings

router = APIRouter()
excel_service = ExcelService(settings.EXCEL_DATA_PATH)

def calculate_perfect_days_streak(entries, habits):
    """Calculate the longest streak of perfect days (all habits completed)"""
    if not entries or not habits:
        return 0
    
    # Group entries by date
    entries_by_date = {}
    for entry in entries:
        date_str = entry.date.strftime('%Y-%m-%d')
        if date_str not in entries_by_date:
            entries_by_date[date_str] = {}
        entries_by_date[date_str][entry.habit_id] = entry.completed
    
    # Get all trackable habit IDs (excluding description types)
    trackable_habits = [h.id for h in habits if h.habit_type in ['binary', 'time']]
    
    if not trackable_habits:
        return 0
    
    # Sort dates
    sorted_dates = sorted(entries_by_date.keys())
    
    current_streak = 0
    best_streak = 0
    
    for date in sorted_dates:
        day_entries = entries_by_date[date]
        
        # Check if ALL trackable habits were completed this day
        all_completed = True
        for habit_id in trackable_habits:
            if habit_id not in day_entries or not day_entries[habit_id]:
                all_completed = False
                break
        
        if all_completed:
            current_streak += 1
            best_streak = max(best_streak, current_streak)
        else:
            current_streak = 0
    
    return best_streak

@router.get("/")
def get_analytics() -> Dict[str, Any]:
    """Get analytics data"""
    try:
        all_habits = []
        all_entries = []
        excel_files = excel_service.find_excel_files()
        
        for file_path in excel_files:
            data = excel_service.parse_excel_file(file_path)
            all_habits.extend(data['habits'])
            all_entries.extend(data['entries'])
        
        streaks = excel_service.calculate_streaks(all_entries)
        
        # Calculate perfect days streak (days where ALL habits were completed)
        perfect_days_streak = calculate_perfect_days_streak(all_entries, all_habits)
        
        # Calculate analytics
        total_habits = len(all_habits)
        active_streaks = sum(1 for streak in streaks.values() if streak['current_streak'] > 0)
        completed_today = sum(1 for streak in streaks.values() if streak['completed_today'])
        
        return {
            "total_habits": total_habits,
            "active_streaks": active_streaks,
            "perfect_days_streak": perfect_days_streak,
            "completed_today": completed_today,
            "completion_rate": (completed_today / total_habits * 100) if total_habits > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading analytics: {str(e)}")

@router.get("/productivity-chart")
def get_productivity_chart() -> Dict[str, Any]:
    """Get productivity chart data by categories for last 7 days"""
    try:
        # Hardcoded working data - replace with real data parsing later
        chart_data = [
            {"date": "2025-06-16", "weekday": "Mon", "YouTube": 65, "Czytanie": 25, "Gitara": 30, "total": 120},
            {"date": "2025-06-17", "weekday": "Tue", "YouTube": 45, "Czytanie": 35, "Gitara": 25, "total": 105},
            {"date": "2025-06-18", "weekday": "Wed", "YouTube": 30, "Czytanie": 20, "Gitara": 25, "total": 75},
            {"date": "2025-06-19", "weekday": "Thu", "YouTube": 0, "Czytanie": 0, "Gitara": 20, "total": 20},
            {"date": "2025-06-20", "weekday": "Fri", "YouTube": 0, "Czytanie": 0, "Gitara": 20, "total": 20},
            {"date": "2025-06-21", "weekday": "Sat", "YouTube": 120, "Czytanie": 0, "Gitara": 25, "total": 145},
            {"date": "2025-06-22", "weekday": "Sun", "YouTube": 60, "Czytanie": 20, "Gitara": 25, "total": 105}
        ]
        
        categories = ["YouTube", "Czytanie", "Gitara"]
        
        category_colors = {
            "YouTube": "#ef4444",  # Red
            "Czytanie": "#10b981",  # Green  
            "Gitara": "#f59e0b"     # Amber
        }
        
        return {
            "chart_data": chart_data,
            "categories": categories,
            "category_colors": category_colors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading productivity chart: {str(e)}")

@router.get("/productivity-metrics")
def get_productivity_metrics() -> Dict[str, Any]:
    """Get productivity KPI metrics for last 7 days vs previous 7 days"""
    try:
        # Hardcoded metrics - replace with real calculation later
        return {
            "avg_daily_productivity": 85.0,
            "max_daily_productivity": 145.0,
            "total_productive_hours": 10.9,
            "avg_daily_productivity_change": 12.5,
            "max_daily_productivity_change": 8.3,
            "total_productive_hours_change": 15.2
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading productivity metrics: {str(e)}")

@router.get("/productivity-chart-30days")
def get_productivity_chart_30days() -> Dict[str, Any]:
    """Get productivity chart data for last 30 days"""
    try:
        # Generate 30 days of sample data
        chart_data = []
        today = datetime.now().date()
        
        categories = ["YouTube", "Czytanie", "Gitara"]
        category_colors = {
            "YouTube": "#ef4444",  # Red
            "Czytanie": "#10b981",  # Green  
            "Gitara": "#f59e0b"     # Amber
        }
        
        for i in range(30):
            current_date = today - timedelta(days=29-i)
            # Simulate some realistic data patterns
            youtube_val = 0 if i % 7 < 2 else (30 + (i % 4) * 20)  # Less on weekdays
            czytanie_val = (i % 3) * 15 + 10  # Varies
            gitara_val = 20 if i % 2 == 0 else 25  # Consistent
            
            total = youtube_val + czytanie_val + gitara_val
            
            chart_data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "YouTube": youtube_val,
                "Czytanie": czytanie_val,
                "Gitara": gitara_val,
                "total": total
            })
        
        return {
            "chart_data": chart_data,
            "categories": categories,
            "category_colors": category_colors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading 30-day productivity chart: {str(e)}")

@router.get("/debug")
def debug_data() -> Dict[str, Any]:
    """Debug endpoint to check what data is being parsed"""
    try:
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return {"error": "No Excel files found", "data_path": str(excel_service.data_path)}
        
        file_path = excel_files[0]
        data = excel_service.parse_excel_file(file_path)
        
        # Return summary of parsed data
        habits_summary = []
        for h in data['habits']:
            habits_summary.append({
                "id": h.id,
                "name": h.name,
                "type": h.habit_type,
                "emoji": h.emoji
            })
        
        entries_summary = []
        for e in data['entries'][:10]:  # First 10 entries
            entries_summary.append({
                "habit_id": e.habit_id,
                "date": str(e.date),
                "value": e.value,
                "completed": e.completed
            })
        
        # Check if we have recent entries
        all_entry_dates = [e.date.date() if hasattr(e.date, 'date') else e.date for e in data['entries']]
        most_recent_date = max(all_entry_dates) if all_entry_dates else None
        
        return {
            "file_path": str(file_path),
            "habits_count": len(data['habits']),
            "entries_count": len(data['entries']),
            "habits": habits_summary,
            "sample_entries": entries_summary,
            "time_habits": [h.name for h in data['habits'] if h.habit_type == 'time'],
            "binary_habits": [h.name for h in data['habits'] if h.habit_type == 'binary'],
            "description_habits": [h.name for h in data['habits'] if h.habit_type == 'description'],
            "most_recent_entry_date": str(most_recent_date) if most_recent_date else None,
            "days_since_last_entry": (datetime.now().date() - most_recent_date).days if most_recent_date else None
        }
        
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}