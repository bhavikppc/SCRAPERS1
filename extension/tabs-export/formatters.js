// formatters.js - Format tabs data into different output formats

// Format as Markdown
export function formatAsMarkdown(tabsData, options = {}) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const maxContentLength = options.maxContentLength || 0; // 0 = no limit

  let markdown = `# Tabs Export\n\n**Exported:** ${timestamp}\n`;
  markdown += `**Total Tabs:** ${tabsData.length}\n\n`;
  markdown += `---\n\n`;

  // Group by window
  const tabsByWindow = groupByWindow(tabsData);

  for (const [windowId, tabs] of Object.entries(tabsByWindow)) {
    markdown += `## Window ${windowId}\n\n`;

    tabs.forEach((tab, index) => {
      markdown += `### ${index + 1}. ${escapeMarkdown(tab.title)}\n\n`;
      markdown += `**URL:** <${tab.url}>\n\n`;
      markdown += `**Domain:** ${tab.domain}\n\n`;

      if (tab.content && !tab.content.error) {
        markdown += `#### Content\n\n`;

        if (tab.content.byline) {
          markdown += `**By:** ${tab.content.byline}\n\n`;
        }

        if (tab.content.excerpt) {
          markdown += `**Excerpt:** ${tab.content.excerpt}\n\n`;
        }

        if (tab.content.text) {
          let contentText = tab.content.text;

          // Only truncate if maxContentLength is set and content exceeds it
          if (maxContentLength > 0 && contentText.length > maxContentLength) {
            contentText = contentText.substring(0, maxContentLength) + '\n\n_[Content truncated - original length: ' + contentText.length + ' characters]_';
          }

          markdown += `${contentText}\n`;
        }

        // Add extracted links
        if (tab.content.links && tab.content.links.length > 0) {
          markdown += `\n#### Links Found on Page (${tab.content.links.length})\n\n`;
          tab.content.links.forEach((link, idx) => {
            if (link.text) {
              markdown += `${idx + 1}. [${escapeMarkdown(link.text)}](${link.url})\n`;
            } else {
              markdown += `${idx + 1}. <${link.url}>\n`;
            }
          });
          markdown += `\n`;
        }
      } else if (tab.content && tab.content.error) {
        markdown += `\n_Content extraction failed: ${tab.content.error}_\n`;
      }

      markdown += `\n---\n\n`;
    });
  }

  return markdown;
}

// Format as JSON
export function formatAsJson(tabsData) {
  const exportData = {
    timestamp: new Date().toISOString(),
    totalTabs: tabsData.length,
    tabs: tabsData.map(tab => ({
      url: tab.url,
      title: tab.title,
      domain: tab.domain,
      windowId: tab.windowId,
      index: tab.index,
      content: tab.content
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

// Format as CSV
export function formatAsCsv(tabsData, options = {}) {
  const includeFullContent = options.includeFullContent !== false; // default true
  const maxPreviewLength = options.maxPreviewLength || 500;

  const headers = includeFullContent
    ? ['Window', 'Index', 'Title', 'URL', 'Domain', 'Full Content', 'Content Length', 'Links Count', 'All Links']
    : ['Window', 'Index', 'Title', 'URL', 'Domain', 'Content Preview', 'Has Content', 'Links Count', 'All Links'];

  let csv = headers.join(',') + '\n';

  tabsData.forEach(tab => {
    let contentField, contentInfo;

    if (includeFullContent) {
      // Include full content in CSV
      contentField = tab.content && tab.content.text
        ? escapeCsv(tab.content.text)
        : '';
      contentInfo = tab.content && tab.content.text ? tab.content.text.length : 0;
    } else {
      // Include preview only
      contentField = tab.content && tab.content.text
        ? escapeCsv(tab.content.text.substring(0, maxPreviewLength).replace(/\n/g, ' '))
        : '';
      contentInfo = tab.content && tab.content.text ? 'Yes' : 'No';
    }

    // Format links for CSV
    const linksCount = tab.content && tab.content.links ? tab.content.links.length : 0;
    let allLinks = '';
    if (tab.content && tab.content.links && tab.content.links.length > 0) {
      // Create a list of links separated by semicolons
      allLinks = tab.content.links.map(link => {
        if (link.text) {
          return `${link.text} (${link.url})`;
        }
        return link.url;
      }).join('; ');
    }

    const row = [
      tab.windowId,
      tab.index,
      escapeCsv(tab.title),
      escapeCsv(tab.url),
      escapeCsv(tab.domain),
      contentField,
      contentInfo,
      linksCount,
      escapeCsv(allLinks)
    ];

    csv += row.join(',') + '\n';
  });

  return csv;
}

// Format as plain text
export function formatAsText(tabsData, options = {}) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const maxContentLength = options.maxContentLength || 0; // 0 = no limit

  let text = `TABS EXPORT\n`;
  text += `${'='.repeat(80)}\n`;
  text += `Exported: ${timestamp}\n`;
  text += `Total Tabs: ${tabsData.length}\n`;
  text += `${'='.repeat(80)}\n\n`;

  // Group by window
  const tabsByWindow = groupByWindow(tabsData);

  for (const [windowId, tabs] of Object.entries(tabsByWindow)) {
    text += `WINDOW ${windowId}\n`;
    text += `${'-'.repeat(80)}\n\n`;

    tabs.forEach((tab, index) => {
      text += `[${index + 1}] ${tab.title}\n`;
      text += `URL: ${tab.url}\n`;
      text += `Domain: ${tab.domain}\n`;

      if (tab.content && !tab.content.error) {
        text += `\nCONTENT:\n`;
        text += `${'-'.repeat(80)}\n`;

        if (tab.content.text) {
          let contentText = tab.content.text;

          // Only truncate if maxContentLength is set and content exceeds it
          if (maxContentLength > 0 && contentText.length > maxContentLength) {
            contentText = contentText.substring(0, maxContentLength) + '\n\n[Content truncated - original length: ' + contentText.length + ' characters]';
          }

          text += `${contentText}\n`;
        }

        text += `${'-'.repeat(80)}\n`;

        // Add extracted links
        if (tab.content.links && tab.content.links.length > 0) {
          text += `\nLINKS FOUND ON PAGE (${tab.content.links.length}):\n`;
          text += `${'-'.repeat(80)}\n`;
          tab.content.links.forEach((link, idx) => {
            if (link.text) {
              text += `${idx + 1}. ${link.text}\n   ${link.url}\n`;
            } else {
              text += `${idx + 1}. ${link.url}\n`;
            }
          });
          text += `${'-'.repeat(80)}\n`;
        }
      } else if (tab.content && tab.content.error) {
        text += `\n[Content extraction failed: ${tab.content.error}]\n`;
      }

      text += `\n${'='.repeat(80)}\n\n`;
    });
  }

  return text;
}

// Helper: Group tabs by window
function groupByWindow(tabsData) {
  const grouped = {};

  tabsData.forEach(tab => {
    if (!grouped[tab.windowId]) {
      grouped[tab.windowId] = [];
    }
    grouped[tab.windowId].push(tab);
  });

  // Sort tabs within each window by index
  for (const windowId in grouped) {
    grouped[windowId].sort((a, b) => a.index - b.index);
  }

  return grouped;
}

// Helper: Escape markdown special characters
function escapeMarkdown(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

// Helper: Escape CSV special characters
function escapeCsv(text) {
  if (!text) return '';

  // If text contains comma, quote, or newline, wrap in quotes and escape quotes
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}
