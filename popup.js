// DOM elements
const packagesTextarea = document.getElementById('packages-keywords');
const vodsTextarea = document.getElementById('vods-keywords');
const applyButton = document.getElementById('apply-selection');
const messageArea = document.getElementById('message-area');
const messageContent = document.getElementById('message-content');
const lastRunStat = document.getElementById('last-run');
const checkboxesFoundStat = document.getElementById('checkboxes-found');
const matchesSelectedStat = document.getElementById('matches-selected');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadSavedKeywords();
    await loadStats();
    setupEventListeners();
});

// Load saved keywords from storage
async function loadSavedKeywords() {
    try {
        const result = await chrome.storage.local.get(['packages', 'vods']);
        
        if (result.packages && Array.isArray(result.packages)) {
            packagesTextarea.value = result.packages.join('\n');
        }
        
        if (result.vods && Array.isArray(result.vods)) {
            vodsTextarea.value = result.vods.join('\n');
        }
    } catch (error) {
        console.error('Error loading saved keywords:', error);
    }
}

// Load statistics from storage
async function loadStats() {
    try {
        const result = await chrome.storage.local.get(['lastRun', 'checkboxesFound', 'matchesSelected']);
        
        if (result.lastRun) {
            lastRunStat.textContent = new Date(result.lastRun).toLocaleString();
        }
        
        if (result.checkboxesFound !== undefined) {
            checkboxesFoundStat.textContent = result.checkboxesFound;
        }
        
        if (result.matchesSelected !== undefined) {
            matchesSelectedStat.textContent = result.matchesSelected;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auto-save keywords when typing
    packagesTextarea.addEventListener('input', debounce(saveKeywords, 500));
    vodsTextarea.addEventListener('input', debounce(saveKeywords, 500));
    
    // Apply selection button
    applyButton.addEventListener('click', handleApplySelection);
}

// Process and save keywords
async function saveKeywords() {
    try {
        const packagesKeywords = processKeywords(packagesTextarea.value);
        const vodsKeywords = processKeywords(vodsTextarea.value);
        
        await chrome.storage.local.set({
            packages: packagesKeywords,
            vods: vodsKeywords
        });
    } catch (error) {
        console.error('Error saving keywords:', error);
    }
}

// Process keywords: split by lines, trim, remove duplicates and empty lines
function processKeywords(text) {
    if (!text || typeof text !== 'string') return [];
    
    return text
        .split('\n')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .filter((keyword, index, array) => 
            array.findIndex(k => k.toLowerCase() === keyword.toLowerCase()) === index
        );
}

// Handle apply selection button click
async function handleApplySelection() {
    try {
        // Disable button and show loading state
        setButtonLoading(true);
        showMessage('Processing...', 'info');
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        // Check if we can access the tab
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            throw new Error('Cannot access Chrome internal pages');
        }
        
        // Process keywords
        const packagesKeywords = processKeywords(packagesTextarea.value);
        const vodsKeywords = processKeywords(vodsTextarea.value);
        const allKeywords = [...packagesKeywords, ...vodsKeywords];
        
        if (allKeywords.length === 0) {
            throw new Error('Please enter at least one keyword');
        }
        
        // Save keywords
        await saveKeywords();
        
        // Inject and execute content script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: selectCheckboxes,
            args: [allKeywords]
        });
        
        const result = results[0].result;
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Update stats
        const now = Date.now();
        await chrome.storage.local.set({
            lastRun: now,
            checkboxesFound: result.totalCheckboxes,
            matchesSelected: result.selectedCount
        });
        
        // Update UI
        await loadStats();
        showMessage(
            `Success! Selected ${result.selectedCount} out of ${result.totalCheckboxes} checkboxes.`,
            'success'
        );
        
    } catch (error) {
        console.error('Error applying selection:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(false);
    }
}

