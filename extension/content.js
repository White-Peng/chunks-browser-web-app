/**
 * Content script to inject browsing history data into web app localStorage
 */

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_HISTORY_DATA') {
    try {
      // Store data in localStorage for the web app to read
      localStorage.setItem('chunks_browsing_history', JSON.stringify(message.data));
      
      // Also dispatch a custom event for the web app
      window.dispatchEvent(new CustomEvent('chunks-history-received', {
        detail: message.data
      }));
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

// Notify the web app that the extension is present
window.postMessage({ type: 'CHUNKS_EXTENSION_PRESENT', version: '1.0' }, '*');

