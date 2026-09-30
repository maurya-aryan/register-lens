# Round 2 progress (started 30 Sep 2026, 02:56 IST; submission deadline 12:00 IST)

Requested by user:
1. [x] Repo public: https://github.com/maurya-aryan/register-lens
2. [ ] Map of district with facility locations (Leaflet + OSM tiles)
3. [ ] Expand from Barabanki to all Uttar Pradesh (75 districts, towns, villages)
   - [x] 3,943 real facilities from OSM (PHC 917, CHC 528, HWC 2437, DH 61) -> backend/data/up_facilities.json
   - [x] 75 district boundaries -> backend/data/up_districts.geojson
   - [ ] villages/towns (scripts/fetch_places.py, tiled Overpass; log scripts/data/places.log)
4. [ ] AI chatbot assistant (Gemini function calling over app data)
5. [ ] More varied/messier test pages + evaluation (quota-limited; free tier 20 req/day/model)
6. [ ] Phase 2: regional-language alerts (+ Hindi UI toggle)
7. [ ] Phase 3: expiry redistribution (nearby facilities, officer approve/reject, map lines)
8. [ ] Compare with competitor projects; add "why us" + extra features
9. [ ] Deploy (needs user: gcloud CLI + billing linked)
10. [ ] Update deck + video script + README
