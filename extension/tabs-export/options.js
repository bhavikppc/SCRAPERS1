// options.js - Settings page logic

const includeContentCheckbox = document.getElementById('includeContent');
const useReadabilityCheckbox = document.getElementById('useReadability');
const convertToMarkdownCheckbox = document.getElementById('convertToMarkdown');
const scopeRadios = document.querySelectorAll('input[name="scope"]');
const defaultFormatSelect = document.getElementById('defaultFormat');
const saveButton = document.getElementById('saveSettings');
const statusDiv = document.getElementById('status');

// Load saved settings
function loadSettings() {
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
    defaultFormatSelect.value = items.defaultFormat;

    scopeRadios.forEach(radio => {
      if (radio.value === items.defaultScope) {
        radio.checked = true;
      }
    });
  });
}

// Save settings
function saveSettings() {
  const selectedScope = Array.from(scopeRadios).find(r => r.checked).value;

  chrome.storage.sync.set({
    includeContent: includeContentCheckbox.checked,
    useReadability: useReadabilityCheckbox.checked,
    convertToMarkdown: convertToMarkdownCheckbox.checked,
    defaultScope: selectedScope,
    defaultFormat: defaultFormatSelect.value
  }, () => {
    // Show success message
    statusDiv.textContent = '✓ Settings saved successfully';
    statusDiv.className = 'status success';

    setTimeout(() => {
      statusDiv.className = 'status hidden';
    }, 3000);
  });
}

// Event listeners
saveButton.addEventListener('click', saveSettings);

// Auto-save on change (optional)
const autoSaveElements = [
  includeContentCheckbox,
  useReadabilityCheckbox,
  convertToMarkdownCheckbox,
  defaultFormatSelect,
  ...scopeRadios
];

autoSaveElements.forEach(element => {
  element.addEventListener('change', () => {
    // Visual feedback that auto-save is happening
    statusDiv.textContent = 'Auto-saving...';
    statusDiv.className = 'status success';

    setTimeout(saveSettings, 300);
  });
});

// Load settings on page load
loadSettings();
