const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db'); // Import the database module

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 450,
        height: 700,
        resizable: false,
        maximizable: false, 
        fullscreenable: false,
    
        webPreferences: {
        preload: path.join(__dirname, 'preload.js'), // Specify the path to the preload script
        contextIsolation: true, // Enable context isolation for security
        nodeIntegration: false, // Disable Node.js integration for security
    }
});

    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}


ipcMain.handle('depenses:get-all', () => {
    return db.getAllTransactions();
}
);

ipcMain.handle('depenses:add', (event, depense) => {
    return db.addTransaction(depense);
});

ipcMain.handle('depenses:delete', (event, id) => {
    return db.deleteTransaction(id);
});

ipcMain.handle('depenses:delete-all', () => {
    return db.deleteAllTransactions();
});

ipcMain.handle('settings:get', (event, key) => {
    return db.getSetting(key);
});

ipcMain.handle('settings:set', (event, key, value) => {
    return db.setSetting(key, value);
});


async function startApp() {
    try {
        await app.whenReady();
        createWindow();
    } catch (error) {
        console.error('Error starting the application:', error);
    }
}

 startApp();