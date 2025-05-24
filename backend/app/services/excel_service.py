import pandas as pd
import os
from pathlib import Path
from typing import List, Dict, Any
from app.models.habit import Habit, HabitEntry
from datetime import datetime, date
import re

class ExcelService:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.data_path.mkdir(exist_ok=True)
    
    def find_excel_files(self) -> List[Path]:
        """Find all Excel files in the data directory"""
        excel_files = []
        for ext in ['*.xlsx', '*.xls']:
            excel_files.extend(self.data_path.glob(ext))
        return excel_files
    
    def parse_excel_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse Excel file and extract habits and entries"""
        try:
            df = pd.read_excel(file_path)
            
            # Assume first column is date
            date_col = df.columns[0]
            df[date_col] = pd.to_datetime(df[date_col]).dt.date
            
            # Extract habit columns (exclude date column)
            habit_columns = [col for col in df.columns if col != date_col]
            
            habits = []
            entries = []
            
            for i, col in enumerate(habit_columns):
                # Extract emoji and name from column header
                emoji_match = re.search(r'([\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\u2600-\u26FF\u2700-\u27BF])', col)
                emoji = emoji_match.group(1) if emoji_match else '📝'
                name = re.sub(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\u2600-\u26FF\u2700-\u27BF]', '', col).strip()
                
                # Determine habit type based on values
                sample_values = df[col].dropna().head(10)
                habit_type = self._determine_habit_type(sample_values)
                
                habit_id = f"habit_{i}"
                habit = Habit(
                    id=habit_id,
                    name=name,
                    emoji=emoji,
                    habit_type=habit_type,
                    order=i,
                    current_streak=0,
                    best_streak=0,
                    completed_today=False
                )
                habits.append(habit)
                
                # Process entries for this habit
                for _, row in df.iterrows():
                    if pd.notna(row[col]) and pd.notna(row[date_col]):
                        entry = HabitEntry(
                            habit_id=habit_id,
                            date=row[date_col],
                            value=str(row[col]),
                            completed=self._is_completed(row[col], habit_type)
                        )
                        entries.append(entry)
            
            return {
                'habits': habits,
                'entries': entries,
                'file_path': str(file_path),
                'last_modified': file_path.stat().st_mtime
            }
            
        except Exception as e:
            print(f"Error parsing Excel file {file_path}: {e}")
            return {'habits': [], 'entries': [], 'file_path': str(file_path), 'last_modified': 0}
    
    def _determine_habit_type(self, values: pd.Series) -> str:
        """Determine habit type based on sample values"""
        if values.empty:
            return 'binary'
        
        # Check for time patterns (e.g., "1.5h", "30min")
        time_pattern = re.compile(r'\d+(\.\d+)?(h|hr|hour|min|m)\b', re.IGNORECASE)
        if any(time_pattern.search(str(val)) for val in values):
            return 'time'
        
        # Check for binary patterns (checkmarks, 1/0, yes/no)
        binary_patterns = ['✓', '✗', 'x', '1', '0', 'yes', 'no', 'true', 'false']
        if all(str(val).lower().strip() in binary_patterns for val in values):
            return 'binary'
        
        return 'description'
    
    def _is_completed(self, value: Any, habit_type: str) -> bool:
        """Determine if a habit entry represents completion"""
        if pd.isna(value):
            return False
        
        value_str = str(value).lower().strip()
        
        if habit_type == 'binary':
            return value_str in ['✓', '1', 'yes', 'true', 'x']
        elif habit_type == 'time':
            # Any time value is considered completion
            return len(value_str) > 0 and value_str != '0'
        else:  # description
            # Any non-empty description is considered completion
            return len(value_str) > 0
    
    def calculate_streaks(self, entries: List[HabitEntry]) -> Dict[str, Dict[str, int]]:
        """Calculate current and best streaks for each habit"""
        streaks = {}
        
        # Group entries by habit_id
        habit_entries = {}
        for entry in entries:
            if entry.habit_id not in habit_entries:
                habit_entries[entry.habit_id] = []
            habit_entries[entry.habit_id].append(entry)
        
        for habit_id, habit_entry_list in habit_entries.items():
            # Sort by date
            sorted_entries = sorted(habit_entry_list, key=lambda x: x.date)
            
            current_streak = 0
            best_streak = 0
            temp_streak = 0
            
            for i, entry in enumerate(sorted_entries):
                if entry.completed:
                    temp_streak += 1
                    best_streak = max(best_streak, temp_streak)
                    
                    # Check if this is part of current streak (consecutive days)
                    if i == len(sorted_entries) - 1:  # Last entry
                        current_streak = temp_streak
                else:
                    temp_streak = 0
            
            # Check if today is completed
            today = date.today()
            completed_today = any(
                entry.date == today and entry.completed 
                for entry in sorted_entries
            )
            
            streaks[habit_id] = {
                'current_streak': current_streak,
                'best_streak': best_streak,
                'completed_today': completed_today
            }
        
        return streaks