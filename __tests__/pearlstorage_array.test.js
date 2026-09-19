const {
  setUrl,
  loadValue,
  saveValue,
  loadPearlsArray,
  savePearlsArray,
  saveTagColors,
  loadTagColors
} = require('../pearls/pearlstorage.js');

describe('pearlstorage array and color helpers', () => {
  let mockStorageData = {};

  beforeEach(() => {
    mockStorageData = {};
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
            setTimeout(() => callback(result), 1);
          }),
          set: jest.fn((items, callback) => {
            Object.assign(mockStorageData, items);
            if (callback) setTimeout(callback, 1);
          })
        }
      },
      runtime: {}
    };

    setUrl('http://example.com/test');
  });

  test('loadPearlsArray converts comma-separated string into clean array', async () => {
    mockStorageData['http?://*/*'] = 'apple, banana , cherry';
    const result = await loadPearlsArray('globalpearls');
    expect(result).toEqual(['apple', 'banana', 'cherry']);
  });

  test('loadPearlsArray handles empty or whitespace values', async () => {
    mockStorageData['http?://*/*'] = ' ,  ';
    const result = await loadPearlsArray('globalpearls');
    expect(result).toEqual([]);
  });

  test('savePearlsArray formats array as comma-separated string', async () => {
    await savePearlsArray('globalpearls', ['pear', 'orange', 'grape']);
    expect(mockStorageData['http?://*/*']).toBe('pear,orange,grape');
  });

  test('saveTagColors and loadTagColors store and retrieve color map', async () => {
    const colors = { apple: '#ff0000', banana: '#00ff00' };
    await saveTagColors(colors);
    const loaded = await loadTagColors();
    expect(loaded).toEqual(colors);
  });
});
