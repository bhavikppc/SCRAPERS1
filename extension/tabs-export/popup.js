// popup.js - Handles UI interactions

// Get all UI elements
const includeContentCheckbox = document.getElementById('includeContent');
const useReadabilityCheckbox = document.getElementById('useReadability');
const convertToMarkdownCheckbox = document.getElementById('convertToMarkdown');
const scopeRadios = document.querySelectorAll('input[name="scope"]');
const exportMarkdownBtn = document.getElementById('exportMarkdown');
const exportJsonBtn = document.getElementById('exportJson');
const exportCsvBtn = document.getElementById('exportCsv');
const exportTextBtn = document.getElementById('exportText');
const copyToClipboardBtn = document.getElementById('copyToClipboard');
const statusDiv = document.getElementById('status');
const openSettingsLink = document.getElementById('openSettings');

// Load saved settings
chrome.storage.sync.get({
  includeContent: true,
  useReadability: false,
  convertToMarkdown: false,
  defaultScope: 'all',
  defaultFormat: 'markdown'
}, (items) => {
  includeContentCheckbox.checked = items.includeContent;
  useReadabilityCheckbox.checked = items.useReadability;
  convertToMarkdownCheckbox.checked = items.convertToMarkdown;

  scopeRadios.forEach(radio => {
    if (radio.value === items.defaultScope) {
      radio.checked = true;
    }
  });
});

// Get current options
function getOptions() {
  const scope = Array.from(scopeRadios).find(r => r.checked).value;

  return {
    includeContent: includeContentCheckbox.checked,
    useReadability: useReadabilityCheckbox.checked,
    convertToMarkdown: convertToMarkdownCheckbox.checked,
    scope: scope
  };
}

// Show status message
function showStatus(message, type = 'info', duration = 3000) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  if (duration > 0) {
    setTimeout(() => {
      statusDiv.className = 'status hidden';
    }, duration);
  }
}

// Export with specified format
async function exportTabs(format) {
  const options = getOptions();
  showStatus('Collecting tabs...', 'info', 0);

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'exportTabs',
      format: format,
      options: options
    });

    if (response.success) {
      showStatus(`✓ Exported ${response.tabCount} tabs to ${format.toUpperCase()}`, 'success');
    } else {
      showStatus(`✗ Export failed: ${response.error}`, 'error', 5000);
    }
  } catch (error) {
    console.error('Export error:', error);
    showStatus(`✗ Error: ${error.message}`, 'error', 5000);
  }
}

// Copy to clipboard
async function copyToClipboard() {
  const options = getOptions();
  showStatus('Collecting tabs...', 'info', 0);

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'exportTabs',
      format: 'markdown',
      options: options,
      copyToClipboard: true
    });

    if (response.success) {
      // Copy to clipboard
      await navigator.clipboard.writeText(response.content);
      showStatus(`✓ Copied ${response.tabCount} tabs to clipboard`, 'success');
    } else {
      showStatus(`✗ Copy failed: ${response.error}`, 'error', 5000);
    }
  } catch (error) {
    console.error('Copy error:', error);
    showStatus(`✗ Error: ${error.message}`, 'error', 5000);
  }
}

// Event listeners
exportMarkdownBtn.addEventListener('click', () => exportTabs('markdown'));
exportJsonBtn.addEventListener('click', () => exportTabs('json'));
exportCsvBtn.addEventListener('click', () => exportTabs('csv'));
exportTextBtn.addEventListener('click', () => exportTabs('text'));
copyToClipboardBtn.addEventListener('click', copyToClipboard);

// Save settings on change
includeContentCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({ includeContent: includeContentCheckbox.checked });
});

useReadabilityCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({ useReadability: useReadabilityCheckbox.checked });
});

convertToMarkdownCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({ convertToMarkdown: convertToMarkdownCheckbox.checked });
});

scopeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    chrome.storage.sync.set({ defaultScope: radio.value });
  });
});

// Open settings page
openSettingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
