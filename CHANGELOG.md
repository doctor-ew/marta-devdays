# Changelog

All notable changes to Match Day ATL will be documented here.

## [0.1.0.0] - 2026-04-19

### Added
- Fullscreen Google Maps view centered on Mercedes-Benz Stadium with animated real-time MARTA vehicle markers (Lucide Bus/Train icons via AdvancedMarkerElement)
- Live MARTA bus (GTFS-RT protobuf) and train (REST API) feeds with 2-second polling and graceful fallback to mock vehicles
- Claude AI streaming routing recommendations — voice of a local Atlanta friend, time-aware and snarky when the game is days away
- FIFA World Cup 2026 match schedule sidebar (8 Atlanta matches) with single-select picker
- Departure zone picker: Downtown, Midtown, Airport, Decatur, Dunwoody
- Blue Line delay demo mode via `?inject_delay=blue_line` URL param
- Kill switches: `USE_MOCK_CLAUDE` and `USE_MOCK_MARTA_DATA` for safe demo fallback
- Google traffic layer with toggle button
- User geolocation (fail-silent)
