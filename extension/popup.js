/**
 * Chunks Browser Extension - Popup Script
 * Collects browsing history and sends to Chunks Web App
 */

// Configuration
const CONFIG = {
  // Web App URL - change this to your deployed URL
  webAppUrl: 'https://chunks-browser-web-app.vercel.app/',
  // Fallback to localhost for development
  devUrl: 'http://localhost:5173',
  // Storage key for passing data
  storageKey: 'chunks_browsing_history',
  // Maximum URLs to send
  maxUrls: 200,
};

// State
let state = {
  allUrls: [],
  filteredUrls: [],
  removedUrls: [],
  isLoading: false,
};

// Blacklist instance
let blacklist = null;

// DOM Elements
const elements = {
  totalCount: document.getElementById('totalCount'),
  filteredCount: document.getElementById('filteredCount'),
  removedCount: document.getElementById('removedCount'),
  urlList: document.getElementById('urlList'),
  timeRange: document.getElementById('timeRange'),
  sendBtn: document.getElementById('sendBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  status: document.getElementById('status'),
};

/**
 * Initialize the popup
 */
async function init() {
  blacklist = new Blacklist();
  
  // Set up event listeners
  elements.timeRange.addEventListener('change', loadHistory);
  elements.sendBtn.addEventListener('click', sendToChunks);
  elements.refreshBtn.addEventListener('click', loadHistory);
  
  // Load history
  await loadHistory();
}

/**
 * Get time range in milliseconds
 */
function getTimeRange() {
  const value = elements.timeRange.value;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  switch (value) {
    case '1': return now - day;
    case '7': return now - (7 * day);
    case '30': return now - (30 * day);
    case '90': return now - (90 * day);
    case 'all': return 0;
    default: return now - (7 * day);
  }
}

/**
 * Load browsing history from Chrome API
 */
async function loadHistory() {
  state.isLoading = true;
  updateUI();
  showStatus('Loading history...', 'info');
  
  try {
    const startTime = getTimeRange();
    const endTime = Date.now();
    
    // Get history from Chrome API
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: endTime,
      maxResults: 1000,
    });
    
    // Sort by most recent
    historyItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
    
    // Extract URLs
    state.allUrls = historyItems.map(item => item.url);
    
    // Filter using blacklist
    const filterResult = blacklist.filterUrls(state.allUrls);
    state.filteredUrls = filterResult.filtered.slice(0, CONFIG.maxUrls);
    state.removedUrls = filterResult.removed;
    
    state.isLoading = false;
    updateUI();
    hideStatus();
    
  } catch (error) {
    console.error('Error loading history:', error);
    state.isLoading = false;
    showStatus('Failed to load history: ' + error.message, 'error');
    updateUI();
  }
}

/**
 * Update the UI with current state
 */
function updateUI() {
  // Update stats
  elements.totalCount.textContent = state.allUrls.length;
  elements.filteredCount.textContent = state.filteredUrls.length;
  elements.removedCount.textContent = state.removedUrls.length;
  
  // Update URL list
  if (state.isLoading) {
    elements.urlList.innerHTML = `
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    `;
  } else if (state.filteredUrls.length === 0) {
    elements.urlList.innerHTML = `
      <div class="url-more">No URLs found in this time range</div>
    `;
  } else {
    const previewUrls = state.filteredUrls.slice(0, 5);
    const remaining = state.filteredUrls.length - 5;
    
    let html = previewUrls.map(url => {
      const hostname = getHostname(url);
      return `
        <div class="url-item">
          <img class="url-favicon" src="https://www.google.com/s2/favicons?domain=${hostname}&sz=32" alt="">
          <span class="url-text" title="${escapeHtml(url)}">${escapeHtml(hostname)}</span>
        </div>
      `;
    }).join('');
    
    if (remaining > 0) {
      html += `<div class="url-more">... and ${remaining} more URLs</div>`;
    }
    
    elements.urlList.innerHTML = html;
  }
  
  // Update send button
  elements.sendBtn.disabled = state.isLoading || state.filteredUrls.length === 0;
}

/**
 * Send URLs to Chunks Web App
 */
async function sendToChunks() {
  if (state.filteredUrls.length === 0) {
    showStatus('No URLs to send', 'error');
    return;
  }
  
  elements.sendBtn.disabled = true;
  showStatus('Preparing to send...', 'info');
  
  try {
    // Prepare data
    const data = {
      urls: state.filteredUrls,
      timestamp: Date.now(),
      source: 'chunks-extension',
      stats: {
        total: state.allUrls.length,
        filtered: state.filteredUrls.length,
        removed: state.removedUrls.length,
      }
    };
    
    // Store data in chrome.storage.local
    await chrome.storage.local.set({ [CONFIG.storageKey]: data });
    
    // Open the web app
    const webAppUrl = `${CONFIG.webAppUrl}/#/receive?source=extension&count=${state.filteredUrls.length}`;
    
    // Create a new tab
    const tab = await chrome.tabs.create({ url: webAppUrl });
    
    showStatus('Opening Chunks App...', 'info');
    
    // Wait for the tab to load, then inject data via content script
    await waitForTabLoad(tab.id);
    
    // Inject the data using scripting API (try multiple times)
    let injected = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: injectHistoryData,
          args: [data]
        });
        injected = true;
        console.log(`Data injected successfully on attempt ${attempt + 1}`);
        break;
      } catch (e) {
        console.log(`Injection attempt ${attempt + 1} failed:`, e);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    if (!injected) {
      throw new Error('Failed to inject data after 3 attempts');
    }
    
    showStatus('✓ Sent! Opening Chunks App...', 'success');
    
    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
    
  } catch (error) {
    console.error('Error sending to Chunks:', error);
    showStatus('Failed to send: ' + error.message, 'error');
    elements.sendBtn.disabled = false;
  }
}

/**
 * Wait for tab to finish loading
 */
function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (id, changeInfo) => {
      if (id === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        // Wait longer for React to mount and hydrate
        setTimeout(resolve, 1500);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 10000);
  });
}

/**
 * Function to be injected into the web app page
 */
function injectHistoryData(data) {
  // Store in localStorage
  localStorage.setItem('chunks_browsing_history', JSON.stringify(data));
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('chunks-history-received', {
    detail: data
  }));
  
  // Also try postMessage
  window.postMessage({ type: 'CHUNKS_HISTORY_DATA', payload: data }, '*');
}

/**
 * Show status message
 */
function showStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = 'status ' + type;
}

/**
 * Hide status message
 */
function hideStatus() {
  elements.status.className = 'status';
}

/**
 * Get hostname from URL
 */
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

