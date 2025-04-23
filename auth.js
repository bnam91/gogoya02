const fs = require('fs');
const path = require('path');
const os = require('os');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Google API 접근 범위 설정 (필요한 최소한의 범위만 포함)
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/calendar'
];

// 환경 변수에서 클라이언트 정보 가져오기
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getTokenPath() {
  /**
   * 운영 체제에 따른 토큰 저장 경로 반환
   */
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA, 'GoogleAPI', 'token.json');
  }
  return path.join(os.homedir(), '.config', 'GoogleAPI', 'token.json');
}

function ensureTokenDir() {
  /**
   * 토큰 저장 디렉토리가 없으면 생성
   */
  const tokenDir = path.dirname(getTokenPath());
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
}

async function getCredentials() {
  /**
   * OAuth2 인증을 통해 자격 증명 반환
   */
  const tokenPath = getTokenPath();
  ensureTokenDir();

  let creds = null;
  
  // 저장된 토큰이 있으면 로드
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath));
    creds = new OAuth2Client({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
    creds.setCredentials(token);
  }
  
  // 토큰이 없거나 유효하지 않으면 새로 생성
  if (!creds || !isTokenValid(creds)) {
    if (creds && creds.credentials.refresh_token) {
      // 토큰이 만료되었지만 갱신 가능하면 갱신
      try {
        await creds.refreshAccessToken();
      } catch (err) {
        // 갱신 실패 시 새로 인증
        creds = await authenticateWithOAuth();
      }
    } else {
      // 새로 OAuth2 플로우를 통해 인증
      creds = await authenticateWithOAuth();
    }
    
    // 생성된 토큰을 파일에 저장
    fs.writeFileSync(tokenPath, JSON.stringify(creds.credentials));
  }
  
  return creds;
}

function isTokenValid(auth) {
  /**
   * 토큰의 유효성 검사
   */
  if (!auth.credentials.expiry_date) {
    return false;
  }
  
  // 토큰 만료 시간과 현재 시간 비교 (5분 여유 두기)
  return auth.credentials.expiry_date > Date.now() + (5 * 60 * 1000);
}

async function authenticateWithOAuth() {
  /**
   * OAuth2 인증 프로세스 실행
   */
  const oAuth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost'
  );
  
  // 인증 URL 생성
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // 항상 새로운 refresh_token을 받기 위해
  });
  
  console.log('다음 URL에서 인증을 완료하세요:', authUrl);
  
  // 로컬 서버로 리다이렉트되는 코드를 받음
  const code = await getAuthorizationCode();
  
  // 코드로 토큰 얻기
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  return oAuth2Client;
}

async function getAuthorizationCode() {
  /**
   * 로컬 서버를 실행하고 인증 코드를 받음
   */
  const http = require('http');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlParams = url.parse(req.url, true).query;
        
        if (urlParams.code) {
          // 인증 성공 메시지 전송
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>인증이 완료되었습니다. 이 창을 닫아도 됩니다.</h1>');
          
          server.close();
          resolve(urlParams.code);
        } else {
          // 오류 메시지 전송
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>인증에 실패했습니다.</h1>');
          
          server.close();
          reject(new Error('인증 코드를 받지 못했습니다.'));
        }
      } catch (e) {
        reject(e);
      }
    });
    
    server.listen(0, () => {
      const port = server.address().port;
      console.log(`로컬 서버가 포트 ${port}에서 실행 중입니다.`);
    });
  });
}

module.exports = {
  getCredentials
};