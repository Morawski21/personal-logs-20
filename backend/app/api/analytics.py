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
            return {"chart_data": [], "categories": []}
        
        # Parse Excel file
        file_path = excel_files[0]  # Use first Excel file
        df = pd.read_excel(file_path)
        
        # Assume first column is date
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col]).dt.date
        
        # Define productivity categories based on original app
        productivity_categories = {
            "Tech": ["Tech", "Praca"],  # Combine Tech + Praca
            "YouTube": ["YouTube"],
            "Czytanie": ["Czytanie"],
            "Gitara": ["Gitara"], 
            "Inne": ["Inne"]
        }
        
        # Get time-based columns that match our categories
        available_columns = []
        for col in df.columns:
            if col != date_col and col not in {'WEEKDAY', 'Razem', 'Unnamed: 8', 'Unnamed: 18'} and not col.startswith('Unnamed'):
                # Check if it's a time-based habit
                sample_values = df[col].dropna().head(10)
                if not sample_values.empty:
                    try:
                        numeric_values = pd.to_numeric(sample_values, errors='coerce')
                        if not numeric_values.isna().all() and numeric_values.max() > 10:
                            available_columns.append(col)
                    except:
                        pass
        
        # Get last 7 days
        today = datetime.now().date()
        week_ago = today - timedelta(days=6)
        
        df_filtered = df[df[date_col] >= week_ago].copy()
        df_filtered = df_filtered.sort_values(date_col)
        
        # Prepare chart data
        chart_data = []
        categories_used = set()
        
        for _, row in df_filtered.iterrows():
            day_data = {
                "date": row[date_col].strftime("%Y-%m-%d"),
                "weekday": row[date_col].strftime("%a"),
                "total": 0
            }
            
            # Calculate totals by category
            for category, columns in productivity_categories.items():
                category_total = 0
                
                for col in columns:
                    if col in available_columns and col in row and pd.notna(row[col]):
                        try:
                            value = float(row[col])
                            category_total += value
                        except (ValueError, TypeError):
                            pass
                
                if category_total > 0:
                    categories_used.add(category)
                    day_data[category] = category_total
                    day_data["total"] += category_total
                else:
                    day_data[category] = 0
            
            chart_data.append(day_data)
        
        # Define colors for each category
        category_colors = {
            "Tech": "#8b5cf6",      # Purple
            "YouTube": "#ef4444",   # Red  
            "Czytanie": "#10b981",  # Emerald
            "Gitara": "#f59e0b",    # Amber
            "Inne": "#06b6d4"       # Cyan
        }
        
        return {
            "chart_data": chart_data,
            "categories": list(categories_used),
            "category_colors": category_colors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading productivity chart: {str(e)}")