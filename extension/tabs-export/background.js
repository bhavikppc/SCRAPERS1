// background.js - Service worker for tabs export

import { formatAsMarkdown, formatAsJson, formatAsCsv, formatAsText } from './formatters.js';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'exportTabs') {
    handleExportTabs(message.format, message.options, message.copyToClipboard)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick_export') {
    // Quick export with default settings
    const settings = await chrome.storage.sync.get({
      includeContent: true,
      useReadability: false,
      convertToMarkdown: false,
      defaultScope: 'all',
      defaultFormat: 'markdown'
    });

    await handleExportTabs(settings.defaultFormat, {
      includeContent: settings.includeContent,
      useReadability: settings.useReadability,
      convertToMarkdown: settings.convertToMarkdown,
      scope: settings.defaultScope
    }, false);
  }
});

// Main export handler
async function handleExportTabs(format, options, copyToClipboard = false) {
  try {
    // Get tabs based on scope
    const tabs = await getTabsByScope(options.scope);

    if (tabs.length === 0) {
      return { success: false, error: 'No tabs found' };
    }

    // Collect tab data
    const tabsData = await collectTabsData(tabs, options);

    // Format data with options
    let content;
    const formatOptions = {
      maxContentLength: 0, // No truncation
      includeFullContent: true,
      maxPreviewLength: 500
    };

    switch (format) {
      case 'markdown':
        content = formatAsMarkdown(tabsData, formatOptions);
        break;
      case 'json':
        content = formatAsJson(tabsData);
        break;
      case 'csv':
        content = formatAsCsv(tabsData, formatOptions);
        break;
      case 'text':
        content = formatAsText(tabsData, formatOptions);
        break;
      default:
        throw new Error('Unknown format: ' + format);
    }

    // Either return content for clipboard or trigger download
    if (copyToClipboard) {
      return { success: true, content, tabCount: tabsData.length };
    } else {
      await downloadFile(content, format);
      return { success: true, tabCount: tabsData.length };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}

// Get tabs based on scope
async function getTabsByScope(scope) {
  switch (scope) {
    case 'all':
      return await chrome.tabs.query({});
    case 'current':
      // Get the last focused window (not the popup window!)
      const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
      const focusedWindow = windows.find(w => w.focused) || windows[0];
      return focusedWindow ? focusedWindow.tabs : [];
    case 'active':
      return await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    default:
      throw new Error('Unknown scope: ' + scope);
  }
}

// Collect data from all tabs
async function collectTabsData(tabs, options) {
  const tabsData = [];

  console.log('Collecting data from', tabs.length, 'tabs with options:', options);

  for (const tab of tabs) {
    const tabData = {
      url: tab.url,
      title: tab.title,
      domain: getDomain(tab.url),
      windowId: tab.windowId,
      index: tab.index,
      content: null
    };

    // Skip special URLs
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('file://')) {
      console.log('Skipping special URL:', tab.url);
      tabsData.push(tabData);
      continue;
    }

    // Get page content if requested
    if (options.includeContent) {
      try {
        console.log(`Extracting content from tab ${tab.id}: ${tab.title}`);
        const contentData = await getTabContent(tab.id, options);
        tabData.content = contentData;
        console.log(`✓ Content extracted from ${tab.title}:`, contentData?.text?.substring(0, 100));
      } catch (error) {
        console.error(`✗ Error getting content for tab ${tab.id}:`, error);
        tabData.content = { error: error.message };
      }
    } else {
      console.log('Skipping content extraction (includeContent is false)');
    }

    // Capture screenshot if requested
    if (options.captureScreenshot) {
      try {
        console.log(`Capturing screenshot from tab ${tab.id}: ${tab.title}`);
        const screenshotData = await captureFullPageScreenshot(tab.id);
        tabData.screenshot = screenshotData;
        console.log(`✓ Screenshot captured from ${tab.title}`);
      } catch (error) {
        console.error(`✗ Error capturing screenshot for tab ${tab.id}:`, error);
        tabData.screenshot = { error: error.message };
      }
    }

    tabsData.push(tabData);
  }

  return tabsData;
}

// Helper function to safely extract domain
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return 'unknown';
  }
}

