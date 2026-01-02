from fastapi import APIRouter
from typing import Dict, Any, List

router = APIRouter()

@router.get("/external-links")
def get_external_links() -> Dict[str, List[Dict[str, str]]]:
    """Get external links configuration for quick access"""
    return {
        "links": [
            {
                "name": "YNAB",
                "url": "https://app.ynab.com",
                "icon": "currency-dollar"
            },
            {
                "name": "Garmin Connect",
                "url": "https://connect.garmin.com",
                "icon": "heart"
            },
            {
                "name": "Cronometer",
                "url": "https://cronometer.com",
                "icon": "chart-bar"
            }
        ]
    }
