/*
메인 프로세스 파일
*/
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import updater from 'electron-updater';
import ReleaseUpdater from './release_updater.js';
import path from 'path';
const { autoUpdater } = updater;
import {     getMongoData,
    getVendorData,
    getBrandPhoneData,
    saveCallRecord,
    getCallRecords,
    getLatestCallRecordByCardId,
    updateBrandInfo,
    updateCallRecord,
    getCallRecordById} from './src/js/databases/mongo.js'; // Electron Main 프로세스에서 연결
import { fileURLToPath } from 'url';
import { makeCall, endCall } from './src/js/utils/phone.js';

// 인코딩 설정
process.env.CHARSET = 'UTF-8';
process.env.LANG = 'ko_KR.UTF-8';

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

// 개발 모드 확인
const isDev = process.env.NODE_ENV === 'development';
console.log('현재 모드:', isDev ? '개발 모드' : '프로덕션 모드');

// ===========================================
// ipcMain 핸들러 등록
// 렌더러 프로세스가 'vendor-data-request'라는 채널로 요청할 때
// MongoDB 데이터 조회 후 응답을 돌려준다
// ===========================================
ipcMain.handle('vendor-data-request', async (event, filters) => {
    console.log('📦 vendor-data-request 호출', filters);
    try {
      const { skip = 0, limit = 20, ...otherFilters } = filters;
      const result = await getVendorData(skip, limit, otherFilters);
      return result;
    } catch (error) {
      console.error('vendor-data-request 처리 중 오류 발생:', error);
      throw error;
    }
  });
ipcMain.handle('brand-phone-data-request', async (event, brandName) => {
    console.log('📦 brand-phone-data-request 호출', brandName);
    return await getBrandPhoneData(brandName);
});

ipcMain.handle('latest-call-record-request', async (event, cardId) => {
    console.log('📦 latest-call-record-request 호출', cardId);
    return await getLatestCallRecordByCardId(cardId);
});

ipcMain.handle('call-record-by-id-request', async (event, recordId) => {
    console.log('📦 call-record-by-id-request 호출', recordId);
    return await getCallRecordById(recordId);
});

ipcMain.handle('save-call-record-request', async (event, callRecord) => {
    console.log('📦 save-call-record-request 호출', callRecord);
    return await saveCallRecord(callRecord);
});

ipcMain.handle('update-brand-info-request', async (event, brandName, updateData) => {
    console.log('📦 update-brand-info-request 호출', brandName, updateData);
    return await updateBrandInfo(brandName, updateData);
});

ipcMain.handle('update-card-next-step-request', async (event, recordId, newNextStep) => {
    console.log('📦 update-card-next-step-request 호출', recordId, newNextStep);
    return await updateCardNextStep(recordId, newNextStep);
});

ipcMain.handle('update-call-record-request', async (event, recordId, updateData) => {
    console.log('📦 update-call-record-request 호출', recordId, updateData);

    if (!recordId) {
        throw new Error('❌ recordId가 없습니다!');
    }

    return await updateCallRecord(recordId, updateData);
});

ipcMain.handle('fetch-call-records-request', async (event, brandName) => {
    console.log('📦 fetch-call-records-request 호출', brandName);
    return await getCallRecords(brandName);
});

ipcMain.handle('call-phone-request', async (event, phoneNumber) => {
    try {
      console.log('📞 전화 연결 시도:', phoneNumber);
      const result = await makeCall(phoneNumber);
      return result;
    } catch (error) {
      console.error('전화 연결 실패:', error);
      throw error;
    }
  });

ipcMain.handle('end-call-request', async (event) => {
    try {
      console.log('📞 전화 종료 시도');
      const result = await endCall();
      return result;
    } catch (error) {
      console.error('전화 종료 실패:', error);
      throw error;
    }
  });

// __dirname 직접 생성
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================================
// Electron 앱 윈도우 생성
// ===========================================
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'), // 여기에 안전한 통신용 preload 스크립트
            //nodeIntegration: true,
            //ontextIsolation: false
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // 개발자 도구 자동으로 열기
    mainWindow.webContents.openDevTools();

    // 전체화면으로 시작
    mainWindow.maximize();
    mainWindow.loadFile('index.html');

    // 모든 외부 링크를 기본 브라우저에서 열도록 설정
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        //require('electron').shell.openExternal(url);
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // 모든 링크 클릭 이벤트 처리
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('http')) {
            event.preventDefault();
            //require('electron').shell.openExternal(url);
            shell.openExternal(url);
        }
    });

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
    console.log('Git 업데이트 확인 시작...');
    const updater = new ReleaseUpdater(owner, repo);
    
    try {
        console.log('현재 버전 확인 중...');
        const currentVersion = updater.getCurrentVersion();
        console.log('현재 버전:', currentVersion);
        
        console.log('최신 릴리즈 확인 중...');
        const latestRelease = await updater.getLatestRelease();
        console.log('최신 릴리즈:', latestRelease);
        
        const updateResult = await updater.updateToLatest();
        console.log('업데이트 결과:', updateResult);
        
        if (updateResult) {
            const newVersion = updater.getCurrentVersion();
            console.log('업데이트 후 버전:', newVersion);
            
            if (currentVersion !== newVersion) {
                console.log('새로운 버전이 설치되었습니다.');
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
    } catch (error) {
        console.error('Git 업데이트 중 오류 발생:', error);
    }
}

// ===========================================
// 앱 준비 완료되면 창 띄우기
// ===========================================
app.whenReady().then(async () => {
    console.log('앱 시작...');
    createWindow();
    
    // 개발 모드인 경우 Git 업데이트 확인
    if (isDev) {
        console.log('개발 모드에서 Git 업데이트 확인 시작');
        await checkGitUpdate();
    } else {
        console.log('프로덕션 모드에서 electron-updater 시작');
        autoUpdater.checkForUpdates();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// ===========================================
// 모든 창이 닫혔을 때 앱 종료
// ===========================================
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}); 