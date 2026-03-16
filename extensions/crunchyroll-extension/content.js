// LISTENER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_scan") {
        startV9Scan();
    }
});

async function startV9Scan() {
    console.clear();
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:10px;right:10px;padding:15px;background:black;color:white;z-index:9999;border-radius:5px;font-family:sans-serif;font-size:14px;box-shadow:0 5px 15px rgba(0,0,0,0.5)';
    overlay.innerHTML = '<h3 style="margin:0;color:#f47521">📡 Vaulty Scanning...</h3><div id="cnt" style="font-size:18px;margin-top:5px">Initializing...</div>';
    document.body.append(overlay);

    const map = new Map();
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const findEp = (t) => {
        if (!t) return 0;
        const m = t.match(/(?:Ep\.|Episode|E)\s?(\d+)/i) || t.match(/^(\d+)\s?-/);
        return m ? parseInt(m[1]) : 0;
    };

    let noChange = 0;
    let lastH = 0;

    // Main Loop
    while (true) {
        // 1. SCAN VISIBLE
        document.querySelectorAll('a[href*="/watch/"]').forEach(l => {
            const c = l.closest('div');
            if (!c) return;
            c.style.border = "2px solid #f47521"; // Scanning

            let title = "";
            let seriesUrl = "";
            const sLink = c.querySelector('a[href*="/series/"]');
            if (sLink) {
                title = sLink.innerText.trim();
                seriesUrl = sLink.href;
            } else {
                const h = c.querySelector('h4, h3');
                if (h) {
                    title = h.innerText.trim();
                    const hLink = h.closest('a');
                    if (hLink) seriesUrl = hLink.href;
                }
            }

            let ep = 0;
            const w = document.createTreeWalker(c, 4, null, false);
            let n; while (n = w.nextNode()) {
                const e = findEp(n.nodeValue.trim());
                if (e > ep) ep = e;
            }

            if (title) {
                title = title.replace(/Season\s?\d+|S\d+/i, '').trim();
                const k = title.toUpperCase();
                const img = c.querySelector('img')?.src || "";

                c.style.border = "2px solid #00ff00"; // Found

                if (!map.has(k)) {
                    map.set(k, { title, currentEp: ep, status: 'Viendo', imgUrl: img, seriesUrl });
                }
                else if (ep > map.get(k).currentEp) {
                    map.get(k).currentEp = ep;
                }
            }
        });

        document.getElementById('cnt').innerText = `${map.size} Items Found`;

        // 2. SCROLL
        window.scrollBy(0, 600);
        await sleep(800);

        if ((window.scrollY + window.innerHeight) >= document.body.scrollHeight) {
            if (document.body.scrollHeight === lastH) {
                noChange++;
                if (noChange > 4) break;
            } else {
                noChange = 0;
                lastH = document.body.scrollHeight;
            }
        }
    }

    // DONE
    const items = Array.from(map.values());
    overlay.remove();

    const div = document.createElement('div');
    div.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;justify-content:center;align-items:center';

    const json = JSON.stringify(items, null, 2);

    div.innerHTML = `
    <div style="background:white;padding:25px;border-radius:15px;text-align:center;width:500px;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5)">
        <h2 style="color:#f47521;margin-top:0">✅ Scan Complete</h2>
        <p style="color:#555">Captured <b>${items.length}</b> unique series.</p>
        <textarea id="cp" style="width:100%;height:250px;border:1px solid #ddd;border-radius:5px;padding:10px;font-family:monospace;font-size:12px;margin-bottom:15px;">${json}</textarea>
        <div style="display:flex;gap:10px">
            <button id="btnCopy" style="flex:1;padding:12px;background:#f47521;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">COPY JSON</button>
            <button id="btnClose" style="flex:1;padding:12px;background:#e5e7eb;color:#374151;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">Close</button>
        </div>
    </div>`;

    document.body.append(div);

    document.getElementById('btnCopy').onclick = () => {
        const el = document.getElementById('cp');
        el.select();
        document.execCommand('copy');
        document.getElementById('btnCopy').innerText = "COPIED! ✅";
        setTimeout(() => document.getElementById('btnCopy').innerText = "COPY JSON", 2000);
    };

    document.getElementById('btnClose').onclick = () => div.remove();
}
