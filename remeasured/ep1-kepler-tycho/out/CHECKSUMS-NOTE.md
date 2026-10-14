# SHA256SUMS update, 2026-10-14

`data/hip/hip2_all.tsv` changed between the first checksum list and the batch run. `reduce.py` appends a Hipparcos row
when a reference star is missing from the table. The old hash (972bba13...) equals the first 4 rows of the current
58-row file; the change is 54 appended rows, with no duplicate ids and the old rows intact. The file's mtime (2026-10-13
22:17 local) is before the batch run (22:50-22:53), so the frozen product `out/mars_positions.csv` was made with the
58-row table, whose hash (f24d914d...) is now recorded.

The Horizons verification cache (`data/horizons/batch_cache.json`, `data/horizons/raw/*`) is not an input to the product
(verification only) and is no longer checksummed; `fetch.sh` already excludes `horizons/` and `hip/` from its check.
