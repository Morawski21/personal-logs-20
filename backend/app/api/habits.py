from fastapi import APIRouter, HTTPException
from typing import List
from app.models.habit import Habit
from app.services.excel_service import ExcelService
from app.core.config import settings

router = APIRouter()
excel_service = ExcelService(settings.EXCEL_DATA_PATH)

@router.get("/", response_model=List[Habit])
def get_habits():
    """Get all habits from Excel files"""
    try:
        all_habits = []
        excel_files = excel_service.find_excel_files()
        
        for file_path in excel_files:
            data = excel_service.parse_excel_file(file_path)
            habits = data['habits']
            entries = data['entries']
            
            # Calculate streaks
            streaks = excel_service.calculate_streaks(entries)
            
            # Update habits with streak data
            for habit in habits:
                if habit.id in streaks:
                    streak_data = streaks[habit.id]
                    habit.current_streak = streak_data['current_streak']
                    habit.best_streak = streak_data['best_streak']
                    habit.completed_today = streak_data['completed_today']
                
                all_habits.append(habit)
        
        return all_habits
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading habits: {str(e)}")

@router.get("/refresh")
def refresh_habits():
    """Manually refresh habits from Excel files"""
    try:
        habits = get_habits()
        return {"message": "Habits refreshed successfully", "count": len(habits)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing habits: {str(e)}")