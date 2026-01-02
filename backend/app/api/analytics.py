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
        
        # Get productivity columns directly from Excel for analytics (independent of habit visibility)
        import pandas as pd
        df = pd.read_excel(file_path)
        
        # Define productivity columns that should always appear in analytics
        productivity_columns = ['Tech + Praca', 'YouTube', 'Czytanie', 'Gitara', 'Inne']
        available_productivity_columns = [col for col in productivity_columns if col in df.columns]
        
        print(f"Available productivity columns for analytics: {available_productivity_columns}")
        
        if not available_productivity_columns:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Process data directly from Excel for analytics
        date_col = df.columns[0]  # First column is date
        
        # Parse dates
        try:
            df[date_col] = pd.to_datetime(df[date_col], dayfirst=True).dt.date
        except:
            try:
                df[date_col] = pd.to_datetime(df[date_col], format='%d.%m.%Y').dt.date
            except:
                df[date_col] = pd.to_datetime(df[date_col]).dt.date
        
        # Get most recent 7 days of data
        all_dates = df[date_col].dropna()
        if len(all_dates) == 0:
            return {"chart_data": [], "categories": [], "category_colors": {}}
            
        most_recent_date = all_dates.max()
        week_start = most_recent_date - timedelta(days=6)
        
        print(f"Using date range: {week_start} to {most_recent_date}")
        
        # Filter to this week's data
        week_df = df[(df[date_col] >= week_start) & (df[date_col] <= most_recent_date)]
        
        # Build chart data for 7 days
        chart_data = []
        categories = available_productivity_columns
        
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            day_data = {
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "total": 0
            }
            
            # Get data for this day
            day_row = week_df[week_df[date_col] == current_date]
            
            # Add data for each productivity column
            for col in available_productivity_columns:
                if len(day_row) > 0 and col in day_row.columns:
                    value = day_row[col].iloc[0]
                    try:
                        value = float(value) if value not in ['NA', 'nan', None, ''] and pd.notna(value) else 0
                    except (ValueError, TypeError):
                        value = 0
                else:
                    value = 0
                
                day_data[col] = value
                day_data["total"] += value
            
            chart_data.append(day_data)
        
        # Generate colors for categories with your preferred mapping
        preferred_colors = {
            "Tech + Praca": "#3b82f6",    # Blue
            "Tech": "#3b82f6",            # Blue  
            "Praca": "#3b82f6",           # Blue
            "Gitara": "#8b5cf6",          # Purple
            "Czytanie": "#eab308",        # Yellow
            "YouTube": "#ef4444",         # Red
            "Inne": "#6b7280",            # Grey
            "Other": "#6b7280"            # Grey
        }
        
        category_colors = {}
        fallback_colors = ["#3b82f6", "#8b5cf6", "#eab308", "#ef4444", "#6b7280", "#06b6d4", "#ec4899", "#84cc16"]
        
        for i, category in enumerate(categories):
            if category in preferred_colors:
                category_colors[category] = preferred_colors[category]
            else:
                category_colors[category] = fallback_colors[i % len(fallback_colors)]
        
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
        
        # Get productivity columns directly from Excel for analytics (independent of habit visibility)
        import pandas as pd
        df = pd.read_excel(file_path)
        
        # Define productivity columns that should always appear in analytics
        productivity_columns = ['Tech + Praca', 'YouTube', 'Czytanie', 'Gitara', 'Inne']
        available_productivity_columns = [col for col in productivity_columns if col in df.columns]
        
        if not available_productivity_columns:
            return {"chart_data": [], "categories": [], "category_colors": {}}
        
        # Process data directly from Excel for analytics
        date_col = df.columns[0]  # First column is date
        
        # Parse dates
        try:
            df[date_col] = pd.to_datetime(df[date_col], dayfirst=True).dt.date
        except:
            try:
                df[date_col] = pd.to_datetime(df[date_col], format='%d.%m.%Y').dt.date
            except:
                df[date_col] = pd.to_datetime(df[date_col]).dt.date
        
        # Get most recent 30 days of data
        all_dates = df[date_col].dropna()
        if len(all_dates) == 0:
            return {"chart_data": [], "categories": [], "category_colors": {}}
            
        most_recent_date = all_dates.max()
        month_start = most_recent_date - timedelta(days=29)
        
        # Filter to this month's data
        month_df = df[(df[date_col] >= month_start) & (df[date_col] <= most_recent_date)]
        
        # Build chart data for 30 days
        chart_data = []
        categories = available_productivity_columns
        
        for i in range(30):
            current_date = month_start + timedelta(days=i)
            
            # Get data for this day
            day_row = month_df[month_df[date_col] == current_date]
            has_data = len(day_row) > 0
            
            day_data = {
                "date": current_date.strftime("%Y-%m-%d"),
                "weekday": current_date.strftime("%a"),
                "total": None if not has_data else 0
            }
            
            # Add data for each productivity column
            for col in available_productivity_columns:
                if has_data and col in day_row.columns:
                    value = day_row[col].iloc[0]
                    try:
                        value = float(value) if value not in ['NA', 'nan', None, ''] and pd.notna(value) else 0
                    except (ValueError, TypeError):
                        value = 0
                    day_data[col] = value
                    if day_data["total"] is not None:
                        day_data["total"] += value
                else:
                    day_data[col] = None
            
            chart_data.append(day_data)
        
        # Generate colors for categories with your preferred mapping
        preferred_colors = {
            "Tech + Praca": "#3b82f6",    # Blue
            "Tech": "#3b82f6",            # Blue  
            "Praca": "#3b82f6",           # Blue
            "Gitara": "#8b5cf6",          # Purple
            "Czytanie": "#eab308",        # Yellow
            "YouTube": "#ef4444",         # Red
            "Inne": "#6b7280",            # Grey
            "Other": "#6b7280"            # Grey
        }
        
        category_colors = {}
        fallback_colors = ["#3b82f6", "#8b5cf6", "#eab308", "#ef4444", "#6b7280", "#06b6d4", "#ec4899", "#84cc16"]
        
        for i, category in enumerate(categories):
            if category in preferred_colors:
                category_colors[category] = preferred_colors[category]
            else:
                category_colors[category] = fallback_colors[i % len(fallback_colors)]
        
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
        
        # Read raw Excel to check columns
        import pandas as pd
        raw_df = pd.read_excel(file_path)
        all_columns = list(raw_df.columns)
        
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
            "days_since_last_entry": (datetime.now().date() - most_recent_date).days if most_recent_date else None,
            "raw_excel_columns": all_columns,
            "missing_tech_praca": "Tech + Praca" in all_columns,
            "tech_related_columns": [col for col in all_columns if 'tech' in col.lower() or 'praca' in col.lower()]
        }
        
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}

