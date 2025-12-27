/**
 * Content script to inject browsing history data into web app localStorage
 * This runs automatically when the page loads
 */

const STORAGE_KEY = 'chunks_browsing_history';

// Function to transfer data from chrome.storage to localStorage
async function transferDataToLocalStorage() {
  try {
    // Get data from chrome.storage.local
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY];
    
    if (data) {
      console.log('[Chunks Extension] Found data in chrome.storage, transferring to localStorage...');
      console.log('[Chunks Extension] URLs count:', data.urls?.length);
      
      // Write to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('chunks-history-received', {
        detail: data
      }));
      
      // Also use postMessage
      window.postMessage({ type: 'CHUNKS_HISTORY_DATA', payload: data }, '*');
      
      // Clear from chrome.storage after successful transfer
      await chrome.storage.local.remove(STORAGE_KEY);
      
      console.log('[Chunks Extension] Data transferred successfully!');
    } else {
      console.log('[Chunks Extension] No data found in chrome.storage');
    }
  } catch (error) {
    console.error('[Chunks Extension] Error transferring data:', error);
  }
}

// Run immediately when script loads
transferDataToLocalStorage();

// Also run when DOM is ready (backup)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', transferDataToLocalStorage);
} else {
  // DOM already loaded, run again after a short delay for React to mount
  setTimeout(transferDataToLocalStorage, 500);
  setTimeout(transferDataToLocalStorage, 1500);
  setTimeout(transferDataToLocalStorage, 3000);
}

// Listen for messages from the extension popup (backup method)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_HISTORY_DATA') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message.data));
      window.dispatchEvent(new CustomEvent('chunks-history-received', {
        detail: message.data
      }));
      window.postMessage({ type: 'CHUNKS_HISTORY_DATA', payload: message.data }, '*');
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

// Notify the web app that the extension is present
window.postMessage({ type: 'CHUNKS_EXTENSION_PRESENT', version: '1.0' }, '*');
console.log('[Chunks Extension] Content script loaded');

