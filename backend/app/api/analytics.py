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
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Parse Excel file to get real data
        file_path = excel_files[0]
        data = excel_service.parse_excel_file(file_path)
        
        # Get all time-based habits (productivity activities)
        time_habits = [h for h in data['habits'] if h.habit_type == 'time']
        print(f"Time habits found: {[h.name for h in time_habits]}")
        
        if not time_habits:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Get most recent 7 days of data
        all_entries = data['entries']
        if not all_entries:
            return {"chart_data": [], "categories": [], "category_colors": {}}
            
        # Find most recent date and get 7 days back from there
        all_dates = [e.date.date() if hasattr(e.date, 'date') else e.date for e in all_entries]
        most_recent_date = max(all_dates)
        week_start = most_recent_date - timedelta(days=6)
        
        print(f"Using date range: {week_start} to {most_recent_date}")
        
        # Filter entries to this week
        week_entries = []
        for e in all_entries:
            entry_date = e.date.date() if hasattr(e.date, 'date') else e.date
            if week_start <= entry_date <= most_recent_date:
                week_entries.append(e)
        
        # Group entries by date and habit
        entries_by_date = {}
        for entry in week_entries:
            date_key = entry.date.date() if hasattr(entry.date, 'date') else entry.date
            if date_key not in entries_by_date:
                entries_by_date[date_key] = {}
            # Convert to float and handle NA/NaN values
            try:
                value = float(entry.value) if entry.value not in ['NA', 'nan', None, ''] else 0
            except (ValueError, TypeError):
                value = 0
            entries_by_date[date_key][entry.habit_id] = value
        
        # Build chart data for 7 days
        chart_data = []
        categories = [h.name for h in time_habits]
        
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            day_data = {
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "total": 0
            }
            
            day_entries = entries_by_date.get(current_date, {})
            
            # Add data for each time habit
            for habit in time_habits:
                habit_value = day_entries.get(habit.id, 0)
                day_data[habit.name] = habit_value
                day_data["total"] += habit_value
            
            chart_data.append(day_data)
        
        # Generate colors for categories
        color_palette = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]
        category_colors = {}
        for i, category in enumerate(categories):
            category_colors[category] = color_palette[i % len(color_palette)]
        
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
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return {
                "avg_daily_productivity": 0,
                "max_daily_productivity": 0,
                "total_productive_hours": 0,
                "avg_daily_productivity_change": 0,
                "max_daily_productivity_change": 0,
                "total_productive_hours_change": 0
            }
        
        # Parse Excel file to get real data
        file_path = excel_files[0]
        data = excel_service.parse_excel_file(file_path)
        
        # Get time-based habits
        time_habits = [h for h in data['habits'] if h.habit_type == 'time']
        time_habit_ids = [h.id for h in time_habits]
        
        if not time_habit_ids:
            return {
                "avg_daily_productivity": 0,
                "max_daily_productivity": 0,
                "total_productive_hours": 0,
                "avg_daily_productivity_change": 0,
                "max_daily_productivity_change": 0,
                "total_productive_hours_change": 0
            }
        
        # Get entries for time-based habits
        time_entries = [e for e in data['entries'] if e.habit_id in time_habit_ids]
        
        # Calculate daily totals
        daily_totals = {}
        for entry in time_entries:
            date_key = entry.date.date() if hasattr(entry.date, 'date') else entry.date
            if date_key not in daily_totals:
                daily_totals[date_key] = 0
            try:
                value = float(entry.value) if entry.value not in ['NA', 'nan', None, ''] else 0
            except (ValueError, TypeError):
                value = 0
            daily_totals[date_key] += value
        
        if not daily_totals:
            return {
                "avg_daily_productivity": 0,
                "max_daily_productivity": 0,
                "total_productive_hours": 0,
                "avg_daily_productivity_change": 0,
                "max_daily_productivity_change": 0,
                "total_productive_hours_change": 0
            }
        
        # Get most recent date and calculate periods
        most_recent_date = max(daily_totals.keys())
        current_week_start = most_recent_date - timedelta(days=6)
        prev_week_start = most_recent_date - timedelta(days=13)
        prev_week_end = most_recent_date - timedelta(days=7)
        
        # Calculate metrics for current 7 days
        current_week_values = []
        for i in range(7):
            date = current_week_start + timedelta(days=i)
            current_week_values.append(daily_totals.get(date, 0))
        
        # Calculate metrics for previous 7 days
        prev_week_values = []
        for i in range(7):
            date = prev_week_start + timedelta(days=i)
            prev_week_values.append(daily_totals.get(date, 0))
        
        # Current period metrics
        avg_daily_current = sum(current_week_values) / len(current_week_values) if current_week_values else 0
        max_daily_current = max(current_week_values) if current_week_values else 0
        total_hours_current = sum(current_week_values) / 60  # Convert to hours
        
        # Previous period metrics
        avg_daily_prev = sum(prev_week_values) / len(prev_week_values) if prev_week_values else 0
        max_daily_prev = max(prev_week_values) if prev_week_values else 0
        total_hours_prev = sum(prev_week_values) / 60 if prev_week_values else 0
        
        # Calculate percentage changes
        def calculate_change(current, previous):
            if previous == 0:
                return 0 if current == 0 else 100
            return ((current - previous) / previous) * 100
        
        avg_change = calculate_change(avg_daily_current, avg_daily_prev)
        max_change = calculate_change(max_daily_current, max_daily_prev)
        hours_change = calculate_change(total_hours_current, total_hours_prev)
        
        return {
            "avg_daily_productivity": float(avg_daily_current),
            "max_daily_productivity": float(max_daily_current),
            "total_productive_hours": float(total_hours_current),
            "avg_daily_productivity_change": float(avg_change),
            "max_daily_productivity_change": float(max_change),
            "total_productive_hours_change": float(hours_change)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading productivity metrics: {str(e)}")

@router.get("/productivity-chart-30days")
def get_productivity_chart_30days() -> Dict[str, Any]:
    """Get productivity chart data for last 30 days"""
    try:
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Parse Excel file to get real data
        file_path = excel_files[0]
        data = excel_service.parse_excel_file(file_path)
        
        # Get all time-based habits
        time_habits = [h for h in data['habits'] if h.habit_type == 'time']
        
        if not time_habits:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Get most recent 30 days of data
        all_entries = data['entries']
        if not all_entries:
            return {"chart_data": [], "categories": [], "category_colors": {}}
            
        # Find most recent date and get 30 days back from there
        all_dates = [e.date.date() if hasattr(e.date, 'date') else e.date for e in all_entries]
        most_recent_date = max(all_dates)
        month_start = most_recent_date - timedelta(days=29)
        
        # Filter entries to this month
        month_entries = []
        for e in all_entries:
            entry_date = e.date.date() if hasattr(e.date, 'date') else e.date
            if month_start <= entry_date <= most_recent_date:
                month_entries.append(e)
        
        # Group entries by date and habit
        entries_by_date = {}
        for entry in month_entries:
            date_key = entry.date.date() if hasattr(entry.date, 'date') else entry.date
            if date_key not in entries_by_date:
                entries_by_date[date_key] = {}
            # Convert to float and handle NA/NaN values
            try:
                value = float(entry.value) if entry.value not in ['NA', 'nan', None, ''] else 0
            except (ValueError, TypeError):
                value = 0
            entries_by_date[date_key][entry.habit_id] = value
        
        # Build chart data for 30 days
        chart_data = []
        categories = [h.name for h in time_habits]
        
        for i in range(30):
            current_date = month_start + timedelta(days=i)
            
            # Check if we have data for this date
            day_entries = entries_by_date.get(current_date, {})
            has_data = len(day_entries) > 0
            
            day_data = {
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "total": None if not has_data else 0
            }
            
            # Add data for each time habit
            for habit in time_habits:
                if has_data:
                    habit_value = day_entries.get(habit.id, 0)
                    day_data[habit.name] = habit_value
                    if day_data["total"] is not None:
                        day_data["total"] += habit_value
                else:
                    day_data[habit.name] = None
            
            chart_data.append(day_data)
        
        # Generate colors for categories
        color_palette = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]
        category_colors = {}
        for i, category in enumerate(categories):
            category_colors[category] = color_palette[i % len(color_palette)]
        
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