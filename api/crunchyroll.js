
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

// Helper to launch browser with evasion techniques
async function getBrowser() {
    const isLocal = process.env.VERCEL_ENV === 'development' || !process.env.VERCEL_ENV;

    if (isLocal) {
        console.log("Launching local puppeteer...");
        const puppeteerLocal = await import('puppeteer');
        return puppeteerLocal.default.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ]
        });
    } else {
        console.log("Launching serverless chromium...");
        return puppeteerCore.launch({
            args: [
                ...chromium.args,
                '--disable-blink-features=AutomationControlled',
                '--hide-scrollbars',
                '--disable-web-security'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
    }
}

export default async function handler(req, res) {
    const { q, url } = req.query;

    if (!q && !url) {
        return res.status(400).json({ error: 'Missing query (q) or url parameter' });
    }

    let browser = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        // Evasion: Common User Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        // Evasion: Language/Headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/'
        });

        // Evasion: Navigator properties
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        await page.setViewport({ width: 1920, height: 1080 });

        if (q) {
            // Search Mode
            const searchUrl = `https://www.crunchyroll.com/search?q=${encodeURIComponent(q)}`;
            console.log(`Navigating to ${searchUrl}`);

            // Go to home first, then search? Or direct? Direct is faster but riskier.
            // Let's try direct but with a good timeout.
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });

            // Handle potential "Terms" modal or similar overlays
            // We'll try to click "CONTINUE" if it exists
            try {
                const continueBtns = await page.$x("//button[contains(., 'CONTINUE')]");
                if (continueBtns.length > 0) {
                    await continueBtns[0].click();
                    await page.waitForNetworkIdle();
                }
            } catch (e) { /* ignore */ }

            // Wait for results
            try {
                // Wait for either browse-card or checking if we are blocked
                await page.waitForSelector('[class*="browse-card"]', { timeout: 15000 });
            } catch (e) {
                console.log("Timeout waiting for selector, checking for block...");
                const title = await page.title();
                if (title.includes("Just a moment") || title.includes("Cloudflare")) {
                    throw new Error("Blocked by Cloudflare");
                }
            }

            const results = await page.evaluate(() => {
                // Generic selectors to be robust against class name changes
                const cards = document.querySelectorAll('[class*="browse-card"]');
                return Array.from(cards).slice(0, 10).map(card => {
                    const titleEl = card.querySelector('h4') || card.querySelector('[class*="text--truncate"]');
                    const imgEl = card.querySelector('img');
                    const linkEl = card.querySelector('a');

                    return {
                        title: titleEl ? titleEl.innerText : 'Unknown',
                        image: imgEl ? imgEl.src : null,
                        url: linkEl ? linkEl.href : null,
                        type: 'Series'
                    };
                });
            });

            return res.status(200).json({ results });

        } else if (url) {
            // Details Mode
            console.log(`Navigating to ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

            // Handle potential "Terms" modal
            try {
                const continueBtns = await page.$x("//button[contains(., 'CONTINUE')]");
                if (continueBtns.length > 0) {
                    await continueBtns[0].click();
                    await page.waitForNetworkIdle();
                }
            } catch (e) { /* ignore */ }

            const details = await page.evaluate(() => {
                const title = document.querySelector('h1')?.innerText;
                const description = document.querySelector('[class*="expandable-section__text"]')?.innerText
                    || document.querySelector('[class*="description"]')?.innerText
                    || document.querySelector('meta[name="description"]')?.content;

                const rating = document.querySelector('[class*="star-rating"]')?.innerText; // often hard to get

                const img = document.querySelector('img.poster')?.src
                    || document.querySelector('img[class*="hero"]')?.src;

                return {
                    title,
                    description,
                    rating: rating || 'N/A',
                    image: img,
                    url: window.location.href
                };
            });

            if (!details.title) {
                // If we didn't get a title, check if we were redirected to home or blocked
                const currentTitle = document.title;
                if (currentTitle.includes("Crunchyroll")) { // Generic title
                    // Potential soft block or redirect
                }
            }

            return res.status(200).json({ details });
        }

    } catch (error) {
        console.error('Scraping error:', error);
        return res.status(500).json({ error: 'Failed to scrape data', details: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
