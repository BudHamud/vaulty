document.getElementById('scanBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url || '';
    const isHistory    = url.includes('amazon.') && url.includes('/video/history');
    const isPrimeVideo = url.includes('primevideo.com');

    if (isHistory || isPrimeVideo) {
        chrome.tabs.sendMessage(tab.id, { action: 'start_scan' });
        window.close();
    } else {
        alert('Please go to your Prime Video Watch History page first.\n\namazon.com/gp/video/history');
    }
});
