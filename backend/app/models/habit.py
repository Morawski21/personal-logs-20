from pydantic import BaseModel
from typing import Optional
from datetime import date

class HabitBase(BaseModel):
    name: str
    emoji: str
    habit_type: str  # 'time', 'binary', 'description'
    color: Optional[str] = None
    active: bool = True
    order: int = 0
    is_personal: bool = False

class Habit(HabitBase):
    id: str
    current_streak: int = 0
    best_streak: int = 0
    completed_today: bool = False
    last_completion_date: Optional[date] = None

class HabitEntry(BaseModel):
    habit_id: str
    date: date
    value: Optional[str] = None
    completed: bool = False