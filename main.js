/*
메인 프로세스 파일
*/
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import updater from 'electron-updater';
import ReleaseUpdater from './release_updater.js';
import path from 'path';
const { autoUpdater } = updater;
import {
    getBrandContactData, getBrandPhoneData, saveCallRecord,
    getCallRecords, getLatestCallRecordByCardId, updateBrandInfo,
    updateCallRecord, getCallRecordById, getMongoClient, updateNextStep
} from './src/js/databases/mongo.js'; // Electron Main 프로세스에서 연결
import { fileURLToPath } from 'url';
import { makeCall, endCall } from './src/js/utils/phone.js';
//const fs = require('fs');
import fs from 'fs';
import { config } from './src/js/config/config.js';
import os from 'os';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getGmailAuthUrl } from './src/gmailAuth.js';
let authInstance; // 전역에 저장
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

// __dirname 직접 생성
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================================
// ipcMain 핸들러 등록
// 렌더러 프로세스가 'brand-contact-data-request'라는 채널로 요청할 때
// MongoDB 데이터 조회 후 응답을 돌려준다
// ===========================================
ipcMain.handle('brand-contact-data-request', async (event, filters) => {
    
    try {
        const { skip = 0, limit = 20, ...otherFilters } = filters;
        const result = await getBrandContactData(skip, limit, otherFilters);
        return result;
    } catch (error) {
        console.error('brand-contact-data-request 처리 중 오류 발생:', error);
        throw error;
    }
});
ipcMain.handle('brand-phone-data-request', async (event, brandName) => {
    return await getBrandPhoneData(brandName);
});

ipcMain.handle('latest-call-record-request', async (event, cardId) => {
    return await getLatestCallRecordByCardId(cardId);
});

ipcMain.handle('call-record-by-id-request', async (event, recordId) => {
    return await getCallRecordById(recordId);
});

ipcMain.handle('save-call-record-request', async (event, callRecord) => {
    return await saveCallRecord(callRecord);
});

ipcMain.handle('update-brand-info-request', async (event, brandName, updateData) => {
    return await updateBrandInfo(brandName, updateData);
});

ipcMain.handle('update-card-next-step-request', async (event, recordId, newNextStep) => {
    return await updateCardNextStep(recordId, newNextStep);
});

ipcMain.handle('update-call-record-request', async (event, recordId, updateData) => {

    if (!recordId) {
        throw new Error('❌ recordId가 없습니다!');
    }

    return await updateCallRecord(recordId, updateData);
});

ipcMain.handle('fetch-call-records-request', async (event, brandName) => {
    return await getCallRecords(brandName);
});


ipcMain.handle('call-phone-request', async (event, phoneNumber) => {
    try {
        const result = await makeCall(phoneNumber);
        return result;
    } catch (error) {
        console.error('전화 연결 실패:', error);
        throw error;
    }
});

ipcMain.handle('end-call-request', async (event) => {
    try {
        const result = await endCall();
        return result;
    } catch (error) {
        console.error('전화 종료 실패:', error);
        throw error;
    }
});

ipcMain.handle('dashboard-proposal-request', async () => {
    try {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.callRecords);

        const proposalRequests = await collection.find({ nextstep: "제안서 요청" }).toArray();
        return proposalRequests;
    } catch (error) {
        console.error('Dashboard proposal data fetch error:', error);
        throw error;
    }
});

ipcMain.handle('fetch-brand-email-request', async (event, brandName) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.vendorBrandInfo);
    const brandInfo = await collection.findOne({ brand_name: brandName });
    return brandInfo?.email || '';
});

ipcMain.handle('update-nextstep-request', async (event, brandName, newStatus) => {
    try {
        const result = await updateNextStep(brandName, newStatus);
        return result;
    } catch (error) {
        console.error('updateNextStep 에러:', error);
        throw error;
    }
});

