export class DmModal {
    constructor() {
        this.modal = null;
        this.brandInput = null;
        this.itemInput = null;
        this.init();
    }

    init() {
        // 모달 HTML 생성
        const modalHTML = `
            <div id="dm-modal" class="modal">
                <div class="modal-content">
                    <h3>컨택하기</h3>
                    <div class="modal-buttons">
                        <div class="sheet-buttons-row">
                            <button class="modal-button sheet-button">
                                <i class="fas fa-users"></i> DM 인원시트
                            </button>
                            <button class="modal-button template-button">
                                <i class="fas fa-file-alt"></i> DM 템플릿
                            </button>
                        </div>
                    </div>
                    <div class="modal-input-group">
                        <label for="brand-input">브랜드</label>
                        <input type="text" id="brand-input" placeholder="브랜드명을 입력하세요">
                    </div>
                    <div class="modal-input-group">
                        <label for="item-input">아이템</label>
                        <input type="text" id="item-input" placeholder="아이템명을 입력하세요">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button upload-button">인원 업로드 하기</button>
                        <button class="modal-button cancel">취소</button>
                    </div>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 모달 요소 참조
        this.modal = document.getElementById('dm-modal');
        this.brandInput = document.getElementById('brand-input');
        this.itemInput = document.getElementById('item-input');

        // 인원 업로드 이벤트
        this.uploadButton = document.querySelector('.upload-button');
        this.uploadButton.addEventListener('click', this.upload);

        // 취소 버튼 이벤트
        this.cancelButton = document.querySelector('.cancel');
        this.cancelButton.addEventListener('click', this.close);

        // 시트 버튼 이벤트
        this.sheetButton = document.querySelector('.sheet-button');
        this.sheetButton.addEventListener('click', this.openDmSheet);   

        // 템플릿 버튼 이벤트
        this.templateButton = document.querySelector('.template-button');
        this.templateButton.addEventListener('click', this.openTemplateSheet);
    }

    open = () => {
        this.modal.style.display = 'block';
    }
    
    close = () => {
        this.modal.style.display = 'none';
        this.brandInput.value = '';
        this.itemInput.value = '';
    }

    openDmSheet = () => {
        window.open('https://docs.google.com/spreadsheets/d/1VhEWeQASyv02knIghpcccYLgWfJCe2ylUnPsQ_-KNAI/edit?gid=1878271662#gid=1878271662', '_blank');
    }

    openTemplateSheet = () => {
        window.open('https://docs.google.com/spreadsheets/d/1mwZ37jiEGK7rQnLWp87yUQZHyM6LHb4q6mbB0A07fI0/edit?gid=1722323555#gid=1722323555', '_blank');
    }

    upload = async () => {
        try {
            // 로딩 상태 표시
            const uploadButton = document.querySelector('.upload-button');
            const originalText = uploadButton.innerHTML;
            uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 업로드 중...';
            uploadButton.disabled = true;

            // 브랜드와 아이템 정보 가져오기
            const brand = this.getBrand();
            const item = this.getItem();

            if (!brand || !item) {
                alert('브랜드와 아이템명을 모두 입력해주세요.');
                uploadButton.innerHTML = originalText;
                uploadButton.disabled = false;
                return;
            }

            // 선택된 인플루언서 정보 가져오기
            const selectedInfluencers = [];
            const rows = document.querySelectorAll('#seller-match-center-content .influencer-table tbody tr');
            
            if (!rows || rows.length === 0) {
                alert('선택된 인플루언서가 없습니다.');
                uploadButton.innerHTML = originalText;
                uploadButton.disabled = false;
                return;
            }
            
            // 각 행에서 인플루언서 정보 추출
            rows.forEach(row => {
                const cleanName = row.dataset.cleanName;
                const influencerId = row.dataset.influencerId;
                
                // username 추출 방법 개선
                // username(사용자명)과 clean_name(이름)은 합쳐서 influencerId로 저장되어 있음
                // influencerId 형식: username_clean_name 
                // 사용자명에 언더스코어가 포함될 수 있으므로 마지막 언더스코어를 기준으로 분리
                const lastUnderscoreIndex = influencerId.lastIndexOf('_');
                const username = lastUnderscoreIndex !== -1 ? 
                    influencerId.substring(0, lastUnderscoreIndex) : influencerId;
                
                // 로그 추가
                console.log(`추출된 정보 - influencerId: ${influencerId}, username: ${username}, cleanName: ${cleanName}`);
                
                const nameCols = row.querySelectorAll('.name-username');
                const nameText = nameCols.length > 0 ? nameCols[0].textContent : '';
                
                const categoryCols = row.querySelectorAll('.category');
                const categoryText = categoryCols.length > 0 ? 
                    categoryCols[0].textContent.replace(/\(\d+%\)/g, '').trim() : '';
                
                const reelsViewsCols = row.querySelectorAll('.reels-views');
                const reelsViewsText = reelsViewsCols.length > 0 ? reelsViewsCols[0].textContent : '0';
                
                const contactMethodCols = row.querySelectorAll('.contact-method');
                const contactMethodText = contactMethodCols.length > 0 ? contactMethodCols[0].textContent : '';
                
                selectedInfluencers.push({
                    name: cleanName,
                    username: username,
                    fullNameUsername: nameText,
                    category: categoryText,
                    reelsViews: reelsViewsText,
                    contactMethod: contactMethodText
                });
            });
            
            /*
            // Google API 직접 사용하기
            const { google } = require('googleapis');
            
            // 저장된 자격 증명 정보 (token.json) 직접 로드
            const fs = window.fs;
            const os = require('os');
            const path = window.path;
            
            // 프로젝트 루트 상대 경로 생성 (일렉트론 앱에서의 상대 경로)
            let tokenPath;
            if (process.platform === 'win32') {
                tokenPath = path.join(process.env.APPDATA, 'GoogleAPI', 'token.json');
            } else {
                tokenPath = path.join(os.homedir(), '.config', 'GoogleAPI', 'token.json');
            }
            
            // 토큰 읽기
            const credToken = fs.existsSync(tokenPath) ? JSON.parse(fs.readFileSync(tokenPath)) : null;
            if (!credToken) {
                alert('인증 토큰이 없습니다. 먼저 인증을 완료해주세요.');
                uploadButton.innerHTML = originalText;
                uploadButton.disabled = false;
                return;
            }
            
            // credentials_token.js 파일에서 클라이언트 정보 읽기
            // 절대 경로로 직접 접근
            // const credentialsTokenPath = 'C:/Users/신현빈/Desktop/github/gogoya02/token/credentials_token.js';
            const credentialsTokenPath = './token/credentials_token.js';
            const credentialsModule = require(credentialsTokenPath);
            const CLIENT_ID = credentialsModule.installed.client_id;
            const CLIENT_SECRET = credentialsModule.installed.client_secret;

            // OAuth 클라이언트 생성 및 인증 정보 설정
            const { OAuth2Client } = require('google-auth-library');
            const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
            oAuth2Client.setCredentials(credToken);
            
            // Google Sheets API 클라이언트 생성
            const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
            
            // 현재 날짜 생성
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            
            // spreadsheetId 및 테스트 시트 설정
            const spreadsheetId = '1VhEWeQASyv02knIghpcccYLgWfJCe2ylUnPsQ_-KNAI';
            const range = 'contact!A2:H';  // contact 시트의 A2-H 열 범위 (2행부터 시작)
            
            // 업로드할 데이터 구성
            const values = selectedInfluencers.map(influencer => [
                `https://www.instagram.com/${influencer.username}`,  // A열 - Instagram 프로필 URL
                influencer.name,          // B열 - 이름 (clean_name)
                '',                       // C열 - 빈값
                '',                       // D열 - 빈값
                brand,                    // E열 - 브랜드명
                item,                     // F열 - 아이템명
                `${dateStr} ${timeStr}`,  // G열 - 날짜와 시간
                influencer.contactMethod  // H열 - 연락방법
            ]);
            
            // 데이터 추가 (append)
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values
                }
            });
            
            // 업로드 완료 메시지
            alert(`${selectedInfluencers.length}명의 인플루언서 정보가 성공적으로 업로드되었습니다.`);
            this.close();
            */
            const result = await window.googleSheetApi.uploadInfluencerData({
                brand,
                item,
                selectedInfluencers
              });
              
              if (result.success) {
                alert(`${result.count}명의 인플루언서 정보가 성공적으로 업로드되었습니다.`);
                this.close();
              }
            
            // 버튼 원상 복구
            uploadButton.innerHTML = originalText;
            uploadButton.disabled = false;
            
            console.log('업로드 완료:', response.data);
            
        } catch (error) {
            console.error('업로드 중 오류 발생:', error);
            alert('업로드 중 오류가 발생했습니다: ' + error.message);
            document.querySelector('.upload-button').innerHTML = '인원 업로드 하기';
            document.querySelector('.upload-button').disabled = false;
        }
    }

    getBrand = () => {
        return this.brandInput.value.trim();
    }

    getItem = () => {
        return this.itemInput.value.trim();
    }
}

// 전역 인스턴스 생성
//window.dmModal = new DmModal(); 