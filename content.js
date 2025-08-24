// Content script for Smart Checkbox Selector
// This script runs on all web pages and provides checkbox detection functionality

(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.smartCheckboxSelectorInjected) {
        return;
    }
    window.smartCheckboxSelectorInjected = true;
    
    // Configuration
    const CONFIG = {
        maxNearbyElements: 20,
        maxSearchDepth: 2,
        debounceDelay: 100
    };
    
    // Main checkbox selection function
    function selectCheckboxesByKeywords(keywords) {
        try {
            console.log('Smart Checkbox Selector: Starting selection with keywords:', keywords);
            
            if (!Array.isArray(keywords) || keywords.length === 0) {
                throw new Error('No keywords provided');
            }
            
            // Find all checkboxes on the page
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            console.log(`Found ${checkboxes.length} checkboxes on the page`);
            
            let selectedCount = 0;
            const matchedElements = [];
            
            checkboxes.forEach((checkbox, index) => {
                try {
                    // Skip if already checked
                    if (checkbox.checked) {
                        return;
                    }
                    
                    // Build comprehensive searchable text
                    const searchableText = buildSearchableText(checkbox);
                    
                    if (!searchableText) {
                        return;
                    }
                    
                    // Check for keyword matches
                    const matchedKeywords = findMatchingKeywords(searchableText, keywords);
                    
                    if (matchedKeywords.length > 0) {
                        // Select the checkbox
                        checkbox.checked = true;
                        selectedCount++;
                        
                        // Store match information
                        matchedElements.push({
                            element: checkbox,
                            searchText: searchableText,
                            matchedKeywords: matchedKeywords
                        });
                        
                        // Trigger events to notify the page
                        triggerCheckboxEvents(checkbox);
                        
                        console.log(`Selected checkbox ${index + 1}: matched keywords [${matchedKeywords.join(', ')}]`);
                    }
                    
                } catch (error) {
                    console.warn(`Error processing checkbox ${index + 1}:`, error);
                }
            });
            
            // Log results
            console.log(`Smart Checkbox Selector: Selected ${selectedCount} out of ${checkboxes.length} checkboxes`);
            
            // Add visual feedback (optional)
            if (selectedCount > 0) {
                showSelectionFeedback(selectedCount);
            }
            
            return {
                success: true,
                totalCheckboxes: checkboxes.length,
                selectedCount: selectedCount,
                matchedElements: matchedElements.length,
                error: null
            };
            
        } catch (error) {
            console.error('Smart Checkbox Selector error:', error);
            return {
                success: false,
                totalCheckboxes: 0,
                selectedCount: 0,
                matchedElements: 0,
                error: error.message
            };
        }
    }
    
    // Build searchable text from checkbox and surrounding elements
    function buildSearchableText(checkbox) {
        const textParts = new Set(); // Use Set to avoid duplicates
        
        try {
            // Add checkbox attributes
            addIfExists(textParts, checkbox.id);
            addIfExists(textParts, checkbox.name);
            addIfExists(textParts, checkbox.value);
            addIfExists(textParts, checkbox.title);
            addIfExists(textParts, checkbox.getAttribute('data-label'));
            addIfExists(textParts, checkbox.getAttribute('aria-label'));
            
            // Find and add label text
            const labels = findAssociatedLabels(checkbox);
            labels.forEach(label => {
                addIfExists(textParts, cleanText(label.textContent));
            });
            
            // Find and add nearby element text
            const nearbyElements = findNearbyTextElements(checkbox);
            nearbyElements.forEach(element => {
                addIfExists(textParts, cleanText(element.textContent));
            });
            
            // Join all text parts
            const searchableText = Array.from(textParts).join(' ').trim();
            return searchableText;
            
        } catch (error) {
            console.warn('Error building searchable text:', error);
            return '';
        }
    }
    
    // Find labels associated with the checkbox
    function findAssociatedLabels(checkbox) {
        const labels = [];
        
        try {
            // Label with 'for' attribute pointing to checkbox ID
            if (checkbox.id) {
                const labelFor = document.querySelector(`label[for="${CSS.escape(checkbox.id)}"]`);
                if (labelFor) {
                    labels.push(labelFor);
                }
            }
            
            // Parent label element
            const parentLabel = checkbox.closest('label');
            if (parentLabel) {
                labels.push(parentLabel);
            }
            
            // Sibling labels
            const parent = checkbox.parentElement;
            if (parent) {
                const siblingLabels = parent.querySelectorAll('label');
                siblingLabels.forEach(label => {
                    if (!labels.includes(label)) {
                        labels.push(label);
                    }
                });
            }
            
        } catch (error) {
            console.warn('Error finding associated labels:', error);
        }
        
        return labels;
    }
    
    // Find nearby text elements (spans, divs, etc.)
    function findNearbyTextElements(checkbox) {
        const elements = [];
        const visited = new Set();
        
        try {
            // Check parent and siblings
            const parent = checkbox.parentElement;
            if (parent) {
                // Add parent text
                if (parent.textContent && parent !== checkbox) {
                    elements.push(parent);
                    visited.add(parent);
                }
                
                // Check siblings
                const siblings = Array.from(parent.children);
                siblings.forEach(sibling => {
                    if (sibling !== checkbox && !visited.has(sibling)) {
                        if (isTextElement(sibling)) {
                            elements.push(sibling);
                            visited.add(sibling);
                        }
                        
                        // Check sibling's children
                        const children = sibling.querySelectorAll('span, div, p, td, th, li');
                        Array.from(children).slice(0, 10).forEach(child => {
                            if (!visited.has(child) && isTextElement(child)) {
                                elements.push(child);
                                visited.add(child);
                            }
                        });
                    }
                });
                
                // Check grandparent level
                const grandParent = parent.parentElement;
                if (grandParent) {
                    const parentSiblings = Array.from(grandParent.children);
                    parentSiblings.forEach(sibling => {
                        if (sibling !== parent && !visited.has(sibling) && isTextElement(sibling)) {
                            elements.push(sibling);
                            visited.add(sibling);
                        }
                    });
                }
            }
            
        } catch (error) {
            console.warn('Error finding nearby text elements:', error);
        }
        
        return elements.slice(0, CONFIG.maxNearbyElements);
    }
    
    // Check if element contains meaningful text
    function isTextElement(element) {
        if (!element || !element.textContent) return false;
        
        const text = element.textContent.trim();
        return text.length > 0 && text.length < 500; // Avoid very long text blocks
    }
    
    // Find keywords that match the searchable text
    function findMatchingKeywords(searchableText, keywords) {
        const matchedKeywords = [];
        const lowerSearchText = searchableText.toLowerCase();
        
        keywords.forEach(keyword => {
            if (keyword && typeof keyword === 'string') {
                const lowerKeyword = keyword.toLowerCase().trim();
                if (lowerKeyword && lowerSearchText.includes(lowerKeyword)) {
                    matchedKeywords.push(keyword);
                }
            }
        });
        
        return matchedKeywords;
    }
    
    // Trigger appropriate events when checkbox is selected
    function triggerCheckboxEvents(checkbox) {
        try {
            // Create and dispatch events
            const events = ['change', 'click', 'input'];
            
            events.forEach(eventType => {
                const event = new Event(eventType, {
                    bubbles: true,
                    cancelable: true
                });
                checkbox.dispatchEvent(event);
            });
            
            // Also try jQuery events if jQuery is available
            if (window.jQuery && window.jQuery(checkbox).length) {
                window.jQuery(checkbox).trigger('change');
            }
            
        } catch (error) {
            console.warn('Error triggering checkbox events:', error);
        }
    }
    
    // Show visual feedback for selections
    function showSelectionFeedback(count) {
        try {
            // Create temporary notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4285f4;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                transition: all 0.3s ease;
            `;
            notification.textContent = `✓ Selected ${count} checkbox${count !== 1 ? 'es' : ''}`;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 3000);
            
        } catch (error) {
            console.warn('Error showing selection feedback:', error);
        }
    }
    
    // Utility functions
    function addIfExists(set, value) {
        if (value && typeof value === 'string') {
            const cleaned = cleanText(value);
            if (cleaned) {
                set.add(cleaned);
            }
        }
    }
    
    function cleanText(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s-_.]/g, ' ') // Remove special characters except common ones
            .trim();
    }
    
    // Expose function globally for popup script injection
    window.selectCheckboxes = selectCheckboxesByKeywords;
    
    console.log('Smart Checkbox Selector content script loaded');
    
})();
