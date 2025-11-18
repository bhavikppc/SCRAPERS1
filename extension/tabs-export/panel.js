// panel.js - DevTools panel functionality

const convertSelectedBtn = document.getElementById('convertSelected');
const convertBodyBtn = document.getElementById('convertBody');
const copyMarkdownBtn = document.getElementById('copyMarkdown');
const downloadMarkdownBtn = document.getElementById('downloadMarkdown');
const markdownOutput = document.getElementById('markdownOutput');
const statusDiv = document.getElementById('status');

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

// Convert selected element to markdown
async function convertSelected() {
  showStatus('Converting selected element...', 'info', 0);

  try {
    // Execute code in the inspected page to get the selected element's HTML
    const result = await new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(function() {
          if (typeof TurndownService === 'undefined') {
            return { error: 'TurndownService not available. Please refresh the page.' };
          }

          const selectedElement = $0; // $0 is the currently selected element in DevTools
          if (!selectedElement) {
            return { error: 'No element selected. Please select an element in the Elements panel.' };
          }

          const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-'
          });

          const markdown = turndownService.turndown(selectedElement.outerHTML);
          return { success: true, markdown: markdown };
        })()`,
        (result, isException) => {
          if (isException) {
            reject(new Error('Failed to execute in inspected window'));
          } else {
            resolve(result);
          }
        }
      );
    });

    if (result.error) {
      showStatus(result.error, 'error', 5000);
      return;
    }

    markdownOutput.value = result.markdown;
    showStatus('✓ Converted successfully', 'success');
  } catch (error) {
    console.error('Conversion error:', error);
    showStatus(`✗ Error: ${error.message}`, 'error', 5000);
  }
}

// Convert entire body to markdown
async function convertBody() {
  showStatus('Converting entire page...', 'info', 0);

  try {
    // First inject TurndownService if not already present
    await injectTurndownService();

    // Execute code in the inspected page
    const result = await new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        `(function() {
          if (typeof TurndownService === 'undefined') {
            return { error: 'TurndownService not available. Please try again.' };
          }

          const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-'
          });

          // Get main content or body
          const mainContent = document.querySelector('main') ||
                             document.querySelector('article') ||
                             document.querySelector('[role="main"]') ||
                             document.body;

          const markdown = turndownService.turndown(mainContent);
          return { success: true, markdown: markdown };
        })()`,
        (result, isException) => {
          if (isException) {
            reject(new Error('Failed to execute in inspected window'));
          } else {
            resolve(result);
          }
        }
      );
    });

    if (result.error) {
      showStatus(result.error, 'error', 5000);
      return;
    }

    markdownOutput.value = result.markdown;
    showStatus('✓ Converted successfully', 'success');
  } catch (error) {
    console.error('Conversion error:', error);
    showStatus(`✗ Error: ${error.message}`, 'error', 5000);
  }
}

// Inject TurndownService into the inspected page
async function injectTurndownService() {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `typeof TurndownService !== 'undefined'`,
      (result, isException) => {
        if (result) {
          resolve(); // Already loaded
        } else {
          // Need to inject it
          chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            files: ['lib/turndown.js']
          }).then(() => resolve()).catch(reject);
        }
      }
    );
  });
}

// Copy markdown to clipboard
async function copyMarkdown() {
  const markdown = markdownOutput.value;

  if (!markdown) {
    showStatus('Nothing to copy', 'error', 3000);
    return;
  }

  try {
    await navigator.clipboard.writeText(markdown);
    showStatus('✓ Copied to clipboard', 'success');
  } catch (error) {
    console.error('Copy error:', error);
    showStatus(`✗ Failed to copy: ${error.message}`, 'error', 5000);
  }
}

// Download markdown as file
function downloadMarkdown() {
  const markdown = markdownOutput.value;

  if (!markdown) {
    showStatus('Nothing to download', 'error', 3000);
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `element-export-${timestamp}.md`;

  const blob = new Blob([markdown], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  showStatus('✓ Download started', 'success');
}

// Event listeners
convertSelectedBtn.addEventListener('click', convertSelected);
convertBodyBtn.addEventListener('click', convertBody);
copyMarkdownBtn.addEventListener('click', copyMarkdown);
downloadMarkdownBtn.addEventListener('click', downloadMarkdown);

// Auto-inject TurndownService when panel loads
injectTurndownService().catch(console.error);
