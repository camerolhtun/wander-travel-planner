from datetime import date

from app.models.db_models import Trip
from app.services.gemini import _mock_itinerary


def _trip(days: int) -> Trip:
    return Trip(
        destination="Kyoto",
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 1 + days - 1),
        budget_total=1500,
        currency="USD",
        num_travelers=2,
        interests=["food", "history"],
        travel_style="mid",
        pace="moderate",
    )


def test_mock_itinerary_day_count() -> None:
    result = _mock_itinerary(_trip(3))
    assert [d.day_index for d in result.days] == [1, 2, 3]
    assert all(len(d.items) >= 1 for d in result.days)


def test_mock_itinerary_single_day() -> None:
    result = _mock_itinerary(_trip(1))
    assert len(result.days) == 1
