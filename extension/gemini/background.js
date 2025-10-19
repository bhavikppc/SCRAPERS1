// background.js

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startSequence' && Array.isArray(msg.messages) && msg.messages.length) {
    (async () => {
      try {
        const tab = await getOrOpenGeminiTab();
        // Ensure content script is present and ready, then forward messages
        await ensureContentScript(tab.id);
        await sendSequenceToTab(tab.id, msg.messages);
        sendResponse({ ok: true });
      } catch (err) {
        console.error('Failed to start sequence:', err);
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    // Keep channel open for async response
    return true;
  }
});

async function sendSequenceToTab(tabId, messages) {
  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Attempt to send message to content script
      return await chrome.tabs.sendMessage(tabId, { action: 'runSequence', messages });
    } catch (err) {
      console.warn(`sendMessage attempt ${attempt + 1} failed:`, err);
      // Try injecting the content script (safe even if already present)
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['contentScript.js']
        });
        console.info('Injected contentScript.js into tab', tabId);
      } catch (injectErr) {
        console.warn('Injection attempt failed:', injectErr);
      }
      // Backoff before retrying
      await delay(500 * (attempt + 1));
    }
  }
  throw new Error('Could not deliver message to content script (no receiver).');
}

async function ensureContentScript(tabId) {
  try {
    // Try a lightweight injection which will no-op if already present
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    return;
  } catch (e) {
    console.warn('scripting.executeScript failed, will wait for tab to finish loading:', e);
  }

  // Fallback: wait for the tab to reach 'complete' status
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('Timed out waiting for tab to finish loading'));
    }, 15000);

    function onUpdated(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

async function getOrOpenGeminiTab() {
  const queryUrls = ['https://gemini.google.com/*', 'https://chat.google.com/*'];
  const tabs = await chrome.tabs.query({ url: queryUrls });
  if (tabs && tabs.length) {
    const existing = tabs[0];
    await chrome.tabs.update(existing.id, { active: true });
    // Wait for the tab to finish loading (if it isn't already)
    if (existing.status !== 'complete') {
      await new Promise((resolve) => {
        function onUpdated(tabId, info) {
          if (tabId === existing.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(onUpdated);
            resolve();
          }
        }
        chrome.tabs.onUpdated.addListener(onUpdated);
      });
    }
    return existing;
  }

  // Open primary Gemini app and wait until it's ready
  return new Promise((resolve) => {
    chrome.tabs.create({ url: 'https://gemini.google.com/app', active: true }, (tab) => {
      // Wait for the new tab to complete loading
      function onUpdated(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          resolve(tab);
        }
      }
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  });
}