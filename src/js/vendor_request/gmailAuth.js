const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { shell } = require('electron');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

function getTokenPath(accountId) {
    const tokenDir = process.platform === 'win32' 
        ? path.join(process.env.APPDATA, 'GoogleAPI')
        : path.join(process.env.HOME, '.config', 'GoogleAPI');
    
    if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
    }
    
    return path.join(tokenDir, `gmail_token_${accountId}.json`);
}

function createAuthCodeModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div id="auth-code-modal" class="modal" style="display: block; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.4);">
                <div class="modal-content" style="background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 500px;">
                    <h3>인증 URL 입력</h3>
                    <p>브라우저에서 리다이렉트된 전체 URL을 붙여넣어주세요.</p>
                    <input type="text" id="auth-code-input" style="width: 100%; padding: 8px; margin: 10px 0;" placeholder="http://localhost/?code=... 형식의 URL을 붙여넣으세요">
                    <div style="text-align: right; margin-top: 15px;">
                        <button id="auth-code-submit" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; cursor: pointer;">확인</button>
                    </div>
                </div>
            </div>
        `;
        
        // 기존 모달이 있다면 제거
        const existingModal = document.getElementById('auth-code-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 새 모달 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('auth-code-modal');
        const input = document.getElementById('auth-code-input');
        const submitButton = document.getElementById('auth-code-submit');
        
        // URL에서 코드 추출 함수
        const extractCodeFromUrl = (url) => {
            try {
                const urlObj = new URL(url);
                return urlObj.searchParams.get('code');
            } catch (e) {
                // URL이 아닌 경우 입력값 그대로 반환
                return url;
            }
        };
        
        submitButton.addEventListener('click', () => {
            const inputValue = input.value.trim();
            const code = extractCodeFromUrl(inputValue);
            if (code) {
                modal.remove();
                resolve(code);
            }
        });
        
        // Enter 키 이벤트 처리
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const inputValue = input.value.trim();
                const code = extractCodeFromUrl(inputValue);
                if (code) {
                    modal.remove();
                    resolve(code);
                }
            }
        });
    });
}

async function getGmailCredentials(accountId, credentialsPath) {
    const tokenPath = getTokenPath(accountId);
    let credentials;

    if (fs.existsSync(tokenPath)) {
        credentials = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }

    // 자격 증명 파일 경로를 절대 경로로 변환
    const absoluteCredentialsPath = path.resolve(process.cwd(), credentialsPath);
    console.log('자격 증명 파일 경로:', absoluteCredentialsPath);

    if (!fs.existsSync(absoluteCredentialsPath)) {
        throw new Error(`자격 증명 파일을 찾을 수 없습니다: ${absoluteCredentialsPath}`);
    }

    const credentialsFile = require(absoluteCredentialsPath);
    const { client_id, client_secret, redirect_uris } = credentialsFile.installed;

    if (!client_id || !client_secret) {
        throw new Error('자격 증명 파일에 client_id 또는 client_secret이 없습니다.');
    }

    const auth = new google.auth.OAuth2(
        client_id,
        client_secret,
        'http://localhost'
    );

    if (credentials?.refresh_token) {
        auth.setCredentials(credentials);
    } else {
        const authUrl = auth.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        // 브라우저로 인증 URL 열기
        shell.openExternal(authUrl);
        console.log('브라우저에서 인증을 진행해주세요.');
        
        // 커스텀 모달을 통해 인증 코드 입력받기
        const code = await createAuthCodeModal();
        
        if (!code) {
            throw new Error('인증 코드가 입력되지 않았습니다.');
        }

        const { tokens } = await auth.getToken(code);
        auth.setCredentials(tokens);
        
        fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    }

    return auth;
}

module.exports = {
    getGmailCredentials
}; 