// 셀러매칭 탭 인플루언서 데이터 조회
ipcMain.handle('fetch-influencer-data-for-seller-match', async () => {
    try {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.influencerData);

        const pipeline = [
            {
                "$match": {
                    "reels_views(15)": { "$exists": true, "$ne": "" },
                    "is_contact_excluded": { "$ne": true }
                }
            },
            {
                "$addFields": {
                    "reels_views_num": {
                        "$cond": {
                            "if": { "$eq": ["$reels_views(15)", "-"] },
                            "then": 0,
                            "else": { "$toInt": "$reels_views(15)" }
                        }
                    }
                }
            },
            {
                "$sort": { "reels_views_num": -1 }
            },
            {
                "$project": {
                    "username": 1,
                    "clean_name": 1,
                    "category": 1,
                    "profile_link": 1,
                    "reels_views": "$reels_views(15)",
                    "reels_views_num": 1,
                    "contact_method": 1
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        return results;
    } catch (error) {
        console.error("📦 인플루언서 데이터 fetch 실패:", error);
        throw error;
    }
});

// 셀러분석 탭 인플루언서 데이터 조회
ipcMain.handle('fetch-influencer-data-for-seller-analysis', async () => {
    try {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.influencerData);

        const pipeline = [
            {
                "$match": {
                    "reels_views(15)": { "$exists": true, "$ne": "" }
                }
            },
            {
                "$addFields": {
                    "reels_views_num": {
                        "$cond": {
                            "if": { "$eq": ["$reels_views(15)", "-"] },
                            "then": 0,
                            "else": { "$toInt": "$reels_views(15)" }
                        }
                    },
                    "followers_num": {
                        "$cond": {
                            "if": { "$eq": ["$followers", "-"] },
                            "then": 0,
                            "else": { "$toInt": "$followers" }
                        }
                    }
                }
            },
            {
                "$sort": { "reels_views_num": -1 }
            },
            {
                "$project": {
                    "username": 1,
                    "clean_name": 1,
                    "category": 1,
                    "followers": 1,
                    "grade": 1,
                    "reels_views": "$reels_views(15)",
                    "profile_link": 1,
                    "followers_num": 1,
                    "reels_views_num": 1,
                    "tags": 1
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        return results;
    } catch (error) {
        console.error("📦 인플루언서 데이터 fetch 실패:", error);
        throw error;
    }
});
// 인플루언서 데이터 업로드
ipcMain.handle('upload-influencer-data', async (event, payload) => {
    try {
        const { brand, item, selectedInfluencers } = payload;

        // 토큰 경로
        const tokenPath = process.platform === 'win32'
            ? path.join(process.env.APPDATA, 'GoogleAPI', 'token.json')
            : path.join(os.homedir(), '.config', 'GoogleAPI', 'token.json');

        if (!fs.existsSync(tokenPath)) {
            throw new Error('토큰 파일이 존재하지 않습니다.');
        }

        const credToken = JSON.parse(fs.readFileSync(tokenPath));
        const credentials = await import(`file://${__dirname}/token/credentials_token.js`);
        const { client_id, client_secret } = credentials.default.installed;

        const oAuth2Client = new OAuth2Client(client_id, client_secret);
        oAuth2Client.setCredentials(credToken);

        const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const values = selectedInfluencers.map(influencer => [
            `https://www.instagram.com/${influencer.username}`,
            influencer.name,
            '',
            '',
            brand,
            item,
            `${dateStr} ${timeStr}`,
            influencer.contactMethod
        ]);

        const spreadsheetId = '1VhEWeQASyv02knIghpcccYLgWfJCe2ylUnPsQ_-KNAI';
        const range = 'contact!A2:H';

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        return { success: true, count: values.length };
    } catch (err) {
        console.error('Google Sheet 업로드 실패:', err);
        throw err;
    }
});

ipcMain.handle('get-influencer-info', async (event, username) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.influencerData);
    const influencer = await collection.findOne({ username });
    return influencer;
});

ipcMain.handle('save-file', async (event, { defaultPath, content }) => {
    const { filePath } = await dialog.showSaveDialog({
        title: '엑셀 파일 저장',
        defaultPath: defaultPath,
        filters: [
            { name: 'CSV 파일', extensions: ['csv'] }
        ]
    });

    if (filePath) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return filePath;
    }
    return null;
});

// 인플루언서 태그 저장
ipcMain.handle('save-influencer-tags', async (event, { username, tags }) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.influencerData);

    return await collection.updateOne(
        { username },
        { $set: { tags } },
        { upsert: true }
    );
});

