"""Contract: settings/retention endpoints."""
from __future__ import annotations

import pytest
import httpx


@pytest.mark.settings
def test_get_retention_settings(http: httpx.Client) -> None:
    r = http.get("/api/v1/settings/retention")
    assert r.status_code == 200
    body = r.json()
    # Must contain at least one known retention key
    assert any(k in body for k in ("max_runs", "max_results_per_run", "max_age_days", "retention")), (
        f"Retention response missing expected keys: {body}"
    )


@pytest.mark.settings
def test_get_configs_list(http: httpx.Client) -> None:
    r = http.get("/api/v1/configs")
    assert r.status_code == 200
    body = r.json()
    assert "configs" in body or isinstance(body, list), f"Unexpected configs shape: {body}"
