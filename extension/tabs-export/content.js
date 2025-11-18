// content.js - Extracts content from the page

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractContent') {
    extractContent(message.options)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Extract content based on options
async function extractContent(options) {
  try {
    let content;
    let html = null;

    if (options.useReadability && typeof Readability !== 'undefined') {
      // Use Readability.js for cleaned content
      const documentClone = document.cloneNode(true);
      const reader = new Readability(documentClone);
      const article = reader.parse();

      if (article) {
        content = article.textContent;
        html = article.content;

        // If markdown conversion is requested
        if (options.convertToMarkdown && html && typeof TurndownService !== 'undefined') {
          const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-'
          });

          content = turndownService.turndown(html);
        }

        return {
          text: content,
          title: article.title || document.title,
          excerpt: article.excerpt,
          byline: article.byline,
          length: article.length,
          siteName: article.siteName
        };
      }
    }

    // Fallback: use simple text extraction
    if (options.convertToMarkdown && typeof TurndownService !== 'undefined') {
      // Convert entire page to markdown
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

      content = turndownService.turndown(mainContent);
    } else {
      // Use innerText
      content = document.body.innerText;
    }

    return {
      text: content,
      title: document.title,
      length: content.length
    };
  } catch (error) {
    console.error('Content extraction error:', error);
    throw error;
  }
}

// Helper function to clean text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
}
