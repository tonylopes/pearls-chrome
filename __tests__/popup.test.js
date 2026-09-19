const fs = require('fs');
const path = require('path');

// Helper to evaluate scripts into global scope for jsdom environment
function loadScript(relativePath) {
  const fullPath = path.resolve(__dirname, relativePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  eval.call(global, code);
}

describe('Popup - Toggle Extension State', () => {
  let mockStorageData = {};

  beforeEach(() => {
    mockStorageData = {};
    
    // Set up DOM matching popup.html
    const html = fs.readFileSync(path.resolve(__dirname, '../pearls/popup.html'), 'utf8');
    document.body.innerHTML = html;

    // Mock chrome storage and tabs APIs
    global.logError = jest.fn();
    global.dlogInfo = jest.fn();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => {
            const result = {};
            const keyList = Array.isArray(keys) ? keys : [keys];
            keyList.forEach(k => {
              if (k in mockStorageData) result[k] = mockStorageData[k];
            });
            // Simulate async storage read
            setTimeout(() => callback(result), 5);
          }),
          set: jest.fn((items, callback) => {
            // Simulate async storage write (takes 10ms to update storageData)
            setTimeout(() => {
              Object.assign(mockStorageData, items);
              if (callback) callback();
            }, 10);
          })
        }
      },
      tabs: {
        query: jest.fn((queryInfo, callback) => {
          setTimeout(() => callback([{ id: 101, url: 'http://example.com' }]), 1);
        }),
        sendMessage: jest.fn((tabId, message, callback) => {
          if (callback) {
            if (message.type === 'wordsColors') {
              callback({ wordsColors: 'apple,#000,#fff,' });
            } else {
              callback({ total: 1 });
            }
          }
        })
      },
      action: {
        setBadgeText: jest.fn()
      },
      runtime: {}
    };

    loadScript('../pearls/logs.js');
    loadScript('../pearls/pearlstorage.js');
    loadScript('../pearls/pearlupdate.js');
    loadScript('../pearls/popup.js');

    setUrl('http://example.com');
  });

  test('turnOnOff should send toggled: true to active tab when turning on from off state', async () => {
    // 1. Initial state: extension is turned OFF (toggled: false in storage)
    mockStorageData['toggled'] = false;
    mockStorageData['http?://*/*'] = 'apple';

    // 2. Trigger turnOnOff (user clicks toggle button to turn ON)
    turnOnOff();

    // Wait for async promises and storage callbacks to resolve
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Verify chrome.tabs.sendMessage was called with type: 'hilight' and toggled: true
    const hilightCalls = chrome.tabs.sendMessage.mock.calls.filter(
      call => call[1] && call[1].type === 'hilight'
    );
    expect(hilightCalls.length).toBeGreaterThan(0);
    expect(hilightCalls[hilightCalls.length - 1][1]).toEqual(
      expect.objectContaining({
        type: 'hilight',
        toggled: true
      })
    );
  });
});
