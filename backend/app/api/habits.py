from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from app.models.habit import Habit
from app.services.excel_service import ExcelService
from app.services.habit_config_service import HabitConfigService
from app.core.config import settings

class HabitUpdateRequest(BaseModel):
    name: str = None
    emoji: str = None
    active: bool = None
    is_personal: bool = None
    order: int = None

router = APIRouter()
excel_service = ExcelService(settings.EXCEL_DATA_PATH)
config_service = HabitConfigService()

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
                    # Create new habit object with updated streak data
                    updated_habit = Habit(
                        id=habit.id,
                        name=habit.name,
                        emoji=habit.emoji,
                        habit_type=habit.habit_type,
                        color=habit.color,
                        active=habit.active,
                        order=habit.order,
                        is_personal=habit.is_personal,
                        current_streak=streak_data['current_streak'],
                        best_streak=streak_data['best_streak'],
                        completed_today=streak_data['completed_today']
                    )
                    all_habits.append(updated_habit)
                else:
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

@router.put("/{habit_id}")
def update_habit(habit_id: str, updates: HabitUpdateRequest):
    """Update habit configuration"""
    try:
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        success = config_service.update_habit(habit_id, update_dict)
        
        if success:
            return {"message": "Habit updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Habit not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating habit: {str(e)}")

@router.delete("/{habit_id}")
def delete_habit(habit_id: str):
    """Delete (hide) habit from display"""
    try:
        success = config_service.delete_habit(habit_id)
        
        if success:
            return {"message": "Habit deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Habit not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting habit: {str(e)}")

@router.post("/reorder")
def reorder_habits(habit_orders: Dict[str, int]):
    """Reorder habits"""
    try:
        config = config_service.load_config()
        
        for habit_id, new_order in habit_orders.items():
            if habit_id in config:
                config[habit_id].order = new_order
        
        success = config_service.save_config(config)
        
        if success:
            return {"message": "Habits reordered successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save new order")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reordering habits: {str(e)}")

@router.get("/hidden")
def get_hidden_habits():
    """Get all hidden habits from configuration"""
    try:
        config = config_service.load_config()
        hidden_habits = []
        
        for habit_id, habit_config in config.items():
            if not habit_config.active:
                hidden_habits.append({
                    "id": habit_id,
                    "name": habit_config.name,
                    "emoji": habit_config.emoji,
                    "is_personal": habit_config.is_personal,
                    "order": habit_config.order
                })
        
        # Sort by order
        hidden_habits.sort(key=lambda x: x['order'])
        return hidden_habits
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting hidden habits: {str(e)}")

@router.post("/{habit_id}/restore")
def restore_habit(habit_id: str):
    """Restore a hidden habit"""
    try:
        success = config_service.update_habit(habit_id, {"active": True})
        
        if success:
            return {"message": "Habit restored successfully"}
        else:
            raise HTTPException(status_code=404, detail="Habit not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restoring habit: {str(e)}")