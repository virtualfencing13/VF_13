"""
modules/decision.py
===================
DecisionEngine — maps intruder list to a status string.

  SAFE   → zero persons inside fence
  UNSAFE → one or more persons inside fence

Designed for extension:
  - severity()    → LOW / MEDIUM / HIGH based on count
  - dwell_check() → UNSAFE only after N consecutive frames
  - zone_check()  → per-zone severity levels
"""

from __future__ import annotations


class DecisionEngine:

    STATUS_SAFE   = "SAFE"
    STATUS_UNSAFE = "UNSAFE"

    def evaluate(self, intruders: list) -> str:
        """Return 'SAFE' or 'UNSAFE' based on intruder count."""
        return self.STATUS_UNSAFE if intruders else self.STATUS_SAFE

    # ── Future extensions ─────────────────────────────────────────────────────

    def severity(self, intruders: list) -> str:
        """
        STUB — multi-level severity.
        Uncomment and use in events.py when needed.
        """
        n = len(intruders)
        if n == 0:   return "NONE"
        if n == 1:   return "LOW"
        if n <= 3:   return "MEDIUM"
        return "HIGH"
