const { contextBridge, ipcRenderer } = require('electron');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Gmail 인증 모듈 로드
const gmailAuth = require('./src/js/vendor_request/gmailAuth');

// 안전하게 노출할 API 설정
contextBridge.exposeInMainWorld('electronAPI', {
    getGmailCredentials: gmailAuth.getGmailCredentials,
    google: google,
    path: {
        join: (...args) => path.join(...args),
        resolve: (path) => path.resolve(path),
        basename: (path) => path.basename(path),
        isAbsolute: (path) => path.isAbsolute(path)
    },
    fs: {
        existsSync: (path) => fs.existsSync(path),
        readFileSync: (path, options) => fs.readFileSync(path, options),
        writeFileSync: (path, data, options) => fs.writeFileSync(path, data, options)
    }
}); 