// 인플루언서 연락처 정보 저장
ipcMain.handle('save-influencer-contact', async (event, { username, method, info, excluded, reason }) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.influencerData);

    return await collection.updateOne(
        { username },
        {
            $set: {
                contact_method: method,
                contact_info: info,
                is_contact_excluded: excluded,
                exclusion_reason: reason
            }
        },
        { upsert: true }
    );
});

// 스크리닝 탭 데이터 조회
ipcMain.handle('fetch-screening-data', async () => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.mainItemTodayData);

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 25);

    const data = await collection.find({
        crawl_date: { $gte: twentyDaysAgo },
        brand: { $ne: '확인필요' }
    })
        .sort({ crawl_date: -1 })
        .toArray();

    return data;
});

// 스크리닝 탭 인플루언서 데이터 조회
ipcMain.handle('fetch-influencer-data', async (event, cleanName) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.influencerData);

    const influencer = await collection.findOne(
        { clean_name: cleanName },
        { projection: { "reels_views(15)": 1, grade: 1 } }
    );

    return influencer || null;
});

ipcMain.handle('fetch-item-details', async (event, { brandName, itemName }) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.mainItemTodayData);

    const data = await collection.find({
        brand: brandName,
        item: itemName
    }).toArray();

    return data;
});

ipcMain.handle('fetch-influencer-views', async (event, cleanNameList) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.influencerData);

    const data = await collection
        .find({ clean_name: { $in: cleanNameList } })
        .project({ "clean_name": 1, "reels_views(15)": 1 })
        .toArray();

    return data;
});

// Gmail 메일 보내기 IPC 핸들러
ipcMain.handle('send-gmail', async (event, { mailOptions }) => {
    try {
        if (!authInstance) throw new Error('Gmail 인증이 완료되지 않았습니다.');

        const response = await sendGmail(authInstance, mailOptions);
        return { success: true, id: response.id };
    } catch (error) {
        console.error('Gmail 전송 실패:', error);
        throw error;
    }
});

ipcMain.handle('start-gmail-auth', async (event, { accountId, credentialsPath }) => {
    const { auth, authUrl } = await getGmailAuthUrl(accountId, credentialsPath);
    authInstance = auth;

    // 브라우저에서 인증 링크 열기
    shell.openExternal(authUrl);
    return true;
});

ipcMain.handle('send-auth-code', async (event, code) => {
    const { tokens } = await authInstance.getToken(code);
    authInstance.setCredentials(tokens);

    // 인증을 요청했던 accountId를 기억해야 경로 지정 가능
    const tokenPath = getTokenPath(authInstance.accountId); // 또는 따로 저장해 둬야 함
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    return true;
});

ipcMain.handle('fetch-brand-verification-status', async (event, allBrands) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const brandInfoCollection = db.collection(config.database.collections.brandInfoCollection);
    const brandInfos = await brandInfoCollection.find(
        { brand_name: { $in: allBrands } },
        { projection: { brand_name: 1, is_verified: 1 } }
    ).toArray();
    
    // 브랜드별 is_verified 상태를 Map으로 변환
    const brandVerificationMap = new Map(
        brandInfos.map(info => [info.brand_name, info.is_verified])
    );

    return brandVerificationMap;
}); 

ipcMain.handle('update-brand-verification', async (event, { brandName, verificationStatus }) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.brandInfoCollection);

    return await collection.updateOne(
        { brand_name: brandName },
        { $set: { is_verified: verificationStatus } }
    );
});

ipcMain.handle('fetch-influencer-data-many', async (event, cleanNameList) => {
    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.influencerData);   

    const data = await collection
        .find({ clean_name: { $in: cleanNameList } })
        .project({ "clean_name": 1, "reels_views(15)": 1, grade: 1 })
        .toArray();

    return data;
});

ipcMain.handle('get-dm-records', async (event, cleanName) => {

    const client = await getMongoClient();
    const db = client.db(config.database.name);
    const collection = db.collection(config.database.collections.dmRecords);

    const records = await collection.find({
        influencer_name: cleanName,
        status: { $ne: 'failed' }
    })
    .sort({ dm_date: -1 }) // 최신순 정렬
    .toArray();

    return records;
});

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