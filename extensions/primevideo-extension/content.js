chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_scan") {
        startScan();
    }
});

async function startScan() {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // ── Overlay ────────────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'vaulty-overlay';
    overlay.style.cssText = [
        'position:fixed;top:10px;right:10px;padding:15px 18px',
        'background:#0d0e1a;color:white;z-index:99999;border-radius:12px',
        'font-family:sans-serif;font-size:13px;box-shadow:0 4px 20px rgba(0,168,225,0.3)',
        'border:1px solid #00a8e1;min-width:230px;line-height:1.6'
    ].join(';');
    overlay.innerHTML = `
        <div style="font-weight:bold;color:#00a8e1;margin-bottom:4px">📡 Vaulty — Prime Video</div>
        <div id="pv-phase" style="color:#aaa;font-size:12px">Phase 1: Loading page...</div>
        <div id="pv-cnt"  style="font-size:17px;margin-top:4px;font-weight:bold">0 titles</div>
    `;
    document.body.append(overlay);

    const setPhase = (txt) => { document.getElementById('pv-phase').innerText = txt; };
    const setCnt   = (n)   => { document.getElementById('pv-cnt').innerText = n + ' titles found'; };

    const map = new Map();
    const sleep2 = sleep;

    // ── HELPERS ────────────────────────────────────────────────────────────────
    // Matches numeric ordinals like "2.ª", "4.º" and word ordinals in Spanish
    const ORDINAL_ES = '(?:\\d+\\.[ªº]|Primera|Segunda|Tercera|Cuarta|Quinta|Sexta|Séptima|Octava|Novena|Décima)';
    const cleanTitle = (t) => {
        if (!t) return '';
        return t
            .replace(new RegExp(`\\s*[-–]\\s*${ORDINAL_ES}\\s*TEMPORADA.*$`, 'i'), '')
            .replace(new RegExp(`\\s*[:,]\\s*${ORDINAL_ES}\\s*TEMPORADA.*$`, 'i'), '')
            .replace(new RegExp(`\\s+${ORDINAL_ES}\\s*TEMPORADA.*$`, 'i'), '')
            .replace(new RegExp(`\\s*[-–]\\s*${ORDINAL_ES}\\s*Temporada.*$`, 'i'), '')
            .replace(new RegExp(`\\s*[:,]\\s*${ORDINAL_ES}\\s*Temporada.*$`, 'i'), '')
            .replace(new RegExp(`\\s+${ORDINAL_ES}\\s*Temporada.*$`, 'i'), '')
            .replace(/\s*[-–]\s*Season\s*\d+.*$/i, '')
            .replace(/\s*[-–]\s*Temporada\s*\d+.*$/i, '')
            .replace(/\s*:\s*Season\s*\d+.*$/i, '')
            .replace(/\s*:\s*Temporada\s*\d+.*$/i, '')
            .replace(/Season\s*\d+.*$/i, '')
            .replace(/Temporada\s*\d+.*$/i, '')
            .replace(/S\d{1,2}E\d{1,2}.*/i, '')
            .replace(/\s*[-–:]\s*$/, '')
            .trim();
    };

    // ── Date helpers (precomputed for performance) ────────────────────────────
    // The old approach walked the DOM for every link (~O(n²)) and froze the page.
    // Instead: scan all date headings once into a flat array, then for each element
    // find the closest preceding date with a single linear pass → O(n) total.
    const monthMap = {
        enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,
        septiembre:9,octubre:10,noviembre:11,diciembre:12,
        january:1,february:2,march:3,april:4,may:5,june:6,
        july:7,august:8,september:9,october:10,november:11,december:12
    };
    const dateRe = /\d{1,2}\s+de\s+\w+|\b(?:january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i;

    const parseDate = (txt) => {
        const m = txt.match(/(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/i)
                 || txt.match(/(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i);
        if (!m) return null;
        const day = parseInt(m[1]);
        const mon = monthMap[m[2].toLowerCase()];
        const year = m[3] ? parseInt(m[3]) : new Date().getFullYear();
        if (!mon || day < 1 || day > 31) return null;
        return `${year}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    };

    // Build ordered list of { node, iso } once, before Phase 4
    const dateLandmarks = [];
    document.querySelectorAll('h1,h2,h3,h4').forEach(h => {
        const t = h.innerText?.trim() || '';
        if (dateRe.test(t)) {
            const iso = parseDate(t);
            if (iso) dateLandmarks.push({ node: h, iso });
        }
    });

    // Return the ISO date of the nearest date heading that precedes `el` in the DOM
    const findNearestDate = (el) => {
        if (dateLandmarks.length === 0) return null;
        let best = null;
        for (const { node, iso } of dateLandmarks) {
            // DOCUMENT_POSITION_FOLLOWING: landmark is before el (el comes after)
            if (node.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
                best = iso;
            }
        }
        return best;
    };

    const extractEp = (t) => {
        if (!t) return 0;
        const m = t.match(/S\d+\s*E(\d+)/i)
               || t.match(/(?:Ep\.?|Episode|Episodio|Ep\s)[\s#]?(\d+)/i)
               || t.match(/\bE(\d{1,3})\b/);
        return m ? parseInt(m[1]) : 0;
    };

    const upsert = (title, { imgUrl = '', contentUrl = '', epNum = 0, date = null } = {}) => {
        title = cleanTitle(title);
        if (!title || title.length < 2) return;
        const key = title.toUpperCase();
        if (!map.has(key)) {
            map.set(key, { title, currentEp: epNum || 1, status: 'Viendo', imgUrl, contentUrl, dates: date ? [date] : [] });
        } else {
            const e = map.get(key);
            if (epNum > e.currentEp) e.currentEp = epNum;
            if (!e.imgUrl && imgUrl) e.imgUrl = imgUrl;
            if (!e.dates) e.dates = [];
            if (date && !e.dates.includes(date)) e.dates.push(date);
        }
        setCnt(map.size);
    };

    // ── PHASE 1 — Scroll to load all lazy items ────────────────────────────────
    setPhase('Phase 1: Scrolling to load all items...');
    let lastH = 0, noChange = 0, scrollTries = 0;
    const MAX_SCROLL = 120; // safety cap — ~84 seconds max
    while (scrollTries < MAX_SCROLL) {
        scrollTries++;
        window.scrollBy(0, 800);
        await sleep(700);
        const h = document.body.scrollHeight;
        if (h === lastH) {
            noChange++;
            if (noChange > 5) break; // height stopped growing → all content loaded
        } else {
            noChange = 0;
            lastH = h;
        }
    }
    window.scrollTo(0, 0);
    await sleep(600);

    // ── PHASE 2 — Expand all episode dropdowns ────────────────────────────────
    setPhase('Phase 2: Expanding series episodes...');

    // The checkbox id is "season-amzn1.dv.gti.XXX-dropdown-TIMESTAMP".
    // The label[for=...] is a sibling inside the same div. Click the label.
    const expandSeriesRows = async () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="season-amzn1"]');
        for (const cb of checkboxes) {
            if (!cb.checked) {
                const lbl = document.querySelector(`label[for="${cb.id}"]`) || cb.parentElement?.querySelector('label');
                if (lbl) lbl.click(); else cb.click();
                await sleep(150);
            }
        }
    };
    await expandSeriesRows();
    await sleep(800);
    await expandSeriesRows(); // second pass for lazily rendered rows
    await sleep(500);

    // ── PHASE 3 — Extract series data ────────────────────────────────────────
    setPhase('Phase 3: Scanning series...');

    // Real DOM structure (confirmed from HTML):
    //
    // <li data-automation-id="wh-item-...">          ← one per date×season block
    //   <div>
    //     <div data-testid="activity-history-item">  ← card with title + toggle
    //       <a href="..."><img alt="TITLE - Temporada N"></a>
    //       <div class="MO5Fj3">
    //         <div class="_6YbHut">
    //           <a ...>TITLE - Temporada N</a>        ← series title TEXT
    //         </div>
    //         <div data-testid="wh-episodes-watched-SEASON_ID">  ← toggle div
    //           <input type="checkbox" id="season-SEASON_ID-dropdown-TS">
    //           <label ...>Episodios vistos</label>
    //         </div>
    //       </div>
    //     </div>
    //     <ul class="zcH+eA">                        ← SIBLING of the card div
    //       <li data-testid="wh-episode-...">
    //         <div data-testid="activity-history-item-episode">
    //           <p>Episodio 3: Título</p>
    //         </div>
    //       </li>
    //     </ul>
    //   </div>
    // </li>
    //
    // KEY INSIGHT: The same SEASON_ID appears in multiple date blocks
    // (e.g. Fallout T1 appears on 3 different dates). We deduplicate by SEASON_ID
    // and keep only the highest episode number seen across all occurrences.

    // seasonData: Map<seasonId, { seriesTitle, imgUrl, maxEp, seasonNum, contentUrl, date }>
    const seasonData = new Map();

    document.querySelectorAll('[data-testid^="wh-episodes-watched-"]').forEach(toggleDiv => {
        const seasonId = toggleDiv.getAttribute('data-testid').replace('wh-episodes-watched-', '');
        if (!seasonId) return;

        const card = toggleDiv.closest('[data-testid="activity-history-item"]');
        if (!card) return;
        const cardParent = card.parentElement;
        let ul = null;
        if (cardParent) {
            let sib = cardParent.firstElementChild;
            while (sib) {
                if (sib !== card && sib.tagName === 'UL') { ul = sib; break; }
                sib = sib.nextElementSibling;
            }
            if (!ul) ul = cardParent.querySelector('ul');
        }
        if (!ul) return;

        const epItems = ul.querySelectorAll('[data-testid^="wh-episode-"]');
        if (epItems.length === 0) return;

        let blockMaxEp = 0;
        epItems.forEach(li => {
            const p = li.querySelector('[data-testid="activity-history-item-episode"] p');
            if (!p) return;
            const ep = extractEp(p.innerText.trim());
            if (ep > blockMaxEp) blockMaxEp = ep;
        });
        if (blockMaxEp === 0) blockMaxEp = epItems.length;

        const titleLink = card.querySelector('a._1NNx6V, a[class*="ZrYV9r"]')
                        || card.querySelector('div._6YbHut a, div[class*="_6YbHut"] a');
        const rawTitle = titleLink?.innerText?.trim()
                       || card.querySelector('img')?.getAttribute('alt')?.trim()
                       || '';
        if (!rawTitle || rawTitle.length < 2) return;

        const seriesTitle = cleanTitle(rawTitle);
        if (!seriesTitle || seriesTitle.length < 2) return;

        // Extract season number from raw title. Handles all formats seen in the wild:
        //   "Fallout - Temporada 1"          → 1
        //   "INVENCIBLE - 2.ª TEMPORADA"     → 2
        //   "The Boys - 4.ª Temporada"       → 4
        //   "Generación V - 1.ª Temporada"   → 1
        //   "Hotel Hazbin - Segunda temporada"→ 2
        //   "Dororo" (no season suffix)       → 1 (assumed)
        const ORDINAL_NUM = { primera:1,segunda:2,tercera:3,cuarta:4,quinta:5,sexta:6,séptima:7,octava:8,novena:9,décima:10 };
        let seasonNum = 0;

        // Format: "Temporada N" or "Season N"
        const snDigit = rawTitle.match(/[Tt]emporada\s+(\d+)|[Ss]eason\s+(\d+)/);
        if (snDigit) {
            seasonNum = parseInt(snDigit[1] || snDigit[2]);
        }

        // Format: "N.ª TEMPORADA" or "N.º TEMPORADA" (e.g. "2.ª TEMPORADA", "4.ª Temporada")
        if (!seasonNum) {
            const snOrdNum = rawTitle.match(/(\d+)\.[ªº]\s*[Tt]emporada/);
            if (snOrdNum) seasonNum = parseInt(snOrdNum[1]);
        }

        // Format: "Segunda temporada", "Tercera Temporada", etc.
        if (!seasonNum) {
            const snWord = rawTitle.match(/\b(primera|segunda|tercera|cuarta|quinta|sexta|séptima|octava|novena|décima)\s+[Tt]emporada/i);
            if (snWord) seasonNum = ORDINAL_NUM[snWord[1].toLowerCase()] || 0;
        }

        // If no season info at all → assume S1 (e.g. "Dororo")
        if (seasonNum === 0 && !/[Tt]emporada|[Ss]eason/i.test(rawTitle)) seasonNum = 1;

        const imgEl = card.querySelector('img');
        const imgUrl = imgEl?.src || '';
        const contentUrl = titleLink?.href || card.querySelector('a[href*="/detail/"], a[href*="/dp/"]')?.href || '';
        const date = findNearestDate(toggleDiv);

        if (!seasonData.has(seasonId)) {
            seasonData.set(seasonId, { seriesTitle, imgUrl, maxEp: blockMaxEp, seasonNum, seasonId, contentUrl, date });
        } else {
            const entry = seasonData.get(seasonId);
            if (blockMaxEp > entry.maxEp) entry.maxEp = blockMaxEp;
            if (!entry.imgUrl && imgUrl) entry.imgUrl = imgUrl;
            if (!entry.contentUrl && contentUrl) entry.contentUrl = contentUrl;
            if (!entry.date && date) entry.date = date;
        }
    });

    // ── Aggregate seasons → series ────────────────────────────────────────────
    // seriesAgg: Map<seriesKey, { title, imgUrl, contentUrl, seasons: Map<seasonKey, maxEp>, dates: string[] }>
    // seasonKey = seasonNum if > 0, otherwise the raw seasonId (prevents collisions when
    // Amazon doesn't include a season number in the title, e.g. "Invincible" S1 and S2
    // both appearing without a number would both get seasonNum=1 and overwrite each other)
    const seriesAgg = new Map();
    seasonData.forEach(({ seriesTitle, imgUrl, maxEp, seasonNum, seasonId, contentUrl, date }) => {
        const key = seriesTitle.toUpperCase();
        if (!seriesAgg.has(key)) {
            seriesAgg.set(key, { title: seriesTitle, imgUrl, contentUrl, seasons: new Map(), dates: [] });
        }
        const e = seriesAgg.get(key);
        if (!e.imgUrl && imgUrl) e.imgUrl = imgUrl;
        if (!e.contentUrl && contentUrl) e.contentUrl = contentUrl;
        if (date && !e.dates.includes(date)) e.dates.push(date);
        // Use seasonNum as key if valid and unique; otherwise fall back to seasonId
        // to avoid different seasons colliding on the same number
        const seasonKey = seasonNum > 0 ? seasonNum : seasonId;
        const prev = e.seasons.get(seasonKey) || 0;
        if (maxEp > prev) e.seasons.set(seasonKey, maxEp);
    });

    // ── Phase 3b — Calculate total episodes ──────────────────────────────────
    setPhase('Phase 3b: Calculating totals...');

    // ↓ Change this number if you want a different default episode count per season
    const DEFAULT_EP_COUNT = 8;

    // Simple formula: if the user reached S3E8, they watched all of S1+S2 too.
    // total = (maxSeasonNum - 1) * DEFAULT_EP_COUNT + maxEpInThatSeason
    // If only S1 is known: total = maxEp of S1 (no multiplication needed)
    //
    // Exception: if the user only watched 1 ep of a later season (dropped show),
    // don't add fake earlier seasons — just count what was actually seen.
    const MIN_EPS_TO_INFER = 2; // ↓ change this threshold if needed

    seriesAgg.forEach(({ title, imgUrl, contentUrl, seasons, dates }) => {
        const key = title.toUpperCase();

        // Get only numeric season keys
        const numericEntries = [...seasons.entries()].filter(([k]) => typeof k === 'number');

        let totalEp;
        if (numericEntries.length === 0) {
            // No season numbers parsed (e.g. "Dororo") — just sum all known maxEps
            totalEp = [...seasons.values()].reduce((a, b) => a + b, 0) || 1;
        } else {
            const maxSeasonNum = Math.max(...numericEntries.map(([k]) => k));
            const maxEpInLastSeason = seasons.get(maxSeasonNum) || 0;

            const shouldInfer = maxSeasonNum > 1 && maxEpInLastSeason > MIN_EPS_TO_INFER;
            if (shouldInfer) {
                totalEp = (maxSeasonNum - 1) * DEFAULT_EP_COUNT + maxEpInLastSeason;
            } else {
                // Only watched a little of a later season, or single season — count as-is
                totalEp = [...seasons.values()].reduce((a, b) => a + b, 0) || 1;
            }
        }

        const sorted = [...dates].sort();
        map.set(key, {
            title,
            currentEp: totalEp,
            status: 'Viendo',
            imgUrl,
            contentUrl,
            dates,
            startDate: sorted[0] || '',
            lastDate:  sorted[sorted.length - 1] || ''
        });
        setCnt(map.size);
    });

    // ── PHASE 4 — Scan Movies + other direct links ─────────────────────────────
    setPhase('Phase 4: Scanning movies...');

    document.querySelectorAll(
        'a[href*="/detail/"], a[href*="/gp/video/detail/"], a[href*="/dp/"]'
    ).forEach(link => {
        let title = link.getAttribute('aria-label') || '';
        let imgUrl = '';

        let container = link;
        for (let i = 0; i < 5; i++) {
            if (!container.parentElement) break;
            container = container.parentElement;
            if (container.getBoundingClientRect().width > window.innerWidth * 0.65) break;
        }

        if (!title) {
            const h = container.querySelector('h1,h2,h3,h4,[data-testid*="title"]');
            if (h) title = h.innerText.trim();
        }
        if (!title && link.innerText.trim().length > 1) title = link.innerText.trim();

        // Skip anything already captured as a series in Phase 3,
        // and skip episode/season-like titles
        if (/Season|Temporada|Episode|Episodio|S\d+E\d+/i.test(title)) return;
        // Also skip if this link is inside a series episode list
        if (link.closest('[data-testid^="wh-episode-"]')) return;
        // Skip if already in map as a series (from Phase 3)
        const cleanedCheck = cleanTitle(title);
        if (map.has(cleanedCheck.toUpperCase())) return;

        const img = container.querySelector('img');
        if (img) imgUrl = img.src || '';

        const movieDate = findNearestDate(link);
        upsert(title, { imgUrl, contentUrl: link.href, epNum: 0, date: movieDate });
    });

    // ── DONE ───────────────────────────────────────────────────────────────────
    overlay.remove();

    const items = Array.from(map.values()).map(({ dates, ...rest }) => {
        // Series: startDate/lastDate already set in Phase 3b, dates[] may still be present
        if (rest.startDate !== undefined) {
            return rest; // already has startDate + lastDate
        }
        // Movies/other: derive from dates[] collected in upsert()
        const sorted = [...(dates || [])].sort();
        return { ...rest, startDate: sorted[0] || '', lastDate: sorted[sorted.length - 1] || '' };
    });
    if (items.length === 0) {
        alert('No titles found.\nMake sure you are on your Watch History page:\namazon.com/gp/video/history');
        return;
    }

    const json = JSON.stringify(items, null, 2);

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:99999;display:flex;justify-content:center;align-items:center';
    modal.innerHTML = `
    <div style="background:#1a1a2e;border:1px solid #00a8e1;padding:28px;border-radius:16px;text-align:center;width:530px;max-width:96vw;font-family:sans-serif;box-shadow:0 10px 40px rgba(0,168,225,0.25)">
        <h2 style="color:#00a8e1;margin-top:0">✅ Scan Complete</h2>
        <p style="color:#aaa">Captured <b style="color:white">${items.length}</b> unique titles.</p>
        <p style="color:#666;font-size:12px;margin-top:-8px">Paste the JSON below into Vaulty's Prime Video importer.</p>
        <textarea id="pv-out" style="width:100%;height:240px;border:1px solid #333;border-radius:8px;padding:10px;font-family:monospace;font-size:11px;background:#0d0e1a;color:#7fdbff;resize:none;margin-bottom:15px;box-sizing:border-box">${json}</textarea>
        <div style="display:flex;gap:10px">
            <button id="btnCopy" style="flex:1;padding:12px;background:#00a8e1;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">COPY JSON</button>
            <button id="btnDl"   style="flex:1;padding:12px;background:#1a6b8a;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">DOWNLOAD</button>
            <button id="btnClose" style="padding:12px 16px;background:#2d2d3e;color:#aaa;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">✕</button>
        </div>
    </div>`;
    document.body.append(modal);

    document.getElementById('btnCopy').onclick = () => {
        document.getElementById('pv-out').select();
        document.execCommand('copy');
        document.getElementById('btnCopy').innerText = 'COPIED! ✅';
        setTimeout(() => document.getElementById('btnCopy').innerText = 'COPY JSON', 2000);
    };

    document.getElementById('btnDl').onclick = () => {
        const blob = new Blob([json], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob),
            download: 'vaulty_primevideo.json'
        });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    document.getElementById('btnClose').onclick = () => modal.remove();
}

