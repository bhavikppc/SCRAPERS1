// formatters.js - Format tabs data into different output formats

// Format as Markdown
export function formatAsMarkdown(tabsData) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  let markdown = `# Tabs Export\n\n**Exported:** ${timestamp}\n`;
  markdown += `**Total Tabs:** ${tabsData.length}\n\n`;
  markdown += `---\n\n`;

  // Group by window
  const tabsByWindow = groupByWindow(tabsData);

  for (const [windowId, tabs] of Object.entries(tabsByWindow)) {
    markdown += `## Window ${windowId}\n\n`;

    tabs.forEach((tab, index) => {
      markdown += `### ${index + 1}. ${escapeMarkdown(tab.title)}\n\n`;
      markdown += `- **URL:** ${tab.url}\n`;
      markdown += `- **Domain:** ${tab.domain}\n`;

      if (tab.content && !tab.content.error) {
        markdown += `\n#### Content\n\n`;

        if (tab.content.byline) {
          markdown += `**By:** ${tab.content.byline}\n\n`;
        }

        if (tab.content.excerpt) {
          markdown += `**Excerpt:** ${tab.content.excerpt}\n\n`;
        }

        if (tab.content.text) {
          // Limit content length if too long
          let contentText = tab.content.text;
          if (contentText.length > 5000) {
            contentText = contentText.substring(0, 5000) + '\n\n_[Content truncated...]_';
          }
          markdown += `${contentText}\n`;
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
export function formatAsCsv(tabsData) {
  const headers = ['Window', 'Index', 'Title', 'URL', 'Domain', 'Content Preview', 'Has Content'];
  let csv = headers.join(',') + '\n';

  tabsData.forEach(tab => {
    const contentPreview = tab.content && tab.content.text
      ? escapeCsv(tab.content.text.substring(0, 200).replace(/\n/g, ' '))
      : '';

    const hasContent = tab.content && tab.content.text ? 'Yes' : 'No';

    const row = [
      tab.windowId,
      tab.index,
      escapeCsv(tab.title),
      escapeCsv(tab.url),
      escapeCsv(tab.domain),
      contentPreview,
      hasContent
    ];

    csv += row.join(',') + '\n';
  });

  return csv;
}

// Format as plain text
export function formatAsText(tabsData) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  let text = `TABS EXPORT\n`;
  text += `${'='.repeat(60)}\n`;
  text += `Exported: ${timestamp}\n`;
  text += `Total Tabs: ${tabsData.length}\n`;
  text += `${'='.repeat(60)}\n\n`;

  // Group by window
  const tabsByWindow = groupByWindow(tabsData);

  for (const [windowId, tabs] of Object.entries(tabsByWindow)) {
    text += `WINDOW ${windowId}\n`;
    text += `${'-'.repeat(60)}\n\n`;

    tabs.forEach((tab, index) => {
      text += `[${index + 1}] ${tab.title}\n`;
      text += `URL: ${tab.url}\n`;
      text += `Domain: ${tab.domain}\n`;

      if (tab.content && !tab.content.error) {
        text += `\nCONTENT:\n`;
        text += `${'-'.repeat(40)}\n`;

        if (tab.content.text) {
          // Limit content length if too long
          let contentText = tab.content.text;
          if (contentText.length > 3000) {
            contentText = contentText.substring(0, 3000) + '\n\n[Content truncated...]';
          }
          text += `${contentText}\n`;
        }

        text += `${'-'.repeat(40)}\n`;
      } else if (tab.content && tab.content.error) {
        text += `\n[Content extraction failed: ${tab.content.error}]\n`;
      }

      text += `\n${'='.repeat(60)}\n\n`;
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
