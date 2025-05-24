from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import pandas as pd
from app.services.excel_service import ExcelService
from app.core.config import settings

router = APIRouter()
excel_service = ExcelService(settings.EXCEL_DATA_PATH)

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
        
        # Calculate analytics
        total_habits = len(all_habits)
        active_streaks = sum(1 for streak in streaks.values() if streak['current_streak'] > 0)
        longest_streak = max((streak['best_streak'] for streak in streaks.values()), default=0)
        completed_today = sum(1 for streak in streaks.values() if streak['completed_today'])
        
        return {
            "total_habits": total_habits,
            "active_streaks": active_streaks,
            "longest_streak": longest_streak,
            "completed_today": completed_today,
            "completion_rate": (completed_today / total_habits * 100) if total_habits > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading analytics: {str(e)}")

@router.get("/weekly-chart")
def get_weekly_chart() -> Dict[str, Any]:
    """Get weekly chart data for last 7 days"""
    try:
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return {"chart_data": []}
        
        # Parse Excel file
        file_path = excel_files[0]  # Use first Excel file
        df = pd.read_excel(file_path)
        
        # Assume first column is date
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col]).dt.date
        
        # Get time-based habits (like the original app)
        time_habits = []
        for col in df.columns:
            if col != date_col and col not in {'WEEKDAY', 'Razem', 'Unnamed: 8', 'Unnamed: 18'} and not col.startswith('Unnamed'):
                # Check if it's a time-based habit
                sample_values = df[col].dropna().head(10)
                if not sample_values.empty:
                    try:
                        numeric_values = pd.to_numeric(sample_values, errors='coerce')
                        if not numeric_values.isna().all() and numeric_values.max() > 10:
                            time_habits.append(col)
                    except:
                        pass
        
        # Get last 7 days
        today = datetime.now().date()
        week_ago = today - timedelta(days=6)
        
        df_filtered = df[df[date_col] >= week_ago].copy()
        df_filtered = df_filtered.sort_values(date_col)
        
        # Prepare chart data
        chart_data = []
        for _, row in df_filtered.iterrows():
            day_data = {
                "date": row[date_col].strftime("%Y-%m-%d"),
                "weekday": row[date_col].strftime("%a"),
                "total": 0
            }
            
            # Add each time habit
            for habit in time_habits:
                if habit in row and pd.notna(row[habit]):
                    try:
                        value = float(row[habit])
                        day_data[habit] = value
                        day_data["total"] += value
                    except (ValueError, TypeError):
                        day_data[habit] = 0
                else:
                    day_data[habit] = 0
            
            chart_data.append(day_data)
        
        return {
            "chart_data": chart_data,
            "habits": time_habits
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading chart data: {str(e)}")