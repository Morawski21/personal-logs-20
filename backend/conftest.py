import pytest
import tempfile
import os
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.excel_service import ExcelService
import pandas as pd


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def temp_data_dir():
    """Create a temporary directory for test data."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


@pytest.fixture
def sample_excel_data():
    """Create sample Excel data for testing."""
    data = {
        'Data': ['2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30'],
        'WEEKDAY': ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
        'Tech + Praca': [20, 30, 30, 45],
        'YouTube': [0, 0, 0, 20],
        'Czytanie': [0, 20, 20, 25],
        'Gitara': [20, 0, 20, 25],
        'Inne': [10, 10, 10, 10],
        'Razem': [50, 60, 80, 125],
        'Unnamed: 8': [None, None, None, None],
        '20min clean': [1, 0, 0, 1],
        'YNAB': [1, 1, 1, 1],
        'Anki': [0, 1, 1, 1],
        'Pamiętnik': [1, 1, 1, 1],
        'Gaming <1h': [1, 1, 1, 0],
        'No porn': [None, None, None, None],
        'No Twitter': [None, None, None, None],
        'No junk food': [None, None, None, None],
        'Unnamed: 18': [None, None, None, None],
        'sport': ['siłownia', 'bieganie', 'siłownia', '-'],
        'accessories': ['-', '-', '-', 'Pu20 Cr30'],
        'suplementy': [1, 1, 1, 1]
    }
    return pd.DataFrame(data)


@pytest.fixture
def excel_file_with_data(temp_data_dir, sample_excel_data):
    """Create a test Excel file with sample data."""
    excel_path = temp_data_dir / "test_data.xlsx"
    sample_excel_data.to_excel(excel_path, index=False)
    return excel_path


@pytest.fixture
def excel_service_with_test_data(temp_data_dir):
    """Create an ExcelService instance with test data directory."""
    return ExcelService(str(temp_data_dir))


@pytest.fixture(autouse=True)
def override_settings(temp_data_dir, monkeypatch):
    """Override settings to use temporary directory for tests."""
    monkeypatch.setattr(settings, "EXCEL_DATA_PATH", str(temp_data_dir))