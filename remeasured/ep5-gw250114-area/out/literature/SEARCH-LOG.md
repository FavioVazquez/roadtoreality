# Literature search log (2026-10-14, 04:25–05:10 UTC)

The Literature Graph connector was not attached to this session, so its underlying sources were queried directly. Raw responses are in `search_raw/`.

| step | source | what | raw file |
|---|---|---|---|
| 1 | arXiv API (`export.arxiv.org`) | id lookup of the six user-supplied papers; 31 keyword queries across the five episodes | `lit_arxiv_search.json`, `lit_abstracts.json` |
| 2 | OpenAlex (`api.openalex.org`, stored key) | 26 full-text searches (noisy for historical topics) + 15 `title.search` filters | `lit_openalex_search.json`, `lit_openalex_title.txt` |
| 3 | CrossRef (`api.crossref.org`) | 27 free-text citation lookups for known historical papers; all 50 DOIs verified (none retracted) | `lit_crossref.json`, `lit_master.json` |
| 4 | OpenAlex | one citation-graph step (backward + forward) from 10 seed papers | `lit_expand.txt` |
| 5 | OpenAlex | abstracts / bibliographic records for 30 historical DOIs | `lit_hist_works.json` |
| 6 | web search | KeplerBench (no paper found); Newton Moon-test reanalyses (found Aoki 1992/1996); Jupiter-satellite table analyses | — |
| 7 | arXiv PDFs + publisher OA | full text read for: 2111.12210 (data section), 2312.09766, 2312.12315, 2311.13300, 2603.05835, 2606.06592, 1503.06861, 2503.12543, Will 2014 LRR | not redistributed |

Full texts could not be retrieved for Morrison & Ward 1975, Aoki 1992, or Carman 2025a/b (publisher returned 403 or the landing page only). Those are cited from their abstracts or landing pages, and refs.bib marks them `AB` or `MD` accordingly.

The BibTeX was built from CrossRef records (DOI entries), arXiv API metadata (arXiv-only entries) and Zenodo record metadata (data releases). Collaboration author lists are shortened to the collaboration names. The file parses with pybtex: 67 entries.

## Addition 2026-10-14 (after the pass)
KeplerBench (anonymous NeurIPS 2026 submission, OpenReview RdErwlc7jJ) was supplied by the project owner from a PDF they obtained. The agent did not fetch it, because the OpenReview page is behind a browser check. It was added to refs.bib as `KeplerBench2026` (@misc, url, no DOI/arXiv id) and to RELATED-WORK.md episode 1 as the closest prior work, with the content as relayed by the owner.
