import pandas as pd
import os
from pathlib import Path
from typing import List, Dict, Any
from app.models.habit import Habit, HabitEntry
from app.services.habit_config_service import HabitConfigService
from datetime import datetime, date
import re

class ExcelService:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.data_path.mkdir(exist_ok=True)
        self.config_service = HabitConfigService()
    
    def find_excel_files(self) -> List[Path]:
        """Find all Excel files in the data directory, excluding temporary lock files"""
        excel_files = []
        for ext in ['*.xlsx', '*.xls']:
            all_files = self.data_path.glob(ext)
            # Filter out temporary Excel lock files (starting with ~$)
            excel_files.extend([f for f in all_files if not f.name.startswith('~$')])
        
        print(f"Found Excel files: {[str(f) for f in excel_files]}")  # Debug
        return excel_files
    
    def parse_excel_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse Excel file and extract habits and entries"""
        try:
            df = pd.read_excel(file_path)
            
            # System columns that should not be treated as habits (from old app)
            SYSTEM_COLUMNS = {'Data', 'WEEKDAY', 'Razem', 'Unnamed: 8', 'Unnamed: 18'}
            
            print(f"Raw Excel columns: {list(df.columns)}")  # Debug
            print(f"DataFrame shape: {df.shape}")  # Debug
            
            # Assume first column is date
            date_col = df.columns[0]
            print(f"Date column: '{date_col}'")  # Debug
            print(f"Sample date values: {list(df[date_col].dropna().head(3))}")  # Debug
            
            # Try multiple date formats that might be in your Excel file
            try:
                df[date_col] = pd.to_datetime(df[date_col], dayfirst=True).dt.date
                print("Successfully parsed dates with dayfirst=True")  # Debug
            except:
                try:
                    df[date_col] = pd.to_datetime(df[date_col], format='%d.%m.%Y').dt.date
                    print("Successfully parsed dates with format '%d.%m.%Y'")  # Debug
                except:
                    df[date_col] = pd.to_datetime(df[date_col]).dt.date
                    print("Parsed dates with default format")  # Debug
            
            # Extract habit columns (exclude date and system columns)
            habit_columns = [col for col in df.columns 
                           if col != date_col and col not in SYSTEM_COLUMNS 
                           and not col.startswith('Unnamed')]
            
            print(f"Filtered habit columns: {habit_columns}")  # Debug
            
            habits = []
            entries = []
            
            # Load saved configuration
            saved_config = self.config_service.load_config()
            
            for i, col in enumerate(habit_columns):
                habit_id = f"habit_{col}"  # Use column name as ID for consistency
                
                # Detect personal habits (🔒 prefix or contains "Personal")
                is_personal = col.startswith('🔒') or 'personal' in col.lower()
                
                # Smart emoji mapping based on habit name (from old app logic)
                default_emoji = self._get_smart_emoji(col)
                default_name = col.replace('🔒 ', '').strip()  # Remove lock emoji from display name
                
                # Determine habit type based on values
                sample_values = df[col].dropna().head(10)
                habit_type = self._determine_habit_type(sample_values)
                
                print(f"Column '{col}': type={habit_type}, sample_count={len(sample_values)}")  # Debug
                
                # Skip if no meaningful data
                if len(sample_values) == 0:
                    print(f"Skipping column '{col}' - no data")  # Debug
                    continue
                
                # Use saved config or create default
                if habit_id in saved_config:
                    config = saved_config[habit_id]
                    # Skip if marked as inactive
                    if not config.active:
                        continue
                    
                    habit = Habit(
                        id=habit_id,
                        name=config.name,
                        emoji=config.emoji,
                        habit_type=habit_type,
                        order=config.order,
                        current_streak=0,
                        best_streak=0,
                        completed_today=False,
                        is_personal=config.is_personal
                    )
                else:
                    # Create default config and save it
                    default_config = self.config_service.create_default_config(
                        habit_id, default_name, default_emoji, i, is_personal
                    )
                    saved_config[habit_id] = default_config
                    self.config_service.save_config(saved_config)
                    
                    habit = Habit(
                        id=habit_id,
                        name=default_name,
                        emoji=default_emoji,
                        habit_type=habit_type,
                        order=i,
                        current_streak=0,
                        best_streak=0,
                        completed_today=False,
                        is_personal=is_personal
                    )
                
                habits.append(habit)
                
                # Process entries for this habit
                entry_count = 0
                for _, row in df.iterrows():
                    if pd.notna(row[col]) and pd.notna(row[date_col]):
                        entry = HabitEntry(
                            habit_id=habit_id,
                            date=row[date_col],
                            value=str(row[col]),
                            completed=self._is_completed(row[col], habit_type)
                        )
                        entries.append(entry)
                        entry_count += 1
                
                print(f"Created {entry_count} entries for habit '{col}'")  # Debug
            
            return {
                'habits': habits,
                'entries': entries,
                'file_path': str(file_path),
                'last_modified': file_path.stat().st_mtime
            }
            
        except Exception as e:
            print(f"Error parsing Excel file {file_path}: {e}")
            return {'habits': [], 'entries': [], 'file_path': str(file_path), 'last_modified': 0}
    
    def _get_smart_emoji(self, habit_name: str) -> str:
        """Get smart emoji based on habit name (from old app logic)"""
        name_lower = habit_name.lower()
        
        # Mapping for common habit patterns
        emoji_mappings = {
            # Work/Learning
            'tech': '💻', 'praca': '💻', 'work': '💻', 'code': '💻', 'coding': '💻',
            'youtube': '🎥', 'video': '🎥',
            'czytanie': '📚', 'reading': '📚', 'read': '📚', 'book': '📚',
            'gitara': '🎸', 'guitar': '🎸', 'music': '🎵',
            'inne': '🔧', 'other': '🔧', 'misc': '🔧',
            
            # Health/Fitness
            'sport': '🏃', 'fitness': '🏃', 'exercise': '🏃', 'workout': '💪',
            'clean': '🧹', 'cleaning': '🧹',
            'suplementy': '💊', 'supplements': '💊', 'vitamins': '💊',
            
            # Finance/Organization
            'ynab': '💰', 'money': '💰', 'budget': '💰', 'finance': '💰',
            'anki': '🧠', 'study': '🧠', 'learning': '🧠',
            'pamiętnik': '✒️', 'diary': '✒️', 'journal': '✒️',
            'plan': '📝', 'planning': '📝', 'todo': '📝',
            
            # Habits/Restrictions
            'porn': '🚫', 'no porn': '🚫',
            '9gag': '📱', 'scrolling': '📱', 'social': '📱',
            'gaming': '🎮', 'game': '🎮', 'games': '🎮',
            'cronometer': '⌚', 'food': '🍽️', 'calories': '⌚',
            
            # Others
            'accessories': '💍', 'jewelry': '💍',
        }
        
        # Check for direct matches first
        for keyword, emoji in emoji_mappings.items():
            if keyword in name_lower:
                return emoji
        
        return "📝"  # Default emoji
    
    def _determine_habit_type(self, values: pd.Series) -> str:
        """Determine habit type based on sample values (from original app logic)"""
        if values.empty:
            return 'binary'
        
        # Try to convert to numeric first
        try:
            numeric_values = pd.to_numeric(values, errors='coerce')
            if not numeric_values.isna().all():
                # Check if values look like time (larger numbers, typically minutes)
                max_val = numeric_values.max()
                # Lower threshold for time detection - your data has values like 20, 30, etc.
                if max_val >= 5:  # Likely time in minutes (was 10, now 5)
                    print(f"Detected time habit: max_val={max_val}, values={list(numeric_values.dropna()[:5])}")  # Debug
                    return 'time'
                else:  # Likely binary (0/1)
                    print(f"Detected binary habit: max_val={max_val}, values={list(numeric_values.dropna()[:5])}")  # Debug
                    return 'binary'
        except:
            pass
        
        # Check if all values are strings (descriptions)
        if values.dtype == 'object':
            print(f"Detected description habit: sample_values={list(values.dropna()[:3])}")  # Debug
            return 'description'
            
        return 'binary'  # Default fallback
    
    def _is_completed(self, value: Any, habit_type: str) -> bool:
        """Determine if a habit entry represents completion (from original app logic)"""
        if pd.isna(value):
            return False
            
        if habit_type == 'binary':
            # Binary habits: only completed if value is exactly 1.0
            try:
                return float(value) == 1.0
            except (ValueError, TypeError):
                return False
                
        elif habit_type == 'time':
            # Time habits: completed if >= 20 minutes
            try:
                return float(value) >= 20.0
            except (ValueError, TypeError):
                return False
                
        else:  # description
            # Description habits don't have streaks in the original app
            return False
    
    def calculate_streaks(self, entries: List[HabitEntry]) -> Dict[str, Dict[str, int]]:
        """Calculate current and best streaks for each habit (from original app logic)"""
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
            
            # Calculate current streak (from original app logic)
            current_streak = 0
            today = date.today()
            
            # Start from the end and count backwards
            for i in range(len(sorted_entries) - 1, -1, -1):
                entry = sorted_entries[i]
                
                # Skip today if it's 0 (potentially unfilled)
                if entry.date == today and not entry.completed:
                    continue
                    
                if entry.completed:
                    current_streak += 1
                else:
                    break  # Break on explicit 0/false
            
            # Calculate best streak
            best_streak = 0
            temp_streak = 0
            
            for entry in sorted_entries:
                if entry.completed:
                    temp_streak += 1
                    best_streak = max(best_streak, temp_streak)
                else:
                    temp_streak = 0
            
            # Check if today is completed
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