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
            print("No Excel files found in data directory")
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Parse Excel file using the existing ExcelService logic
        file_path = excel_files[0]  # Use first Excel file
        print(f"Parsing Excel file: {file_path}")
        data = excel_service.parse_excel_file(file_path)
        
        # Get time-based habits from the parsed data (productivity activities with minutes)
        time_habits = [h for h in data['habits'] if h.habit_type == 'time']
        
        if not time_habits:
            print("No time-based habits found")
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        print(f"Found {len(time_habits)} time-based habits: {[h.name for h in time_habits]}")  # Debug log
        
        # Use habit names directly as categories for time-based habits
        # This allows the config system to work properly when column names change
        productivity_categories = {}
        
        for habit in time_habits:
            # Use the configured habit name as the category
            category = habit.name
            
            if category not in productivity_categories:
                productivity_categories[category] = []
            productivity_categories[category].append(habit)
        
        print(f"Productivity categories: {list(productivity_categories.keys())}")  # Debug log
        
        # Get last 7 days of entries
        today = datetime.now().date()
        week_ago = today - timedelta(days=6)
        
        # Filter entries to last 7 days
        recent_entries = [e for e in data['entries'] 
                         if e.date.date() >= week_ago and e.date.date() <= today]
        
        # Group entries by date
        entries_by_date = {}
        for entry in recent_entries:
            date_key = entry.date.date()
            if date_key not in entries_by_date:
                entries_by_date[date_key] = {}
            entries_by_date[date_key][entry.habit_id] = entry.value
        
        # Create complete date range for last 7 days
        chart_data = []
        categories_used = set()
        
        for i in range(7):
            current_date = week_ago + timedelta(days=i)
            day_data = {
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "total": 0
            }
            
            day_entries = entries_by_date.get(current_date, {})
            
            # Calculate totals by category
            for category, habits in productivity_categories.items():
                category_total = 0
                
                for habit in habits:
                    habit_value = day_entries.get(habit.id, 0)
                    if isinstance(habit_value, (int, float)) and habit_value > 0:
                        category_total += habit_value
                
                if category_total > 0:
                    categories_used.add(category)
                
                day_data[category] = category_total
                day_data["total"] += category_total
            
            chart_data.append(day_data)
        
        # Generate colors dynamically for each category
        color_palette = [
            "#3b82f6",  # Blue
            "#ef4444",  # Red
            "#10b981",  # Green
            "#f59e0b",  # Amber
            "#8b5cf6",  # Purple
            "#06b6d4",  # Cyan
            "#ec4899",  # Pink
            "#84cc16",  # Lime
            "#f97316",  # Orange
            "#6b7280"   # Gray
        ]
        
        category_colors = {}
        for i, category in enumerate(productivity_categories.keys()):
            category_colors[category] = color_palette[i % len(color_palette)]
        
        return {
            "chart_data": chart_data,
            "categories": list(productivity_categories.keys()),
            "categories_used": list(categories_used),
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
        
        # Parse Excel file using the existing ExcelService logic
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
            date_key = entry.date.date()
            if date_key not in daily_totals:
                daily_totals[date_key] = 0
            if isinstance(entry.value, (int, float)):
                daily_totals[date_key] += entry.value
        
        # Get last 7 days and previous 7 days
        today = datetime.now().date()
        week_ago = today - timedelta(days=6)
        two_weeks_ago = today - timedelta(days=13)
        
        # Calculate metrics for last 7 days
        last_7_values = []
        for i in range(7):
            date = week_ago + timedelta(days=i)
            last_7_values.append(daily_totals.get(date, 0))
        
        # Calculate metrics for previous 7 days
        prev_7_values = []
        for i in range(7):
            date = two_weeks_ago + timedelta(days=i)
            prev_7_values.append(daily_totals.get(date, 0))
        
        # Calculate current period metrics
        avg_daily_current = sum(last_7_values) / len(last_7_values) if last_7_values else 0
        max_daily_current = max(last_7_values) if last_7_values else 0
        total_hours_current = sum(last_7_values) / 60  # Convert to hours
        
        # Calculate previous period metrics
        avg_daily_prev = sum(prev_7_values) / len(prev_7_values) if prev_7_values else 0
        max_daily_prev = max(prev_7_values) if prev_7_values else 0
        total_hours_prev = sum(prev_7_values) / 60 if prev_7_values else 0
        
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
        
        # Parse Excel file using the existing ExcelService logic
        file_path = excel_files[0]
        data = excel_service.parse_excel_file(file_path)
        
        # Get time-based habits and categorize them
        time_habits = [h for h in data['habits'] if h.habit_type == 'time']
        
        if not time_habits:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Use habit names directly as categories for time-based habits
        # This allows the config system to work properly when column names change
        productivity_categories = {}
        
        for habit in time_habits:
            # Use the configured habit name as the category
            category = habit.name
            
            if category not in productivity_categories:
                productivity_categories[category] = []
            productivity_categories[category].append(habit)
        
        # Get last 30 days entries
        today = datetime.now().date()
        month_ago = today - timedelta(days=29)
        
        # Filter entries to last 30 days
        recent_entries = [e for e in data['entries'] 
                         if e.date.date() >= month_ago and e.date.date() <= today]
        
        # Group entries by date and habit
        entries_by_date = {}
        for entry in recent_entries:
            date_key = entry.date.date()
            if date_key not in entries_by_date:
                entries_by_date[date_key] = {}
            entries_by_date[date_key][entry.habit_id] = entry.value
        
        # Create complete date range for last 30 days
        chart_data = []
        
        for i in range(30):
            current_date = month_ago + timedelta(days=i)
            day_data = {
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "total": None if current_date not in entries_by_date else 0
            }
            
            day_entries = entries_by_date.get(current_date, {})
            
            if not day_entries:
                # No data for this day - mark as NA
                for category in productivity_categories.keys():
                    day_data[category] = None
            else:
                # Calculate totals by category
                total = 0
                for category, habits in productivity_categories.items():
                    category_total = 0
                    
                    for habit in habits:
                        habit_value = day_entries.get(habit.id, 0)
                        if isinstance(habit_value, (int, float)) and habit_value > 0:
                            category_total += habit_value
                    
                    day_data[category] = category_total
                    total += category_total
                
                day_data["total"] = total
            
            chart_data.append(day_data)
        
        # Generate colors dynamically for each category
        color_palette = [
            "#3b82f6",  # Blue
            "#ef4444",  # Red
            "#10b981",  # Green
            "#f59e0b",  # Amber
            "#8b5cf6",  # Purple
            "#06b6d4",  # Cyan
            "#ec4899",  # Pink
            "#84cc16",  # Lime
            "#f97316",  # Orange
            "#6b7280"   # Gray
        ]
        
        category_colors = {}
        for i, category in enumerate(productivity_categories.keys()):
            category_colors[category] = color_palette[i % len(color_palette)]
        
        return {
            "chart_data": chart_data,
            "categories": list(productivity_categories.keys()),
            "category_colors": category_colors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading 30-day productivity chart: {str(e)}")