@router.get("/recent-workouts")
def get_recent_workouts() -> Dict[str, Any]:
    """Get recent workout data from workouts sheet"""
    try:
        import pandas as pd

        excel_files = excel_service.find_excel_files()
        if not excel_files:
            print("No Excel files found for workouts")
            return {"workouts": []}

        file_path = excel_files[0]
        print(f"Reading workouts from: {file_path}")

        # Try to read workouts sheet with different case variations
        workouts_df = None
        for sheet_name in ['workouts', 'Workouts', 'WORKOUTS']:
            try:
                workouts_df = pd.read_excel(file_path, sheet_name=sheet_name)
                print(f"Successfully read sheet '{sheet_name}' with shape {workouts_df.shape}")
                print(f"Columns: {list(workouts_df.columns)}")
                break
            except Exception as e:
                print(f"Failed to read sheet '{sheet_name}': {e}")
                continue

        if workouts_df is None:
            print("Could not find workouts sheet in any case variation")
            return {"workouts": []}

        # Parse columns: Date, Activity, Time, Grade, Avg_HR
        workouts = []

        for _, row in workouts_df.iterrows():
            try:
                # Parse date - try different column name variations
                date_val = row.get('Data') or row.get('Date') or row.get('date') or row.get('DATA')
                if pd.isna(date_val):
                    continue

                if isinstance(date_val, str):
                    date_obj = pd.to_datetime(date_val, dayfirst=True).date()
                else:
                    date_obj = pd.to_datetime(date_val).date()

                # Parse activity
                activity = row.get('activity') or row.get('Activity') or row.get('ACTIVITY') or 'Unknown'
                if pd.isna(activity):
                    activity = 'Unknown'

                # Parse time (minutes)
                time_val = row.get('time') or row.get('Time') or row.get('TIME') or 0
                try:
                    time_minutes = int(float(time_val)) if not pd.isna(time_val) else 0
                except:
                    time_minutes = 0

                # Parse grade
                grade = row.get('grade') or row.get('Grade') or row.get('GRADE') or None
                if pd.isna(grade):
                    grade = None
                else:
                    grade = str(grade).strip()

                # Parse avg_hr
                avg_hr = row.get('avg_hr') or row.get('Avg_HR') or row.get('AVG_HR') or None
                try:
                    avg_hr = int(float(avg_hr)) if not pd.isna(avg_hr) else None
                except:
                    avg_hr = None

                workouts.append({
                    "date": date_obj.strftime("%Y-%m-%d"),
                    "activity": str(activity),
                    "time": time_minutes,
                    "grade": grade,
                    "avg_hr": avg_hr
                })
            except Exception as e:
                print(f"Error parsing workout row: {e}")
                continue

        # Sort by date descending
        workouts.sort(key=lambda w: w["date"], reverse=True)

        print(f"Returning {len(workouts)} workouts")
        # Return last 20 workouts
        return {"workouts": workouts[:20]}

    except Exception as e:
        print(f"Error loading workout data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading workout data: {str(e)}")

