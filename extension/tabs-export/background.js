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

    // Format data
    let content;
    switch (format) {
      case 'markdown':
        content = formatAsMarkdown(tabsData);
        break;
      case 'json':
        content = formatAsJson(tabsData);
        break;
      case 'csv':
        content = formatAsCsv(tabsData);
        break;
      case 'text':
        content = formatAsText(tabsData);
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
      const currentWindow = await chrome.windows.getCurrent();
      return await chrome.tabs.query({ windowId: currentWindow.id });
    case 'active':
      return await chrome.tabs.query({ active: true, currentWindow: true });
    default:
      throw new Error('Unknown scope: ' + scope);
  }
}

// Collect data from all tabs
async function collectTabsData(tabs, options) {
  const tabsData = [];

  for (const tab of tabs) {
    const tabData = {
      url: tab.url,
      title: tab.title,
      domain: new URL(tab.url).hostname,
      windowId: tab.windowId,
      index: tab.index,
      content: null
    };

    // Skip special URLs
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:')) {
      tabsData.push(tabData);
      continue;
    }

    // Get page content if requested
    if (options.includeContent) {
      try {
        const contentData = await getTabContent(tab.id, options);
        tabData.content = contentData;
      } catch (error) {
        console.error(`Error getting content for tab ${tab.id}:`, error);
        tabData.content = { error: error.message };
      }
    }

    tabsData.push(tabData);
  }

  return tabsData;
}

// Get content from a specific tab
async function getTabContent(tabId, options) {
  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    // If using readability, also inject readability library
    if (options.useReadability) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/Readability.js']
      });
    }

    // If converting to markdown, inject turndown library
    if (options.convertToMarkdown) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/turndown.js']
      });
    }

    // Send message to content script to extract content
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'extractContent',
      options: options
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to extract content: ${error.message}`);
  }
}

// Download file
async function downloadFile(content, format) {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `tabs-export-${timestamp}.${format === 'markdown' ? 'md' : format}`;

  const blob = new Blob([content], {
    type: format === 'json' ? 'application/json' : 'text/plain'
  });
  const url = URL.createObjectURL(blob);

  await chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });

  // Clean up the blob URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
