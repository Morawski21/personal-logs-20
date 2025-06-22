import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


def test_analytics_endpoint_success(client, excel_file_with_data):
    """Test analytics endpoint with valid data."""
    with patch('app.api.analytics.excel_service') as mock_service:
        # Mock the service to return test data
        mock_service.find_excel_files.return_value = [excel_file_with_data]
        
        # Create mock habits and entries
        mock_habits = [
            MagicMock(id="habit_1", name="Test Habit", habit_type="binary"),
            MagicMock(id="habit_2", name="Time Habit", habit_type="time")
        ]
        mock_entries = [
            MagicMock(habit_id="habit_1", completed=True),
            MagicMock(habit_id="habit_2", completed=False)
        ]
        
        mock_service.parse_excel_file.return_value = {
            'habits': mock_habits,
            'entries': mock_entries
        }
        
        mock_service.calculate_streaks.return_value = {
            'habit_1': {'current_streak': 5, 'best_streak': 10, 'completed_today': True},
            'habit_2': {'current_streak': 0, 'best_streak': 3, 'completed_today': False}
        }
        
        response = client.get("/api/analytics/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check expected fields
        assert "total_habits" in data
        assert "active_streaks" in data
        assert "perfect_days_streak" in data
        assert "completed_today" in data
        assert "completion_rate" in data
        
        assert data["total_habits"] == 2
        assert data["active_streaks"] == 1  # Only habit_1 has active streak
        assert data["completed_today"] == 1  # Only habit_1 completed today


def test_analytics_endpoint_no_files(client):
    """Test analytics endpoint when no Excel files found."""
    with patch('app.api.analytics.excel_service') as mock_service:
        mock_service.find_excel_files.return_value = []
        
        response = client.get("/api/analytics/")
        
        # Should still return 200 with default values
        assert response.status_code == 200
        data = response.json()
        assert data["total_habits"] == 0
        assert data["completion_rate"] == 0


def test_productivity_chart_endpoint_success(client, excel_file_with_data):
    """Test productivity chart endpoint with valid data."""
    with patch('app.api.analytics.excel_service') as mock_service:
        mock_service.find_excel_files.return_value = [excel_file_with_data]
        
        # Create mock time-based habits
        mock_time_habits = [
            MagicMock(id="habit_tech", name="Tech + Praca", habit_type="time"),
            MagicMock(id="habit_reading", name="Czytanie", habit_type="time")
        ]
        
        mock_service.parse_excel_file.return_value = {
            'habits': mock_time_habits,
            'entries': []  # Simplified for this test
        }
        
        response = client.get("/api/analytics/productivity-chart")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check expected structure
        assert "chart_data" in data
        assert "categories" in data
        assert "category_colors" in data
        
        # Should have categories based on habit names
        assert len(data["categories"]) == 2
        assert "Tech + Praca" in data["categories"]
        assert "Czytanie" in data["categories"]


def test_productivity_chart_endpoint_no_time_habits(client, excel_file_with_data):
    """Test productivity chart endpoint when no time-based habits found."""
    with patch('app.api.analytics.excel_service') as mock_service:
        mock_service.find_excel_files.return_value = [excel_file_with_data]
        
        # Only binary habits, no time habits
        mock_binary_habits = [
            MagicMock(id="habit_binary", name="Binary Habit", habit_type="binary")
        ]
        
        mock_service.parse_excel_file.return_value = {
            'habits': mock_binary_habits,
            'entries': []
        }
        
        response = client.get("/api/analytics/productivity-chart")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return empty data structure
        assert data["chart_data"] == []
        assert data["categories"] == []
        assert data["category_colors"] == {}


def test_productivity_chart_30days_endpoint(client, excel_file_with_data):
    """Test 30-day productivity chart endpoint."""
    with patch('app.api.analytics.excel_service') as mock_service:
        mock_service.find_excel_files.return_value = [excel_file_with_data]
        
        mock_time_habits = [
            MagicMock(id="habit_tech", name="Tech + Praca", habit_type="time")
        ]
        
        mock_service.parse_excel_file.return_value = {
            'habits': mock_time_habits,
            'entries': []
        }
        
        response = client.get("/api/analytics/productivity-chart-30days")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check expected structure
        assert "chart_data" in data
        assert "categories" in data
        assert "category_colors" in data


def test_productivity_metrics_endpoint(client, excel_file_with_data):
    """Test productivity metrics endpoint."""
    with patch('app.api.analytics.excel_service') as mock_service:
        mock_service.find_excel_files.return_value = [excel_file_with_data]
        
        mock_time_habits = [
            MagicMock(id="habit_tech", name="Tech + Praca", habit_type="time")
        ]
        
        mock_service.parse_excel_file.return_value = {
            'habits': mock_time_habits,
            'entries': []
        }
        
        response = client.get("/api/analytics/productivity-metrics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check expected metrics
        expected_fields = [
            "avg_daily_productivity",
            "max_daily_productivity", 
            "total_productive_hours",
            "avg_daily_productivity_change",
            "max_daily_productivity_change",
            "total_productive_hours_change"
        ]
        
        for field in expected_fields:
            assert field in data
            assert isinstance(data[field], (int, float))


def test_analytics_error_handling(client):
    """Test error handling in analytics endpoints."""
    with patch('app.api.analytics.excel_service') as mock_service:
        # Simulate an error
        mock_service.find_excel_files.side_effect = Exception("Test error")
        
        response = client.get("/api/analytics/")
        
        assert response.status_code == 500
        assert "Error loading analytics" in response.json()["detail"]