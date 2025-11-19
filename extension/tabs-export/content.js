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

    // Extract all links from the page
    const links = extractAllLinks();

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
          siteName: article.siteName,
          links: links
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
      length: content.length,
      links: links
    };
  } catch (error) {
    console.error('Content extraction error:', error);
    throw error;
  }
}

// Extract all links from the page
function extractAllLinks() {
  const links = [];
  const anchorElements = document.querySelectorAll('a[href]');
  const baseUrl = window.location.origin;

  anchorElements.forEach((anchor) => {
    try {
      let href = anchor.getAttribute('href');
      if (!href) return;

      // Skip certain types of links
      if (href.startsWith('javascript:') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href === '#') {
        return;
      }

      // Convert relative URLs to absolute
      let absoluteUrl;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        absoluteUrl = href;
      } else if (href.startsWith('//')) {
        absoluteUrl = window.location.protocol + href;
      } else if (href.startsWith('/')) {
        absoluteUrl = baseUrl + href;
      } else if (href.startsWith('#')) {
        absoluteUrl = window.location.href.split('#')[0] + href;
      } else {
        // Relative path
        const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        absoluteUrl = baseUrl + currentPath + href;
      }

      // Get link text
      const linkText = anchor.textContent.trim() || anchor.title || '';

      // Add to links array (avoid duplicates)
      const linkObj = {
        url: absoluteUrl,
        text: linkText.substring(0, 200) // Limit text length
      };

      // Check if this exact URL already exists
      if (!links.some(l => l.url === absoluteUrl)) {
        links.push(linkObj);
      }
    } catch (error) {
      console.warn('Error processing link:', error);
    }
  });

  console.log(`Extracted ${links.length} links from page`);
  return links;
}

// Helper function to clean text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
}