// Content script function to be injected
function selectCheckboxes(keywords) {
    try {
        // Helper function to build searchable text for a checkbox
        function buildSearchableText(checkbox) {
            const textParts = [];

            // Add checkbox attributes
            if (checkbox.id) textParts.push(checkbox.id);
            if (checkbox.name) textParts.push(checkbox.name);
            if (checkbox.value) textParts.push(checkbox.value);
            if (checkbox.title) textParts.push(checkbox.title);
            if (checkbox.getAttribute('aria-label')) textParts.push(checkbox.getAttribute('aria-label'));
            if (checkbox.getAttribute('data-label')) textParts.push(checkbox.getAttribute('data-label'));

            // Find associated labels
            const labels = findAssociatedLabels(checkbox);
            labels.forEach(label => {
                if (label.textContent) textParts.push(label.textContent.trim());
            });

            // Find nearby text elements
            const nearbyElements = findNearbyTextElements(checkbox);
            nearbyElements.forEach(element => {
                if (element.textContent) textParts.push(element.textContent.trim());
            });

            return textParts.join(' ').trim();
        }

        // Helper function to find labels associated with checkbox
        function findAssociatedLabels(checkbox) {
            const labels = [];

            // Label with 'for' attribute
            if (checkbox.id) {
                try {
                    const labelFor = document.querySelector(`label[for="${CSS.escape(checkbox.id)}"]`);
                    if (labelFor) labels.push(labelFor);
                } catch (e) {
                    // Fallback if CSS.escape fails
                    const labelFor = document.querySelector(`label[for="${checkbox.id}"]`);
                    if (labelFor) labels.push(labelFor);
                }
            }

            // Parent label
            const parentLabel = checkbox.closest('label');
            if (parentLabel) labels.push(parentLabel);

            return labels;
        }

        // Helper function to find nearby text elements
        function findNearbyTextElements(checkbox) {
            const elements = [];
            const maxElements = 20;

            try {
                // Check siblings and their children
                const parent = checkbox.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    siblings.forEach(sibling => {
                        if (sibling !== checkbox && (sibling.tagName === 'SPAN' || sibling.tagName === 'DIV' || sibling.tagName === 'P')) {
                            elements.push(sibling);
                            // Check children
                            const children = sibling.querySelectorAll('span, div, p');
                            Array.from(children).slice(0, 5).forEach(child => elements.push(child));
                        }
                    });

                    // Check parent's siblings
                    const grandParent = parent.parentElement;
                    if (grandParent) {
                        const parentSiblings = Array.from(grandParent.children);
                        parentSiblings.forEach(sibling => {
                            if (sibling !== parent && (sibling.tagName === 'SPAN' || sibling.tagName === 'DIV' || sibling.tagName === 'P')) {
                                elements.push(sibling);
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn('Error finding nearby elements:', error);
            }

            return elements.slice(0, maxElements);
        }

        // Find all checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        let selectedCount = 0;

        checkboxes.forEach(checkbox => {
            // Skip if already checked
            if (checkbox.checked) return;

            // Build searchable text from various sources
            const searchText = buildSearchableText(checkbox);

            // Check if any keyword matches
            const hasMatch = keywords.some(keyword =>
                searchText.toLowerCase().includes(keyword.toLowerCase())
            );

            if (hasMatch) {
                checkbox.checked = true;
                selectedCount++;

                // Trigger change events
                try {
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    checkbox.dispatchEvent(new Event('click', { bubbles: true }));
                    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
                } catch (e) {
                    console.warn('Error triggering events:', e);
                }
            }
        });

        return {
            totalCheckboxes: checkboxes.length,
            selectedCount: selectedCount,
            error: null
        };

    } catch (error) {
        return {
            totalCheckboxes: 0,
            selectedCount: 0,
            error: error.message
        };
    }
}



// Utility functions
function setButtonLoading(loading) {
    applyButton.disabled = loading;
    if (loading) {
        applyButton.classList.add('loading');
        applyButton.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
    } else {
        applyButton.classList.remove('loading');
        applyButton.innerHTML = '<span class="btn-icon">✓</span>Apply Selection';
    }
}

function showMessage(text, type) {
    messageContent.textContent = text;
    messageArea.className = `message-area ${type}`;
    messageArea.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageArea.classList.add('hidden');
        }, 5000);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
