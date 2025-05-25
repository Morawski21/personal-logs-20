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
        
        # Get ALL time-based columns first
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
        
        print(f"Available columns: {available_columns}")  # Debug log
        
        # Define productivity categories based on what's actually in Excel
        productivity_categories = {}
        
        # Check each possible category against available columns
        for col in available_columns:
            col_lower = col.lower()
            if 'tech' in col_lower or 'praca' in col_lower:
                if "Tech" not in productivity_categories:
                    productivity_categories["Tech"] = []
                productivity_categories["Tech"].append(col)
            elif 'youtube' in col_lower:
                if "YouTube" not in productivity_categories:
                    productivity_categories["YouTube"] = []
                productivity_categories["YouTube"].append(col)
            elif 'czytanie' in col_lower or 'reading' in col_lower:
                if "Czytanie" not in productivity_categories:
                    productivity_categories["Czytanie"] = []
                productivity_categories["Czytanie"].append(col)
            elif 'gitara' in col_lower or 'guitar' in col_lower:
                if "Gitara" not in productivity_categories:
                    productivity_categories["Gitara"] = []
                productivity_categories["Gitara"].append(col)
            elif 'inne' in col_lower or 'other' in col_lower:
                if "Inne" not in productivity_categories:
                    productivity_categories["Inne"] = []
                productivity_categories["Inne"].append(col)
        
        print(f"Productivity categories: {productivity_categories}")  # Debug log
        
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
                category_debug = []
                
                for col in columns:
                    if col in available_columns and col in row and pd.notna(row[col]):
                        try:
                            value = float(row[col])
                            category_total += value
                            category_debug.append(f"{col}:{value}")
                        except (ValueError, TypeError):
                            category_debug.append(f"{col}:error")
                            pass
                    else:
                        category_debug.append(f"{col}:missing/na")
                
                if category_total > 0:
                    categories_used.add(category)
                    day_data[category] = category_total
                    day_data["total"] += category_total
                    print(f"Day {day_data['date']} - {category}: {category_total} ({', '.join(category_debug)})")
                else:
                    day_data[category] = 0
            
            chart_data.append(day_data)
        
        # Define colors for each category (matching original app colors)
        category_colors = {
            "Tech": "#21d3ed",      # Cyan/Blue - for work/tech 
            "YouTube": "#ef4444",   # Red - for YouTube/entertainment
            "Czytanie": "#10b981",  # Green - for reading
            "Gitara": "#fbbf23",    # Yellow/Amber - for music/guitar  
            "Inne": "#94a3b8"       # Gray/Slate - for misc/other
        }
        
        return {
            "chart_data": chart_data,
            "categories": list(productivity_categories.keys()),  # Return all defined categories
            "categories_used": list(categories_used),  # Categories with actual data
            "category_colors": category_colors,
            "available_columns": available_columns,  # Debug info
            "productivity_categories": productivity_categories  # Debug info
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
        
        # Parse Excel file
        file_path = excel_files[0]
        df = pd.read_excel(file_path)
        
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col]).dt.date
        
        # Get 'Razem' column (total productivity)
        total_col = 'Razem'
        if total_col not in df.columns:
            # Try to find a total column
            for col in df.columns:
                if 'total' in col.lower() or 'razem' in col.lower():
                    total_col = col
                    break
        
        if total_col not in df.columns:
            # Calculate total from time-based columns
            time_cols = []
            for col in df.columns:
                if col != date_col and col not in {'WEEKDAY', 'Unnamed: 8', 'Unnamed: 18'} and not col.startswith('Unnamed'):
                    sample_values = df[col].dropna().head(10)
                    if not sample_values.empty:
                        try:
                            numeric_values = pd.to_numeric(sample_values, errors='coerce')
                            if not numeric_values.isna().all() and numeric_values.max() > 10:
                                time_cols.append(col)
                        except:
                            pass
            df['calculated_total'] = df[time_cols].fillna(0).sum(axis=1)
            total_col = 'calculated_total'
        
        # Get last 7 days and previous 7 days
        today = datetime.now().date()
        week_ago = today - timedelta(days=6)
        two_weeks_ago = today - timedelta(days=13)
        
        df_last_7 = df[(df[date_col] >= week_ago) & (df[date_col] <= today)].copy()
        df_prev_7 = df[(df[date_col] >= two_weeks_ago) & (df[date_col] < week_ago)].copy()
        
        # Calculate metrics for last 7 days
        last_7_values = df_last_7[total_col].fillna(0)
        avg_daily_current = last_7_values.mean()
        max_daily_current = last_7_values.max()
        total_hours_current = last_7_values.sum() / 60  # Convert to hours
        
        # Calculate metrics for previous 7 days
        prev_7_values = df_prev_7[total_col].fillna(0)
        avg_daily_prev = prev_7_values.mean() if len(prev_7_values) > 0 else 0
        max_daily_prev = prev_7_values.max() if len(prev_7_values) > 0 else 0
        total_hours_prev = prev_7_values.sum() / 60 if len(prev_7_values) > 0 else 0
        
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
        
        # Parse Excel file
        file_path = excel_files[0]
        df = pd.read_excel(file_path)
        
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col]).dt.date
        
        # Get time-based columns
        available_columns = []
        for col in df.columns:
            if col != date_col and col not in {'WEEKDAY', 'Razem', 'Unnamed: 8', 'Unnamed: 18'} and not col.startswith('Unnamed'):
                sample_values = df[col].dropna().head(10)
                if not sample_values.empty:
                    try:
                        numeric_values = pd.to_numeric(sample_values, errors='coerce')
                        if not numeric_values.isna().all() and numeric_values.max() > 10:
                            available_columns.append(col)
                    except:
                        pass
        
        # Define productivity categories
        productivity_categories = {}
        for col in available_columns:
            col_lower = col.lower()
            if 'tech' in col_lower or 'praca' in col_lower:
                if "Tech" not in productivity_categories:
                    productivity_categories["Tech"] = []
                productivity_categories["Tech"].append(col)
            elif 'youtube' in col_lower:
                if "YouTube" not in productivity_categories:
                    productivity_categories["YouTube"] = []
                productivity_categories["YouTube"].append(col)
            elif 'czytanie' in col_lower or 'reading' in col_lower:
                if "Czytanie" not in productivity_categories:
                    productivity_categories["Czytanie"] = []
                productivity_categories["Czytanie"].append(col)
            elif 'gitara' in col_lower or 'guitar' in col_lower:
                if "Gitara" not in productivity_categories:
                    productivity_categories["Gitara"] = []
                productivity_categories["Gitara"].append(col)
            elif 'inne' in col_lower or 'other' in col_lower:
                if "Inne" not in productivity_categories:
                    productivity_categories["Inne"] = []
                productivity_categories["Inne"].append(col)
        
        # Get last 30 days - create complete date range
        today = datetime.now().date()
        month_ago = today - timedelta(days=29)
        
        # Create complete date range
        date_range = []
        current_date = month_ago
        while current_date <= today:
            date_range.append(current_date)
            current_date += timedelta(days=1)
        
        # Prepare chart data
        chart_data = []
        
        for date in date_range:
            day_data = {
                "date": date.strftime("%Y-%m-%d"),
                "weekday": date.strftime("%a"),
                "total": None  # Default to None for NA handling
            }
            
            # Find row for this date
            day_df = df[df[date_col] == date]
            
            if len(day_df) == 0:
                # No data for this day - mark as NA
                for category in productivity_categories.keys():
                    day_data[category] = None
            else:
                # Data exists for this day
                row = day_df.iloc[0]
                total = 0
                
                # Calculate totals by category
                for category, columns in productivity_categories.items():
                    category_total = 0
                    
                    for col in columns:
                        if col in row and pd.notna(row[col]):
                            try:
                                value = float(row[col])
                                category_total += value
                            except (ValueError, TypeError):
                                pass
                    
                    day_data[category] = category_total
                    total += category_total
                
                day_data["total"] = total
            
            chart_data.append(day_data)
        
        # Define muted colors for sleek UI
        category_colors = {
            "Tech": "#64748b",      # Slate - muted blue-gray
            "YouTube": "#6b7280",   # Gray - muted gray
            "Czytanie": "#71717a",  # Zinc - muted gray
            "Gitara": "#78716c",    # Stone - muted brown
            "Inne": "#57534e"       # Stone darker - muted brown-gray
        }
        
        return {
            "chart_data": chart_data,
            "categories": list(productivity_categories.keys()),
            "category_colors": category_colors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading 30-day productivity chart: {str(e)}")