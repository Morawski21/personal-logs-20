import pytest
import pandas as pd
from pathlib import Path
from app.services.excel_service import ExcelService
from app.models.habit import Habit, HabitEntry


def test_find_excel_files(excel_service_with_test_data, excel_file_with_data):
    """Test finding Excel files in directory."""
    service = excel_service_with_test_data
    files = service.find_excel_files()
    
    assert len(files) == 1
    assert files[0].name == "test_data.xlsx"


def test_parse_excel_file(excel_service_with_test_data, excel_file_with_data):
    """Test parsing Excel file and extracting habits and entries."""
    service = excel_service_with_test_data
    result = service.parse_excel_file(excel_file_with_data)
    
    # Should return expected structure
    assert 'habits' in result
    assert 'entries' in result
    assert 'file_path' in result
    assert 'last_modified' in result
    
    # Should have habits parsed
    habits = result['habits']
    assert len(habits) > 0
    
    # Should have entries parsed
    entries = result['entries']
    assert len(entries) > 0
    
    # Check habit types are correctly identified
    time_habits = [h for h in habits if h.habit_type == 'time']
    binary_habits = [h for h in habits if h.habit_type == 'binary']
    
    assert len(time_habits) > 0  # Should have productivity time habits
    assert len(binary_habits) > 0  # Should have binary habits


def test_habit_type_detection(excel_service_with_test_data):
    """Test habit type detection logic."""
    service = excel_service_with_test_data
    
    # Test time-based values (large numbers in minutes)
    time_values = pd.Series([20, 30, 45, 60])
    assert service._determine_habit_type(time_values) == 'time'
    
    # Test binary values (0 and 1)
    binary_values = pd.Series([0, 1, 1, 0])
    assert service._determine_habit_type(binary_values) == 'binary'
    
    # Test string values (descriptions)
    string_values = pd.Series(['siłownia', 'bieganie', '-'])
    assert service._determine_habit_type(string_values) == 'description'


def test_completion_detection(excel_service_with_test_data):
    """Test completion detection for different habit types."""
    service = excel_service_with_test_data
    
    # Binary habits: only 1.0 is completed
    assert service._is_completed(1.0, 'binary') == True
    assert service._is_completed(0.0, 'binary') == False
    assert service._is_completed('1', 'binary') == True
    assert service._is_completed('0', 'binary') == False
    
    # Time habits: >= 20 minutes is completed
    assert service._is_completed(20, 'time') == True
    assert service._is_completed(30, 'time') == True
    assert service._is_completed(10, 'time') == False
    assert service._is_completed(0, 'time') == False
    
    # Description habits: never completed (no streaks)
    assert service._is_completed('anything', 'description') == False


def test_streak_calculation(excel_service_with_test_data, excel_file_with_data):
    """Test streak calculation logic."""
    service = excel_service_with_test_data
    result = service.parse_excel_file(excel_file_with_data)
    
    entries = result['entries']
    streaks = service.calculate_streaks(entries)
    
    # Should have streak data for habits
    assert len(streaks) > 0
    
    # Each streak should have required fields
    for habit_id, streak_data in streaks.items():
        assert 'current_streak' in streak_data
        assert 'best_streak' in streak_data
        assert 'completed_today' in streak_data
        assert isinstance(streak_data['current_streak'], int)
        assert isinstance(streak_data['best_streak'], int)
        assert isinstance(streak_data['completed_today'], bool)


def test_smart_emoji_mapping(excel_service_with_test_data):
    """Test smart emoji mapping for habits."""
    service = excel_service_with_test_data
    
    # Test known mappings
    assert service._get_smart_emoji('Tech + Praca') == '💻'
    assert service._get_smart_emoji('YouTube') == '🎥'
    assert service._get_smart_emoji('Czytanie') == '📚'
    assert service._get_smart_emoji('Gitara') == '🎸'
    assert service._get_smart_emoji('YNAB') == '💰'
    assert service._get_smart_emoji('sport') == '🏃'
    
    # Test default emoji
    assert service._get_smart_emoji('Unknown Habit') == '📝'


def test_empty_excel_file(excel_service_with_test_data, temp_data_dir):
    """Test handling of empty Excel file."""
    service = excel_service_with_test_data
    
    # Create empty Excel file
    empty_df = pd.DataFrame()
    empty_file = temp_data_dir / "empty.xlsx"
    empty_df.to_excel(empty_file, index=False)
    
    result = service.parse_excel_file(empty_file)
    
    # Should handle gracefully
    assert result['habits'] == []
    assert result['entries'] == []


def test_file_not_found(excel_service_with_test_data, temp_data_dir):
    """Test handling of non-existent file."""
    service = excel_service_with_test_data
    
    non_existent_file = temp_data_dir / "does_not_exist.xlsx"
    result = service.parse_excel_file(non_existent_file)
    
    # Should handle gracefully
    assert result['habits'] == []
    assert result['entries'] == []