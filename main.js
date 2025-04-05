const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const ReleaseUpdater = require('./release_updater');

// 개발 모드에서 자동 리로드 활성화
try {
    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
} catch (_) { console.log('Error'); }

let mainWindow;

// 자동 업데이트 설정
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// 환경 변수에서 GitHub 정보 가져오기
const owner = process.env.GITHUB_OWNER || 'bnam91';
const repo = process.env.GITHUB_REPO || 'gogoya02';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 개발자 도구 자동으로 열기
    mainWindow.webContents.openDevTools();

    // 전체화면으로 시작
    mainWindow.maximize();
    mainWindow.loadFile('index.html');

    // 개발자 도구 열기 (F12)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            mainWindow.webContents.toggleDevTools();
        }
        // 새로고침 (F5)
        if (input.key === 'F5') {
            mainWindow.reload();
        }
    });
}

// 업데이트 이벤트 핸들러
autoUpdater.on('checking-for-update', () => {
    console.log('업데이트 확인 중...');
});

autoUpdater.on('update-available', (info) => {
    console.log('새로운 업데이트가 있습니다:', info.version);
});

autoUpdater.on('update-not-available', (info) => {
    console.log('이미 최신 버전입니다.');
});

autoUpdater.on('error', (err) => {
    console.log('업데이트 중 오류 발생:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log('다운로드 진행률:', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('업데이트 다운로드 완료');
    // 업데이트 설치 및 앱 재시작
    autoUpdater.quitAndInstall();
});

// 개발 모드에서 Git 업데이트 확인
async function checkGitUpdate() {
    const updater = new ReleaseUpdater(owner, repo);
    const updateResult = await updater.updateToLatest();
    
    if (updateResult) {
        const currentVersion = updater.getCurrentVersion();
        const latestRelease = await updater.getLatestRelease();
        
        if (currentVersion !== latestRelease.tag_name) {
            const result = await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '업데이트 완료',
                message: '새로운 버전이 설치되었습니다. 앱을 재시작하시겠습니까?',
                buttons: ['예', '아니오']
            });
            
            if (result.response === 0) {
                app.relaunch();
                app.quit();
            }
        }
    }
}

app.whenReady().then(async () => {
    createWindow();
    
    // 개발 모드인 경우 Git 업데이트 확인
    if (process.env.NODE_ENV === 'development') {
        await checkGitUpdate();
    } else {
        // 프로덕션 모드에서는 electron-updater 사용
        autoUpdater.checkForUpdates();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}); 