# Tabs Export Chrome Extension

A powerful Chrome extension that exports all open tabs with their content to multiple formats (CSV, Markdown, JSON, Text). Includes a DevTools panel for converting selected HTML elements to Markdown.

## Features

### Core Features
- **Export all open tabs** across all Chrome windows or just the current window
- **Multiple export formats**: Markdown, JSON, CSV, and Plain Text
- **Content extraction options**:
  - Full page `innerText`
  - Cleaned readable content using Readability.js
  - HTML to Markdown conversion
- **Local processing only** - no external servers, complete privacy
- **Copy to clipboard** for quick sharing
- **Keyboard shortcuts** for fast access

### Export Formats

#### Markdown (.md)
Organized by window with formatted content, headings, and metadata. Perfect for documentation and note-taking.

#### JSON (.json)
Structured data with complete tab information including URLs, titles, domains, and content. Great for automation and data processing.

#### CSV (.csv)
Spreadsheet-friendly format with columns for window, index, title, URL, domain, and content preview. Ideal for analysis in Excel or Google Sheets.

#### Plain Text (.txt)
Simple text format with clear sections. Easy to read and share.

### DevTools Panel
- **Select any element** in the Elements panel and convert it to Markdown
- **Convert entire page** body to Markdown
- **Copy or download** the converted Markdown
- Perfect for extracting specific content from web pages

## Installation

### Load as Unpacked Extension

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `extension/tabs-export` directory
6. The extension icon should appear in your toolbar

## Usage

### Export Tabs via Popup

1. Click the extension icon in the toolbar
2. Choose your export options:
   - **Include page content**: Extract text content from tabs
   - **Use cleaned content**: Apply Readability.js for better content extraction
   - **Convert HTML to Markdown**: Convert page HTML to Markdown format
3. Select scope:
   - **All windows**: Export all tabs from all Chrome windows
   - **Current window only**: Export tabs from the active window
   - **Active tab only**: Export only the currently active tab
4. Click a format button to export:
   - **Markdown** - Rich formatted export
   - **JSON** - Structured data export
   - **CSV** - Spreadsheet export
   - **Text** - Plain text export
5. Or click **Copy to Clipboard** to copy as Markdown

### Keyboard Shortcuts

- **Ctrl+Shift+E** (Cmd+Shift+E on Mac): Open the export popup
- **Ctrl+Shift+X** (Cmd+Shift+X on Mac): Quick export with saved settings

### DevTools Panel

1. Open Chrome DevTools (F12 or Right-click → Inspect)
2. Navigate to the **Export MD** panel
3. Select an element in the Elements panel
4. Click **Convert Selected Element** to convert it to Markdown
5. Or click **Convert Entire Body** to convert the whole page
6. Copy or download the result

## File Naming

Exported files are automatically named with the format:
```
tabs-export-YYYY-MM-DD.{format}
```

For example: `tabs-export-2025-11-18.md`

DevTools exports are named:
```
element-export-YYYY-MM-DD.md
```

## Permissions

This extension requires the following permissions:

- **tabs**: To access tab information (URLs, titles)
- **scripting**: To inject content scripts for extracting page content
- **downloads**: To save exported files
- **storage**: To save your settings and preferences
- **clipboardWrite**: To copy content to clipboard
- **host_permissions (<all_urls>)**: To access content from any website

## Architecture

### Components

1. **Popup UI** (`popup.html`, `popup.css`, `popup.js`)
   - User interface for export options
   - Settings management
   - Triggers export operations

2. **Background Script** (`background.js`)
   - Service worker that orchestrates exports
   - Queries tabs and manages content extraction
   - Handles file downloads and keyboard shortcuts

3. **Content Script** (`content.js`)
   - Injected into web pages to extract content
   - Supports multiple extraction methods
   - Integrates with Readability.js and TurndownService

4. **Export Formatters** (`formatters.js`)
   - Converts tab data to different formats
   - Handles CSV escaping, Markdown formatting, etc.

5. **DevTools Panel** (`devtools.html`, `panel.html`, `panel.js`)
   - Custom DevTools panel for element-to-Markdown conversion
   - Element selection integration

6. **External Libraries** (`lib/`)
   - **Readability.js**: Mozilla's content extraction library
   - **turndown.js**: Custom HTML-to-Markdown converter

## Technical Details

### Content Extraction

The extension uses a multi-tier approach for content extraction:

1. **Simple innerText**: Fast extraction of visible text
2. **Readability.js**: Intelligent article extraction that removes clutter
3. **HTML to Markdown**: Preserves formatting and structure

### Export Process

1. Query tabs based on selected scope
2. Inject content scripts into each tab
3. Extract content using selected method
4. Aggregate data from all tabs
5. Format data according to chosen export format
6. Generate file and trigger download

### Security & Privacy

- **100% local processing** - no data sent to external servers
- **No tracking** - no analytics or telemetry
- **Open source** - full transparency
- Content extraction only occurs when explicitly triggered

## Development

### File Structure

```
extension/tabs-export/
├── manifest.json          # Extension manifest
├── popup.html             # Popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── background.js          # Background service worker
├── content.js             # Content extraction script
├── formatters.js          # Export format converters
├── devtools.html          # DevTools entry point
├── devtools.js            # DevTools panel creator
├── panel.html             # DevTools panel UI
├── panel.js               # DevTools panel logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── lib/                   # External libraries
    ├── Readability.js
    └── turndown.js
```

### Building from Source

No build step required! This extension uses vanilla JavaScript and can be loaded directly as an unpacked extension.

### Customization

You can modify export formats by editing `formatters.js`. Each format has its own export function:

- `formatAsMarkdown(tabsData)`
- `formatAsJson(tabsData)`
- `formatAsCsv(tabsData)`
- `formatAsText(tabsData)`

## Troubleshooting

### Content extraction fails

- **Special pages**: Chrome extensions cannot access `chrome://`, `chrome-extension://`, or `about:` pages
- **Permissions**: Ensure the extension has permission to access the website
- **Refresh**: Try refreshing the page and exporting again

### DevTools panel not showing

- Make sure you've loaded the extension in developer mode
- Try closing and reopening DevTools
- Check the console for errors

### Keyboard shortcuts not working

- Check for conflicts with other extensions or browser shortcuts
- Visit `chrome://extensions/shortcuts` to customize shortcuts

## Version History

### 1.0.0 (Initial Release)
- Multi-format export (Markdown, JSON, CSV, Text)
- Content extraction with Readability.js
- HTML to Markdown conversion
- DevTools panel for element selection
- Keyboard shortcuts
- Copy to clipboard functionality
- Settings persistence

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use and modify as needed.

## Credits

- **Readability.js**: Mozilla Foundation
- **Markdown conversion**: Custom TurndownService implementation
- Icon design: Simple export icon with document and arrow

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

Made with ❤️ for productivity enthusiasts
