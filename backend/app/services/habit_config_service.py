import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel

class HabitConfig(BaseModel):
    """Configuration for a single habit"""
    name: str
    emoji: str
    active: bool = True
    color: Optional[str] = None
    order: int = 0
    is_personal: bool = False

class HabitConfigService:
    """Manages habit configuration persistence"""
    
    def __init__(self, config_path: str = "./data/habits_config.json"):
        self.config_path = Path(config_path)
        self.config_path.parent.mkdir(exist_ok=True)
        
    def load_config(self) -> Dict[str, HabitConfig]:
        """Load habit configuration from file"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {
                        habit_id: HabitConfig(**config)
                        for habit_id, config in data.items()
                    }
        except Exception as e:
            print(f"Error loading config: {e}")
        return {}
    
    def save_config(self, config: Dict[str, HabitConfig]) -> bool:
        """Save habit configuration to file"""
        try:
            data = {
                habit_id: habit_config.dict()
                for habit_id, habit_config in config.items()
            }
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False
    
    def update_habit(self, habit_id: str, updates: Dict[str, Any]) -> bool:
        """Update a specific habit's configuration"""
        config = self.load_config()
        if habit_id in config:
            for key, value in updates.items():
                if hasattr(config[habit_id], key):
                    setattr(config[habit_id], key, value)
            return self.save_config(config)
        return False
    
    def delete_habit(self, habit_id: str) -> bool:
        """Delete a habit from configuration (sets active=False)"""
        config = self.load_config()
        if habit_id in config:
            config[habit_id].active = False
            return self.save_config(config)
        return False
    
    def create_default_config(self, habit_id: str, original_name: str, emoji: str, 
                            order: int, is_personal: bool = False) -> HabitConfig:
        """Create default configuration for a new habit"""
        return HabitConfig(
            name=original_name,
            emoji=emoji,
            active=True,
            order=order,
            is_personal=is_personal
        )