# Road re-measured: protocol (fixed before any run, 13 Oct 2026)

Thesis (for the paper): agents with tools and real historical or public data reproduce the famous measurements on the road
from Tycho to Einstein to a black hole, under a blind protocol, with full provenance and published costs. Prior art is cited,
never "first": Krisciunas 2016 (naked-eye Mars), AI Feynman 2020 and symbolic-regression rediscoveries, the April 2026
LLM-Kepler test on synthetic data (failed), Le Verrier 1859 and Newcomb 1882, Isi et al. 2021 and LVK 2025 (GW250114).

Rules for every run
1. Blind instructions. Agents get the data and the question ("find the orbit that fits these positions"; "what drift of
   Mercury's perihelion is left after the planets?"; "did the horizon area grow?"), never the expected answer or its shape
   (no "ellipse", no "43", no "Hawking says yes"). Exploration runs that break this are labelled exploration and re-run.
2. Owner = referee, not pilot. He reviews results and method; he does not steer toward the known answer.
3. Provenance: every number traces to (data file + checksum, code commit, run log). Claude Science runs keep their
   execution log and are exported (Export Metadata) into ep*/out/provenance/. Agent runs log to the harness (modellog,
   DuckDB) and git. Costs (box hours, API, Devin) are recorded per episode in ep*/COSTS.md.
4. Data never committed: ep*/data/ is ignored; each episode has fetch.sh (or fetch.py) + SHA256SUMS.
5. Every cited (not measured) input is marked "cited" wherever it appears (pages, films, paper, article).
6. Verification per episode is fixed in advance: Kepler -> per-night agreement with JPL Horizons (Mars barycenter, body 4,
   DE441); Mercury -> per-transit agreement with Horizons, then the leftover drift vs GR's 42.98"/cy; finale -> GW150914
   calibration vs Isi 2021 (97%/95%), then GW250114 vs LVK 2025.
7. Public text: no "first"/"never before"; AI-WRITING-RULES pass; Fable claims review before anything public.

Deviations
- 2026-10-14, episode 1 (blind-fit): the brief named the model families (circle with equant, Kepler ellipse) and quoted Kepler's 8′, against rule 1. The run is a blind measurement under prescribed models, not a blind discovery, and is labelled so in blind-fit/REPORT.md. A model-agnostic re-run is in ep1-kepler-tycho/agnostic-fit/ (in progress).
