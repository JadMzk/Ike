"""Unit tests for category resistance math."""

from datetime import datetime, timedelta, timezone

from app.services.category_resistance_service import CategoryResistanceService


def test_effective_resistance_after_six_days_inactivity():
    last = datetime(2026, 1, 1, tzinfo=timezone.utc)
    now = last + timedelta(days=6)
    effective = CategoryResistanceService.effective_resistance(0.30, last, now)
    assert effective == 0.45


def test_effective_resistance_clamps_at_max():
    last = datetime(2026, 1, 1, tzinfo=timezone.utc)
    now = last + timedelta(days=365)
    effective = CategoryResistanceService.effective_resistance(1.40, last, now)
    assert effective == 1.50


def test_completion_decrease_clamps_at_min():
    assert CategoryResistanceService.clamp_resistance(0.11) == 0.11
    assert CategoryResistanceService.clamp_resistance(0.09) == 0.10


def test_inactivity_periods_requires_full_two_day_windows():
    last = datetime(2026, 1, 1, tzinfo=timezone.utc)
    assert CategoryResistanceService.inactivity_periods(last, last + timedelta(days=1)) == 0
    assert CategoryResistanceService.inactivity_periods(last, last + timedelta(days=2)) == 1
    assert CategoryResistanceService.inactivity_periods(last, last + timedelta(days=5)) == 2
