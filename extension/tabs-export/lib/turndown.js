/**
 * Simple HTML to Markdown converter
 * Lightweight alternative to TurndownService
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TurndownService = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function TurndownService(options) {
    this.options = options || {};
    this.rules = this.options.rules || [];
  }

  TurndownService.prototype.turndown = function (htmlOrNode) {
    let element;

    if (typeof htmlOrNode === 'string') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlOrNode, 'text/html');
      element = doc.body;
    } else {
      element = htmlOrNode;
    }

    return this.convert(element).trim();
  };

  TurndownService.prototype.convert = function (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();
    let markdown = '';

    // Skip certain elements
    if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
      return '';
    }

    // Convert children
    const children = Array.from(node.childNodes)
      .map(child => this.convert(child))
      .join('');

    // Convert based on tag
    switch (tagName) {
      case 'h1':
        markdown = `# ${children}\n\n`;
        break;
      case 'h2':
        markdown = `## ${children}\n\n`;
        break;
      case 'h3':
        markdown = `### ${children}\n\n`;
        break;
      case 'h4':
        markdown = `#### ${children}\n\n`;
        break;
      case 'h5':
        markdown = `##### ${children}\n\n`;
        break;
      case 'h6':
        markdown = `###### ${children}\n\n`;
        break;
      case 'p':
        markdown = `${children}\n\n`;
        break;
      case 'br':
        markdown = '\n';
        break;
      case 'hr':
        markdown = '\n---\n\n';
        break;
      case 'strong':
      case 'b':
        markdown = `**${children}**`;
        break;
      case 'em':
      case 'i':
        markdown = `*${children}*`;
        break;
      case 'code':
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
          markdown = children;
        } else {
          markdown = `\`${children}\``;
        }
        break;
      case 'pre':
        markdown = `\n\`\`\`\n${children}\n\`\`\`\n\n`;
        break;
      case 'a':
        const href = node.getAttribute('href') || '';
        markdown = `[${children}](${href})`;
        break;
      case 'img':
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        markdown = `![${alt}](${src})`;
        break;
      case 'ul':
      case 'ol':
        markdown = `${children}\n`;
        break;
      case 'li':
        const listType = node.parentElement.tagName.toLowerCase();
        const bullet = listType === 'ul' ? '-' : '1.';
        markdown = `${bullet} ${children}\n`;
        break;
      case 'blockquote':
        const lines = children.split('\n').filter(line => line.trim());
        markdown = lines.map(line => `> ${line}`).join('\n') + '\n\n';
        break;
      case 'table':
        markdown = this.convertTable(node);
        break;
      case 'div':
      case 'span':
      case 'article':
      case 'section':
      case 'main':
      case 'header':
      case 'footer':
      case 'nav':
        markdown = children;
        break;
      default:
        markdown = children;
    }

    return markdown;
  };

  TurndownService.prototype.convertTable = function (table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let markdown = '\n';

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const cellContents = cells.map(cell => this.convert(cell).trim());

      markdown += '| ' + cellContents.join(' | ') + ' |\n';

      // Add header separator after first row if it contains th elements
      if (rowIndex === 0 && row.querySelector('th')) {
        markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      }
    });

    markdown += '\n';
    return markdown;
  };

  return TurndownService;
}));