@router.get("/selfcare-summary")
def get_selfcare_summary() -> Dict[str, Any]:
    """Get summary of selfcare/grooming activities - days since last for sauna, yoga, dermapen"""
    try:
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return {"activities": []}

        file_path = excel_files[0]

        activities = []
        today = datetime.now().date()

        # Read the Excel file directly to access sheets
        xl_file = pd.ExcelFile(file_path)

        # Check if multi-sheet format (has 'core' and 'habits' sheets)
        has_core_sheet = 'core' in xl_file.sheet_names
        has_habits_sheet = 'habits' in xl_file.sheet_names

        if has_core_sheet:
            # Multi-sheet format: read core sheet for accessories column (sauna, yoga)
            df_core = pd.read_excel(file_path, sheet_name='core')

            # Parse dates in core sheet
            date_col = df_core.columns[0]
            try:
                df_core[date_col] = pd.to_datetime(df_core[date_col], dayfirst=True).dt.date
            except:
                try:
                    df_core[date_col] = pd.to_datetime(df_core[date_col], format='%d.%m.%Y').dt.date
                except:
                    df_core[date_col] = pd.to_datetime(df_core[date_col]).dt.date

            # Look for accessories column (case insensitive)
            accessories_col = None
            for col in df_core.columns:
                if 'accessories' in str(col).lower():
                    accessories_col = col
                    break

            # Parse sauna and yoga from accessories column
            if accessories_col:
                for activity_name in ['Sauna', 'Yoga']:
                    keyword = activity_name.lower()
                    last_date = None

                    # Find most recent mention in accessories
                    for _, row in df_core.iterrows():
                        if pd.notna(row[accessories_col]) and pd.notna(row[date_col]):
                            accessories_text = str(row[accessories_col]).lower()
                            if keyword in accessories_text:
                                entry_date = row[date_col]
                                if last_date is None or entry_date > last_date:
                                    last_date = entry_date

                    # Calculate days since last
                    days_since = None
                    if last_date:
                        days_since = (today - last_date).days

                    # Select appropriate icon
                    icon = '🧖' if activity_name == 'Sauna' else '🧘'

                    activities.append({
                        "name": activity_name,
                        "type": "occasional",
                        "days_since_last": days_since,
                        "icon": icon
                    })

        # Get dermapen from habits (either in habits sheet or main sheet)
        data = excel_service.parse_excel_file(file_path)

        # Find dermapen habit
        dermapen_habit = None
        for h in data['habits']:
            if 'dermapen' in h.name.lower() or 'dermapen' in h.id.lower():
                dermapen_habit = h
                break

        if dermapen_habit:
            # Get entries for dermapen
            dermapen_entries = [e for e in data['entries'] if e.habit_id == dermapen_habit.id and e.completed]

            # Sort by date descending
            dermapen_entries.sort(key=lambda e: e.date.date() if hasattr(e.date, 'date') else e.date, reverse=True)

            days_since = None
            if dermapen_entries:
                last_date = dermapen_entries[0].date.date() if hasattr(dermapen_entries[0].date, 'date') else dermapen_entries[0].date
                days_since = (today - last_date).days

            activities.append({
                "name": "Dermapen",
                "type": "occasional",
                "days_since_last": days_since,
                "icon": "💧"
            })

        return {"activities": activities}

    except Exception as e:
        print(f"Error loading selfcare data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading selfcare data: {str(e)}")

