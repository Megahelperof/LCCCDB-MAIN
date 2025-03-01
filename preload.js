const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  validateToken: (token) => ipcRenderer.invoke('validate-token', token)
});



contextBridge.exposeInMainWorld(
    'electronAPI', {
        // Generic fetch wrapper that works for ALL your API calls
        fetch: async (endpoint, options = {}) => {
            try {
                const response = await fetch(endpoint, options);
                return await response.json();
            } catch (error) {
                throw error;
            }
        },

        // App update handlers
        onUpdateAvailable: (callback) => ipcRenderer.on('update-message', callback),
        
        // Window controls if needed
        minimize: () => ipcRenderer.send('minimize-window'),
        maximize: () => ipcRenderer.send('maximize-window'),
        close: () => ipcRenderer.send('close-window'),
        getStoredToken: () => ipcRenderer.invoke('get-stored-token'),
        storeToken: (token) => ipcRenderer.invoke('store-token', token),
        reloadWindow: () => ipcRenderer.send('reload-window')
    }
);