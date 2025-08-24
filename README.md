# Smart Checkbox Selector - Chrome Extension

A Chrome browser extension that automatically selects checkboxes on webpages based on user-defined keywords with intelligent text matching capabilities.

## Features

- **Dual Keyword Categories**: Separate input areas for "Packages" and "VODs" keywords
- **Smart Text Matching**: Analyzes checkbox attributes, labels, and nearby text elements
- **Persistent Storage**: Automatically saves your keywords for future use
- **Visual Feedback**: Shows selection results and statistics
- **One-Click Operation**: Apply selections to any webpage with a single button
- **Performance Optimized**: Efficiently handles pages with hundreds of checkboxes

## Installation Instructions

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download/Clone the Extension**
   - Download all files to a folder on your computer
   - Ensure you have these 5 files:
     - `manifest.json`
     - `popup.html`
     - `popup.js`
     - `content.js`
     - `styles.css`

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should appear in your extensions list

5. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Smart Checkbox Selector" and click the pin icon

## How to Use

### 1. Setting Up Keywords

1. **Click the Extension Icon**
   - Look for the blue checkbox icon in your Chrome toolbar
   - Click it to open the popup interface

2. **Enter Keywords**
   - **Packages Section**: Enter package-related keywords (one per line)
     ```
     sports
     movies
     premium
     entertainment
     ```
   - **VODs Section**: Enter video-on-demand keywords (one per line)
     ```
     netflix
     hulu
     disney
     amazon prime
     ```

3. **Keywords are Auto-Saved**
   - Your keywords are automatically saved as you type
   - No need to manually save

### 2. Applying Selections

1. **Navigate to Target Website**
   - Go to any website with checkboxes (IPTV services, streaming platforms, etc.)

2. **Open the Extension**
   - Click the extension icon to open the popup

3. **Apply Selection**
   - Click the "Apply Selection" button
   - The extension will automatically select matching checkboxes

4. **View Results**
   - Success message shows how many checkboxes were selected
   - Statistics display total checkboxes found and matches selected

## How the Matching Works

The extension uses intelligent text matching by analyzing:

### Checkbox Attributes
- `id` attribute
- `name` attribute  
- `value` attribute
- `title` attribute
- `aria-label` attribute
- `data-label` attribute

### Associated Labels
- Labels with `for` attribute pointing to checkbox
- Parent `<label>` elements
- Sibling label elements

### Nearby Text Elements
- Text content of nearby `<span>`, `<div>`, `<p>` elements
- Parent and sibling element text
- Elements within 2 DOM levels of the checkbox

### Matching Algorithm
- **Case-insensitive**: "Netflix" matches "netflix", "NETFLIX", etc.
- **Partial matching**: "sport" matches "sports", "sporting", etc.
- **Whitespace normalized**: Handles extra spaces and line breaks
- **Duplicate prevention**: Avoids selecting already checked boxes

## File Structure

```
smart-checkbox-selector/
├── manifest.json          # Extension configuration
├── popup.html            # User interface layout
├── popup.js              # Popup logic and keyword management
├── content.js            # Checkbox detection and selection
├── styles.css            # User interface styling
└── README.md             # This documentation
```

## Troubleshooting

### Extension Not Working
- **Check Permissions**: Ensure the extension has access to the current tab
- **Reload Extension**: Go to `chrome://extensions/` and click the reload button
- **Check Console**: Open Developer Tools (F12) and check for error messages

### No Checkboxes Selected
- **Verify Keywords**: Make sure your keywords match the text on the page
- **Check Page Content**: Some pages load content dynamically - try waiting a moment
- **Case Sensitivity**: The matching is case-insensitive, so this shouldn't be an issue

### Cannot Access Certain Pages
- **Chrome Internal Pages**: Extension cannot access `chrome://` pages
- **HTTPS/Security**: Some secure pages may block extension access
- **Permissions**: Extension needs "activeTab" permission to work

### Performance Issues
- **Large Pages**: Pages with thousands of checkboxes may take a moment to process
- **Memory Usage**: The extension is optimized but very large pages may use more memory

## Technical Details

### Permissions Used
- `activeTab`: Access to the currently active tab
- `scripting`: Ability to inject content scripts
- `storage`: Save user preferences and statistics

### Browser Compatibility
- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Should work (Chromium-based)
- **Firefox**: Not compatible (uses different extension format)

### Security
- No external network requests
- No data collection or tracking
- All data stored locally in browser

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify the extension is enabled and has permissions
3. Try reloading the extension
4. Test on a simple webpage with checkboxes first

## Version History

- **v1.0**: Initial release with core functionality
  - Dual keyword categories (Packages/VODs)
  - Smart text matching
  - Persistent storage
  - Visual feedback and statistics