// Get content from a specific tab
async function getTabContent(tabId, options) {
  try {
    // Check if tab exists and is ready
    const tab = await chrome.tabs.get(tabId);
    if (tab.status !== 'complete') {
      console.warn(`Tab ${tabId} not loaded yet, waiting...`);
      await waitForTabLoad(tabId);
    }

    // If converting to markdown, inject turndown library first
    if (options.convertToMarkdown) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/turndown.js']
      });
    }

    // If using readability, inject readability library
    if (options.useReadability) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/Readability.js']
      });
    }

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    // Small delay to ensure scripts are loaded
    await new Promise(resolve => setTimeout(resolve, 100));

    // Send message to content script to extract content
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'extractContent',
      options: options
    });

    return response;
  } catch (error) {
    console.error('Content extraction error details:', error);
    throw new Error(`Failed to extract content: ${error.message}`);
  }
}

// Wait for tab to finish loading
function waitForTabLoad(tabId, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Timeout waiting for tab to load'));
    }, timeout);

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Download file
async function downloadFile(content, format) {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Map format to proper file extension
  const extensionMap = {
    'markdown': 'md',
    'json': 'json',
    'csv': 'csv',
    'text': 'txt'
  };

  // Map format to proper MIME type
  const mimeTypeMap = {
    'markdown': 'text/markdown',
    'json': 'application/json',
    'csv': 'text/csv',
    'text': 'text/plain'
  };

  const extension = extensionMap[format] || format;
  const mimeType = mimeTypeMap[format] || 'text/plain';
  const filename = `tabs-export-${timestamp}.${extension}`;

  console.log(`Downloading file: ${filename} (${content.length} bytes, ${mimeType})`);

  // Create a data URL instead of blob URL (service workers don't support URL.createObjectURL)
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:${mimeType};charset=utf-8;base64,${base64Content}`;

  await chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: true
  });
}

// Capture full-page screenshot using Chrome DevTools Protocol
async function captureFullPageScreenshot(tabId) {
  let debuggeeId = { tabId: tabId };

  try {
    // Attach debugger to the tab
    await chrome.debugger.attach(debuggeeId, '1.3');

    // Get page metrics to determine full page size
    const metricsResult = await chrome.debugger.sendCommand(debuggeeId, 'Page.getLayoutMetrics');
    const { contentSize } = metricsResult;

    // Set device metrics to capture full page
    await chrome.debugger.sendCommand(debuggeeId, 'Emulation.setDeviceMetricsOverride', {
      width: Math.ceil(contentSize.width),
      height: Math.ceil(contentSize.height),
      deviceScaleFactor: 1,
      mobile: false
    });

    // Capture screenshot
    const screenshotResult = await chrome.debugger.sendCommand(debuggeeId, 'Page.captureScreenshot', {
      format: 'jpeg',
      quality: 90,
      captureBeyondViewport: true
    });

    // Get tab info for filename
    const tab = await chrome.tabs.get(tabId);
    const timestamp = new Date().toISOString().split('T')[0];
    const safeTitle = tab.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const filename = `screenshot-${safeTitle}-${timestamp}.jpg`;

    // Download the screenshot
    await chrome.downloads.download({
      url: `data:image/jpeg;base64,${screenshotResult.data}`,
      filename: filename,
      saveAs: false
    });

    return {
      success: true,
      filename: filename,
      width: contentSize.width,
      height: contentSize.height
    };
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw error;
  } finally {
    // Always detach debugger
    try {
      await chrome.debugger.detach(debuggeeId);
    } catch (e) {
      console.warn('Error detaching debugger:', e);
    }
  }
}
