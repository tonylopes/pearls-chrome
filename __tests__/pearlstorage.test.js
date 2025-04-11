
// Import the module that contains the loadValue function
const pearlstorage = require('../pearls/pearlstorage.js');

// Mocking chrome globals with jest
function setup_mocks() {
  const get = jest.fn()
  const set = jest.fn()
  global.logError = jest.fn()
  global.chrome = {
    storage: {
      local: {
        set,
        get
      }
    }
  }

  const key = jest.fn()
  const length = jest.fn()
  const getItem = jest.fn()
  const setItem = jest.fn()
  global.localStorage = {
    key,
    length,
    getItem,
    setItem
  }
}

// Write a test suite for the loadValue function
describe('loadValue', () => {

  beforeEach(() => {
    setup_mocks();
    // and reset all mocks
    jest.clearAllMocks();
  });

  // Write a test case for when the key exists in chrome.storage.local
  test('should return the value from chrome.storage.local if the key exists', () => {
    
    // Mock the chrome.storage.local.get function to return a specific value
    chrome.storage.local.get.mockImplementationOnce((key, callback) => {
      callback({ ['key']: 'value' });
    });

    // Call the loadValue function with a specific key
    return pearlstorage.loadValue('key').then((result) => {
      // Assert that the result is equal to the expected value
      expect(result).toEqual('value');
    });
  });

  // Write a test case for when an error occurs in chrome.storage.local.get
  test('should handle errors that occur in chrome.storage.local.get', async () => {
    // Mock the chrome.storage.local.get function to throw an error
    chrome.storage.local.get.mockImplementationOnce((key, callback) => {
      callback(new Error('Error')); 
    });
    // Call the loadValue function with a specific key
    return pearlstorage.loadValue('key').then((result) => {
      // Assert that the result is null or undefined
      expect(result).toEqual("");
    });
  });
});


describe('saveValue', () => {
  beforeEach(() => {
    setup_mocks();
    jest.clearAllMocks();
  });

  // Write a test case for when the value is saved to chrome.storage.local
  test('should save the value to chrome.storage.local', async () => {
    chrome.storage.local.set.mockImplementationOnce((data, callback) => {
      callback();
    });

    // Call the saveValue function with a specific key and value
    return expect(pearlstorage.saveValue('key', 'value')).resolves.toBe(true);

  });

  // Write a test case for when an error occurs in chrome.storage.local.set
  test('should handle errors that occur in chrome.storage.local.set', async () => {
    // Mock the chrome.storage.local.set function to throw an error
    chrome.storage.local.set.mockImplementationOnce((data, callback) => {
      if (!chrome.runtime) {
        chrome.runtime = {};
      } 
      chrome.runtime.lastError = new Error('Error');
      callback();
    });

    // Call the saveValue function with a specific key and value
    expect(await pearlstorage.saveValue('key', 'value')).toEqual(false);
  });

});

// Test suite for migrateV3 function
describe('migrateV3', () => {
  beforeEach(() => {
    setup_mocks();
    jest.clearAllMocks();
  });

  // Test case for migrating key value row from v2 to v3
  test('should migrate key value row from v2 to v3', async () => {

    global.logError = jest.fn()
    
    // Mock the chrome.storage.local.set that will result from internal saveValue calls that should return true
    chrome.storage.local.set
    .mockImplementation((data, callback) => {
      callback();
    })

    // Define behavior if needed
    logError.mockImplementation(() => console.log('logError was called'));

    // Call the migrateV3 function
    expect(await pearlstorage.migrateV3('{ "key": "value" }')).toEqual(true);

    // Assert it was called as expected in your tests
    expect(logError).toHaveBeenCalledTimes(0);
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(2);
  });

  // Test case for handling errors during migration
  test('should handle errors during migration', async () => {

    global.logError = jest.fn()
    
    // Mock the chrome.storage.local.set function to throw an error
    chrome.storage.local.set.mockImplementationOnce((data, callback) => {
      if (!chrome.runtime) {
        chrome.runtime = {};
      } 
      chrome.runtime.lastError = new Error('Error');
      callback();
    });

    // Define behavior if needed
    logError.mockImplementation(() => console.log('logError was called'));

    // Call the migrateV3 function
    expect(await pearlstorage.migrateV3('{ "key": "value" }')).toEqual(false);

    // Assert it was called as expected in your tests
    expect(logError).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
  });
});

// Test suite for getAllValuesJSON function
describe('getAllValuesJSON', () => {
  beforeEach(() => {
    setup_mocks();
    jest.clearAllMocks();
  });

  // Test case for getting all values from localStorage
  test('should return all values from localStorage as JSON', () => {
    // Mock the localStorage.length to return a specific value 
    localStorage.length = 1;
    localStorage.key = jest.fn().mockReturnValue('key');
    localStorage.getItem = jest.fn().mockReturnValue('value');

    // Call the getAllValuesJSON function
    expect(pearlstorage.getAllValuesJSON()).toEqual('{"key":"value"}');
  });
});

// Test suite for loadAllValuesJSON function
describe('loadAllValuesJSON', () => {
  beforeEach(() => {
    setup_mocks();
    jest.clearAllMocks();
  });

  // Test case for loading all values from a JSON text and saving them
  test('should load all values from a JSON text and save them', () => {

    // Call the loadAllValuesJSON function with a specific JSON text
    pearlstorage.loadAllValuesJSON('{"key":"value"}');

    // Assert that the saveValue function was called with the expected key and value
    expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value');
  });
});

// Test suite for getAllValuesJSON_local function
describe('getAllValuesJSON_local', () => {
  beforeEach(() => {
    setup_mocks();
    jest.clearAllMocks();
  });

  // Test case for getting all values from chrome.storage.local
  test('should return all values from chrome.storage.local as JSON', async () => {
    // Mock the chrome.storage.local.get function to return a specific value
    chrome.storage.local.get.mockImplementationOnce((key, callback) => {
      callback({ ['key']: 'value' });
    });

    // Call the getAllValuesJSON_local function
    expect(await pearlstorage.getAllValuesJSON_local()).toEqual('{"key":"value"}');

  });
});

// Test suite for loadAllValuesJSON_local function
describe('loadAllValuesJSON_local', () => {
  beforeEach(() => {
    setup_mocks();
    jest.clearAllMocks();
  });

  // Test case for loading all values from a JSON text and saving them to chrome.storage.local
  test('should load all values from a JSON text and save them to chrome.storage.local', async () => {
    // Call the loadAllValuesJSON_local function with a specific JSON text
    await pearlstorage.loadAllValuesJSON_local('{"key":"value"}');

    // Assert that the saveValue function was called with the expected key and value
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ 'key': 'value' });
  });
});

// Run the test suite
// ...