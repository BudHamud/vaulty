document.getElementById('scanBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Flexible check for regional URLs (e.g. /es-es/history)
    if (tab.url.includes("crunchyroll.com") && tab.url.includes("/history")) {
        // Send message to content script to start
        chrome.tabs.sendMessage(tab.id, { action: "start_scan" });
        window.close();
    } else {
        alert("Please go to https://www.crunchyroll.com/history first!");
    }
});
