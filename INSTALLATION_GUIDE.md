# Tabs Export Chrome Extension - Installation Guide

## 🎉 Get the Extension

### Option 1: Download from GitHub (Recommended)

**Direct Download Link:**
```
https://github.com/bhavikppc/SCRAPERS1/raw/claude/chrome-tabs-export-extension-01Umd6m9J6gHy9iTq2dS5pGD/tabs-export-v1.0.0.zip
```

**Steps:**
1. Click the link above (or copy and paste it into your browser)
2. The ZIP file will download automatically
3. Unzip the file to a folder on your computer
4. Follow "Installation Steps" below

### Option 2: Clone from GitHub

```bash
git clone -b claude/chrome-tabs-export-extension-01Umd6m9J6gHy9iTq2dS5pGD https://github.com/bhavikppc/SCRAPERS1.git
cd SCRAPERS1/extension/tabs-export
```

---

## 📦 Installation Steps

1. **Download & Unzip**
   - Download `tabs-export-v1.0.0.zip`
   - Extract to a permanent location (don't delete after installing!)
   - You should see a `tabs-export` folder

2. **Open Chrome Extensions Page**
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/`
   - Or click: Menu → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" switch in top-right corner
   - New buttons will appear

4. **Load the Extension**
   - Click **"Load unpacked"** button
   - Navigate to the extracted `tabs-export` folder
   - Select the folder and click **"Select Folder"** (or "Open")

5. **Verify Installation**
   - You should see "Tabs Export" in your extensions list
   - Extension icon appears in browser toolbar
   - Status shows "Enabled"

6. **Grant Permissions**
   - Click "Details" on the extension
   - Scroll down to "Permissions"
   - Extension will request:
     - `tabs` - Read tab information
     - `scripting` - Extract content from pages
     - `downloads` - Save exported files
     - `storage` - Save your preferences
     - `clipboardWrite` - Copy to clipboard
     - `debugger` - Capture screenshots
   - All permissions are required for full functionality

---

## 🚀 Quick Start

1. **Click the extension icon** in your toolbar
2. **Choose options:**
   - ✅ Include page content
   - ✅ Capture full-page screenshot (JPG)
3. **Select scope:** All windows / Current window / Active tab
4. **Click format button:** Markdown / JSON / CSV / Text
5. **Files download automatically!**

---

## ✨ Features

✅ **Export all open tabs** with content
✅ **Multiple formats:** Markdown, JSON, CSV, Text
✅ **Full-page screenshots** (JPG) - entire page in one shot!
✅ **Link extraction** - all links from each page
✅ **Content extraction** - full text or cleaned with Readability
✅ **DevTools panel** - Convert selected HTML to Markdown
✅ **Copy to clipboard**
✅ **Keyboard shortcuts** (Ctrl+Shift+E, Ctrl+Shift+X)
✅ **100% local processing** - no external servers

---

## 📋 Example Use Cases

- **Job Scraping:** Export all job listings from Naukri/LinkedIn
- **Research:** Save all tabs with content and links
- **Archiving:** Screenshot + content backup of important pages
- **Data Collection:** Export structured data to CSV for Excel

---

## 🔗 Sharing with Others

### Share the Direct Download Link:
```
https://github.com/bhavikppc/SCRAPERS1/raw/claude/chrome-tabs-export-extension-01Umd6m9J6gHy9iTq2dS5pGD/tabs-export-v1.0.0.zip
```

### Or Share the Repository:
```
https://github.com/bhavikppc/SCRAPERS1/tree/claude/chrome-tabs-export-extension-01Umd6m9J6gHy9iTq2dS5pGD
```

---

## ⚠️ Important Notes

- **Keep the extension folder:** Don't delete the `tabs-export` folder after installation! Chrome loads the extension from this folder.
- **Debugger warning:** When capturing screenshots, Chrome may briefly show "DevTools is debugging" - this is normal and safe.
- **Updates:** To update, download the new ZIP, replace the folder, and click the reload icon in `chrome://extensions/`

---

## 🛠️ Troubleshooting

### Extension won't load?
- Make sure you selected the `tabs-export` folder (not the parent folder)
- Check that `manifest.json` is directly in the selected folder
- Disable any conflicting extensions

### Content not extracting?
- Check that "Include page content" is checked ✓
- Some sites (chrome://, file://) cannot be accessed
- Open browser console (F12) to see error messages

### Screenshots not working?
- Make sure "Capture full-page screenshot" is checked ✓
- Grant debugger permission when prompted
- Some protected pages cannot be captured

---

## 📞 Support

For issues or questions:
- Check the README.md in the extension folder
- Open an issue on GitHub: https://github.com/bhavikppc/SCRAPERS1/issues

---

## 📄 Version

**Current Version:** 1.0.0
**Branch:** `claude/chrome-tabs-export-extension-01Umd6m9J6gHy9iTq2dS5pGD`
**Last Updated:** November 19, 2025

---

**Made with ❤️ for productivity enthusiasts**