@router.get("/calendar")
def get_calendar_data(days: int = 14) -> List[Dict[str, Any]]:
    """Get calendar view data for last N days (default 14)"""
    try:
        excel_files = excel_service.find_excel_files()
        if not excel_files:
            return []

        file_path = excel_files[0]
        data = excel_service.parse_excel_file(file_path)

        habits = data['habits']
        entries = data['entries']

        # Get trackable habits (non-description types)
        trackable_habits = [h for h in habits if h.habit_type in ['binary', 'time', 'grade']]
        total_trackable = len(trackable_habits)

        # Get productivity time habits
        time_habit_ids = [h.id for h in habits if h.habit_type == 'time']

        # Group entries by date
        entries_by_date = {}
        for entry in entries:
            date_key = entry.date.date() if hasattr(entry.date, 'date') else entry.date
            if date_key not in entries_by_date:
                entries_by_date[date_key] = []
            entries_by_date[date_key].append(entry)

        # Get most recent date and calculate range
        if not entries_by_date:
            return []

        most_recent_date = max(entries_by_date.keys())
        start_date = most_recent_date - timedelta(days=days-1)

        # Build calendar data
        calendar_data = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            day_entries = entries_by_date.get(current_date, [])

            # Count completed trackable habits
            completed_count = 0
            productivity_minutes = 0
            workout_grade = None

            for entry in day_entries:
                if entry.completed:
                    # Check if this is a trackable habit
                    habit = next((h for h in trackable_habits if h.id == entry.habit_id), None)
                    if habit:
                        completed_count += 1

                # Sum productivity minutes
                if entry.habit_id in time_habit_ids:
                    try:
                        value = float(entry.value) if entry.value not in ['NA', 'nan', None, ''] else 0
                        productivity_minutes += value
                    except (ValueError, TypeError):
                        pass

                # Get workout grade
                if 'workout_grade' in entry.habit_id:
                    workout_grade = entry.value

            # Check if it's a perfect day
            perfect_day = completed_count == total_trackable and total_trackable > 0

            calendar_data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "completed_habits": completed_count,
                "total_habits": total_trackable,
                "productivity_minutes": productivity_minutes,
                "perfect_day": perfect_day,
                "workout_grade": workout_grade
            })

        return calendar_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading calendar data: {str(e)}")