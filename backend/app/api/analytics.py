from fastapi import APIRouter, HTTPException
from typing import Dict, Any
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