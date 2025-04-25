export class ProposalManage {
    static defaultAccounts = [
        { id: "bnam91", name: "고야앤드미디어", email: "bnam91@goyamkt.com" },
        { id: "contant01", name: "박슬하(고야앤드미디어)", email: "contant01@goyamkt.com" },
        { id: "jisu04", name: "김지수(고야앤드미디어)", email: "jisu04@goyamkt.com" }
    ];

    constructor() {
        this.mongo = window.mongo;
        this.brands = []; // 브랜드 데이터 저장용 배열
        this.accounts = null; // 계정 정보를 저장할 변수
        this.mailCache = new Map(); // 브랜드별 메일 내용을 저장할 Map 추가
    }

    async init() {
        // 계정 정보 먼저 로드
        try {
            //const accountsPath = './vendor_request/accounts.js';
            const accountsPath = './src/js/data/proposalAccounts.js';

            try {
                if (window.accounts) {
                    this.accounts = window.accounts;
                } else {
                    const accountsModule = require(accountsPath);
                    this.accounts = accountsModule.accounts;
                }
            } catch (error) {
                // 기본 계정 정보 설정
                this.accounts = ProposalManage.defaultAccounts;
            }
        } catch (error) {
            // 기본 계정 정보 설정
            this.accounts = ProposalManage.defaultAccounts;
        }

        try {
            await this.loadMongoData();
            this.initializeAccountSelect();
            this.initializeMailForm();
        } catch (error) {
            this.loadFallbackData();
        }
    }

    async loadMongoData() {
        console.log('loadMongoData 함수 실행');
        try {

            // window.api가 존재하는지 확인하고 로그 찍기
            console.log("API 객체:", window.api);
            console.log("API 함수 목록:", Object.keys(window.api));

            const proposalRequests = await window.api.fetchProposalRequests();

            console.log("제안서 요청 상태 레코드 수:", proposalRequests.length);
            if (proposalRequests.length > 0) {
                const simplifiedData = proposalRequests.map(doc => ({
                    brand_name: doc.brand_name,
                    email: "",
                    notes: doc.notes,
                    call_date: doc.call_date,
                    nextstep: doc.nextstep || "제안서 요청"
                }));

                for (const brand of simplifiedData) {
                    if (brand.brand_name) {
                        try {
                            brand.email = await window.api.fetchBrandEmail(brand.brand_name);
                        } catch (err) {
                            brand.email = '';
                        }
                    }
                }

                simplifiedData.sort((a, b) => {
                    const dateA = a.call_date instanceof Date ? a.call_date : new Date(a.call_date);
                    const dateB = b.call_date instanceof Date ? b.call_date : new Date(b.call_date);
                    return dateB - dateA;
                });

                this.brands = simplifiedData;
                this.displayRequests(simplifiedData);
                return;
            }
        } catch (error) {
            console.error('MongoDB 데이터 로드 중 오류:', error);
            this.loadFallbackData();
        }
    }

    // 대체 데이터 로드
    loadFallbackData() {
        console.log("대체 데이터 사용");
        const fallbackBrands = [
            {
                brand_name: "빠이염",
                email: "pyaeom@example.com", // 대체 데이터에도 임의의 이메일 추가
                notes: "가을까지 풀이 다 차서 바로 진행은 어려우나 메일로 제안서 발송하면 일정 비었을때 연락 준다고 함",
                call_date: new Date("2025-04-08T05:34:28.233Z"),
                nextstep: "제안서 요청"
            },
            {
                brand_name: "퓨어썸",
                email: "puresum@example.com", // 대체 데이터에도 임의의 이메일 추가
                notes: "제안서 요청 받음. 마케팅 담당자에게 이메일로 전달 예정",
                call_date: new Date("2025-04-07T10:15:00.000Z"),
                nextstep: "제안서 요청"
            },
            {
                brand_name: "코스닥브랜드",
                email: "kosdaq@example.com", // 대체 데이터에도 임의의 이메일 추가
                notes: "신규 캠페인 관련 제안서 요청. 예산은 5천만원 수준",
                call_date: new Date("2025-04-06T14:22:10.000Z"),
                nextstep: "제안서 요청"
            }
        ];

        // 최신 날짜순으로 정렬 (내림차순)
        fallbackBrands.sort((a, b) => {
            const dateA = a.call_date instanceof Date ? a.call_date : new Date(a.call_date);
            const dateB = b.call_date instanceof Date ? b.call_date : new Date(b.call_date);
            return dateB - dateA; // 내림차순 정렬 (최신이 위로)
        });

        // 브랜드 데이터 저장
        this.brands = fallbackBrands;
        console.log("Fallback 데이터:", fallbackBrands);
        this.displayRequests(fallbackBrands);
    }

    displayRequests(brands) {
        console.log("displayRequests 함수 실행, 데이터:", brands);

        const requestPanel = document.getElementById('request-panel-content');
        console.log("제안서 패널 요소:", requestPanel);

        if (!requestPanel) {
            console.error("제안서 패널 요소를 찾을 수 없습니다.");
            return;
        }

        if (!brands || brands.length === 0) {
            requestPanel.innerHTML = `
                <div class="panel-header">
                    <h3>제안서 요청 브랜드</h3>
                    <span class="count-badge">0</span>
                </div>
                <div class="brand-list">
                    <p class="no-data">표시할 제안서 요청 브랜드가 없습니다.</p>
                </div>
            `;
            return;
        }

        // 오늘 날짜 생성 (연, 월, 일만 비교하기 위해)
        const today = new Date();
        const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        // 오늘 추가된 항목 수 계산
        let todayCount = 0;
        for (const brand of brands) {
            const callDateObj = brand.call_date instanceof Date ? brand.call_date : new Date(brand.call_date);
            const callDateString = `${callDateObj.getFullYear()}-${callDateObj.getMonth() + 1}-${callDateObj.getDate()}`;
            if (callDateString === todayString) {
                todayCount++;
            }
        }

        console.log("오늘 추가된 항목 수:", todayCount);

        const brandListHTML = `
            <div class="panel-header">
                <h3>제안서 요청 브랜드</h3>
                <span class="count-badge">${brands.length}</span>
                ${todayCount > 0 ? `<span class="today-count-badge">오늘 ${todayCount}</span>` : ''}
            </div>
            <table class="brand-table">
                <thead>
                    <tr>
                        <th class="checkbox-col"><input type="checkbox" id="select-all-brands" onclick="toggleAllBrands(this)"></th>
                        <th>브랜드</th>
                        <th>메일주소</th>
                        <th>메모</th>
                        <th>추가날짜</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    ${brands.map((brand, index) => {
            // 통화 날짜 형식화 - 'YY.MM.DD' 형식으로 변경
            const callDate = brand.call_date instanceof Date ?
                `${(brand.call_date.getFullYear() % 100).toString().padStart(2, '0')}.${(brand.call_date.getMonth() + 1).toString().padStart(2, '0')}.${brand.call_date.getDate().toString().padStart(2, '0')}`
                : '정보 없음';

            const callDateObj = brand.call_date instanceof Date ? brand.call_date : new Date(brand.call_date);
            const callDateString = `${callDateObj.getFullYear()}-${callDateObj.getMonth() + 1}-${callDateObj.getDate()}`;
            const isToday = callDateString === todayString;

            return `
                            <tr class="${isToday ? 'today-row' : ''}">
                                <td class="checkbox-col"><input type="checkbox" name="brand-checkbox" data-index="${index}" data-brand="${brand.brand_name}" class="brand-checkbox"></td>
                                <td>${brand.brand_name || '이름 없음'}</td>
                                <td>${brand.email || ''}</td>
                                <td title="${brand.notes || '메모 없음'}">${brand.notes || '메모 없음'}</td>
                                <td>${callDate}</td>
                                <td><span class="next-step-value status-button" data-index="${index}">${brand.nextstep || '제안서 요청'}</span></td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;

        requestPanel.innerHTML = brandListHTML;

        // 체크박스 이벤트 리스너 추가
        this.addCheckboxEventListeners();

        // 상태 버튼 이벤트 리스너 추가
        this.addStatusButtonEventListeners();

        // 중앙 패널 초기화
        this.initCenterPanel();

        console.log("innerHTML 설정 완료");
    }

    // 체크박스 이벤트 리스너 추가
    addCheckboxEventListeners() {
        const self = this;

        document.querySelectorAll('.brand-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const allChecked = Array.from(document.querySelectorAll('.brand-checkbox')).every(cb => cb.checked);
                document.getElementById('select-all-brands').checked = allChecked;

                const checkedBrands = getCheckedBrandsData(self.brands);
                self.updateCenterPanel(checkedBrands);
            });
        });

        // 테이블 행 클릭 시 체크박스 토글
        document.querySelectorAll('.brand-table tbody tr').forEach(row => {
            row.addEventListener('click', function (event) {
                // 체크박스가 클릭된 경우는 처리하지 않음 (체크박스 자체의 이벤트가 처리됨)
                if (event.target.type === 'checkbox') return;

                // 행에 있는 체크박스 찾기
                const checkbox = this.querySelector('.brand-checkbox');
                if (checkbox) {
                    // 체크박스 상태 토글
                    checkbox.checked = !checkbox.checked;

                    // change 이벤트 발생시켜 체크박스 이벤트 핸들러 실행
                    const changeEvent = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(changeEvent);
                }
            });
        });

        // 전체 선택 체크박스에 이벤트 리스너 추가
        const selectAllCheckbox = document.getElementById('select-all-brands');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function () {
                const isChecked = this.checked;
                document.querySelectorAll('.brand-checkbox').forEach(cb => {
                    cb.checked = isChecked;
                });

                // 체크된 브랜드 확인
                const checkedBrands = isChecked ? self.brands : [];
                console.log('체크된 브랜드:', checkedBrands);

                // 중앙 패널 업데이트
                self.updateCenterPanel(checkedBrands);
            });
        }
    }

    // 상태 버튼 이벤트 리스너 추가
    addStatusButtonEventListeners() {
        const self = this;

        // 상태 버튼 클릭 시
        document.querySelectorAll('.status-button').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.dataset.index);
                self.toggleBrandStatus(index, this);
            });
        });
    }

    // 브랜드 상태 토글 (제안서 요청 -> 협의대기 -> 메일제외 순환)
    toggleBrandStatus(index, element) {
        if (index < 0 || index >= this.brands.length) return;

        // 현재 상태 확인
        const currentStatus = this.brands[index].nextstep || '제안서 요청';
        const brandName = this.brands[index].brand_name;

        // 상태 순환 로직
        if (currentStatus === '제안서 요청') {
            this.brands[index].nextstep = '협의대기';
        } else if (currentStatus === '협의대기') {
            this.brands[index].nextstep = '메일제외';
        } else if (currentStatus === '메일제외') {
            this.brands[index].nextstep = '제안서 요청';
        } else {
            // 기타 상태인 경우 제안서 요청으로 리셋
            this.brands[index].nextstep = '제안서 요청';
        }

        // UI 업데이트
        element.textContent = this.brands[index].nextstep;

        // MongoDB 업데이트
        this.updateMongoDBStatus(brandName, this.brands[index].nextstep);

        // 중앙 패널 데이터도 업데이트 (체크된 브랜드가 있는 경우)
        const checkedBrands = getCheckedBrandsData(this.brands);
        if (checkedBrands.length > 0) {
            this.updateCenterPanel(checkedBrands);
        }

        console.log(`브랜드 "${brandName}"의 상태가 "${this.brands[index].nextstep}"로 변경되었습니다.`);
    }

    // MongoDB 상태 업데이트 함수
    async updateMongoDBStatus(brandName, newStatus) {
        if (!this.mongo || !brandName) return;

        try {
            console.log(`MongoDB에서 브랜드 "${brandName}"의 상태를 "${newStatus}"로 업데이트 중...`);

            // window.api를 통해 메인 프로세스에 요청
            const result = await window.api.updateNextStep(brandName, newStatus);

            if (result.modifiedCount > 0) {
                console.log(`브랜드 "${brandName}"의 상태가 성공적으로 업데이트되었습니다.`);
            } else if (result.matchedCount > 0) {
                console.log(`브랜드 "${brandName}"의 문서는 찾았지만 상태 변경 없음`);
            } else {
                console.log(`브랜드 "${brandName}"의 문서를 찾을 수 없습니다.`);
            }
        } catch (error) {
            console.error(`MongoDB 상태 업데이트 중 오류:`, error);
        }
    }

    // 중앙 패널 초기화
    initCenterPanel() {
        const centerPanel = document.querySelector('.request-panel:nth-child(2) .card-container');
        if (!centerPanel) return;

        centerPanel.innerHTML = `
            <div class="panel-header">
                <h3>선택된 브랜드</h3>
                <span class="count-badge">0</span>
            </div>
            <p class="center-panel-placeholder">좌측에서 브랜드를 선택하면 여기에 표시됩니다.</p>
        `;
    }

    // 중앙 패널 업데이트
    updateCenterPanel(selectedBrands) {
        const centerPanel = document.querySelector('.request-panel:nth-child(2) .card-container');
        if (!centerPanel) return;

        if (!selectedBrands || selectedBrands.length === 0) {
            this.initCenterPanel();
            return;
        }

        const today = new Date();
        const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        let todayCount = 0;
        for (const brand of selectedBrands) {
            const callDateObj = brand.call_date instanceof Date ? brand.call_date : new Date(brand.call_date);
            const callDateString = `${callDateObj.getFullYear()}-${callDateObj.getMonth() + 1}-${callDateObj.getDate()}`;
            if (callDateString === todayString) {
                todayCount++;
            }
        }

        const selectedBrandsHTML = `
            <div class="panel-header">
                <h3>선택된 브랜드</h3>
                <span class="count-badge">${selectedBrands.length}</span>
                ${todayCount > 0 ? `<span class="today-count-badge">오늘 ${todayCount}</span>` : ''}
            </div>
            <table class="brand-table">
                <thead>
                    <tr>
                        <th class="checkbox-col"><input type="checkbox" id="center-select-all" onclick="toggleAllCenterBrands(this)"></th>
                        <th>브랜드</th>
                        <th>메일주소</th>
                        <th>메모</th>
                        <th>추가날짜</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    ${selectedBrands.map((brand, index) => {
            const callDate = brand.call_date instanceof Date ?
                `${(brand.call_date.getFullYear() % 100).toString().padStart(2, '0')}.${(brand.call_date.getMonth() + 1).toString().padStart(2, '0')}.${brand.call_date.getDate().toString().padStart(2, '0')}`
                : '정보 없음';

            const callDateObj = brand.call_date instanceof Date ? brand.call_date : new Date(brand.call_date);
            const callDateString = `${callDateObj.getFullYear()}-${callDateObj.getMonth() + 1}-${callDateObj.getDate()}`;
            const isToday = callDateString === todayString;

            return `
                            <tr class="${isToday ? 'today-row' : ''}" data-email="${brand.email || ''}" style="cursor: pointer;">
                                <td class="checkbox-col"><input type="checkbox" name="center-brand-checkbox" data-index="${index}" data-brand="${brand.brand_name}" class="center-brand-checkbox" checked></td>
                                <td>${brand.brand_name || '이름 없음'}</td>
                                <td>${brand.email || ''}</td>
                                <td title="${brand.notes || '메모 없음'}">${brand.notes || '메모 없음'}</td>
                                <td>${callDate}</td>
                                <td><span class="next-step-value">${brand.nextstep || '제안서 요청'}</span></td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;

        centerPanel.innerHTML = selectedBrandsHTML;

        this.addCenterCheckboxEventListeners();
        this.addCenterRowClickEventListeners();
    }

    // 중앙 패널 체크박스 이벤트 리스너 추가
    addCenterCheckboxEventListeners() {
        const self = this;

        // 개별 체크박스 변경 시
        document.querySelectorAll('.center-brand-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const allChecked = Array.from(document.querySelectorAll('.center-brand-checkbox')).every(cb => cb.checked);
                if (document.getElementById('center-select-all')) {
                    document.getElementById('center-select-all').checked = allChecked;
                }

                // 체크박스 변경 이벤트 처리 (필요 시 추가 기능 구현)
            });
        });

        // 테이블 행 클릭 시 체크박스 토글
        document.querySelectorAll('.request-panel:nth-child(2) .brand-table tbody tr').forEach(row => {
            row.addEventListener('click', function (event) {
                // 체크박스가 클릭된 경우는 처리하지 않음 (체크박스 자체의 이벤트가 처리됨)
                if (event.target.type === 'checkbox') return;

                // 행에 있는 체크박스 찾기
                const checkbox = this.querySelector('.center-brand-checkbox');
                if (checkbox) {
                    // 체크박스 상태 토글
                    checkbox.checked = !checkbox.checked;

                    // change 이벤트 발생시켜 체크박스 이벤트 핸들러 실행
                    const changeEvent = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(changeEvent);
                }
            });
        });
    }

    // 중앙 패널 행 클릭 이벤트 리스너 추가 (수정)
    addCenterRowClickEventListeners() {
        const rows = document.querySelectorAll('.request-panel:nth-child(2) .brand-table tbody tr');

        rows.forEach(row => {
            row.addEventListener('click', (event) => {
                // 체크박스 클릭은 무시 (기존 체크박스 이벤트가 처리)
                if (event.target.type === 'checkbox') return;

                // 현재 선택된 브랜드의 메일 내용 저장
                this.saveCurrentMailContent();

                // 클릭된 행에서 이메일 주소만 가져오기
                const email = row.dataset.email;

                // 메일 작성 폼의 받는 사람 필드 업데이트
                const mailToInput = document.getElementById('mail-to');
                if (mailToInput) {
                    mailToInput.value = email;
                }

                // 저장된 메일 내용 복원
                const brandName = row.querySelector('td:nth-child(2)').textContent;
                this.restoreMailContent(brandName);

                // 시각적 피드백을 위해 선택된 행 하이라이트
                rows.forEach(r => r.classList.remove('selected-row'));
                row.classList.add('selected-row');
            });
        });
    }

    // 현재 메일 내용 저장
    saveCurrentMailContent() {
        const mailToInput = document.getElementById('mail-to');
        if (!mailToInput || !mailToInput.value) return; // 선택된 브랜드가 없으면 리턴

        const currentBrandEmail = mailToInput.value;
        const currentBrand = this.brands.find(b => b.email === currentBrandEmail);
        if (!currentBrand) return;

        const mailContent = {
            subject: document.getElementById('mail-subject').value,
            body: document.getElementById('mail-content').value
        };

        this.mailCache.set(currentBrand.brand_name, mailContent);
        console.log(`${currentBrand.brand_name}의 메일 내용 저장:`, mailContent);
    }

    // 저장된 메일 내용 복원
    restoreMailContent(brandName) {
        const savedContent = this.mailCache.get(brandName);
        const subjectInput = document.getElementById('mail-subject');
        const contentInput = document.getElementById('mail-content');

        if (savedContent) {
            // 저장된 내용이 있으면 복원
            subjectInput.value = savedContent.subject;
            contentInput.value = savedContent.body;
            console.log(`${brandName}의 저장된 메일 내용 복원:`, savedContent);
        } else {
            // 저장된 내용이 없으면 초기화
            subjectInput.value = '';
            contentInput.value = '';
            console.log(`${brandName}의 저장된 메일 내용 없음, 폼 초기화`);
        }
    }

    // 계정 선택 콤보박스 초기화 함수 수정
    async initializeAccountSelect() {
        try {
            // 이미 로드된 계정 정보 사용
            const accounts = this.accounts;

            const mailFromSelect = document.getElementById('mail-from');
            if (mailFromSelect) {
                // 기존 옵션들 제거
                mailFromSelect.innerHTML = '<option value="">계정을 선택하세요</option>';

                // 계정 옵션 추가
                accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.email;
                    option.textContent = `${account.name} (${account.email})`;

                    // 박슬하 계정인 경우 selected 속성 추가
                    if (account.id === 'contant01') {
                        option.selected = true;
                    }

                    mailFromSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('계정 정보 로드 중 오류:', error);
        }
    }

    // 메일 폼 초기화
    initializeMailForm() {
        console.log('메일 폼 초기화 시작');
        
        // 템플릿 선택 드롭다운 초기화
        const templateSelect = document.getElementById('mail-template');
        if (templateSelect) {
            templateSelect.innerHTML = `
                <option value="">템플릿을 선택하세요</option>
                <option value="greeting">안녕하세요 담당자님</option>
            `;
            
            // 템플릿 선택 이벤트 리스너 추가
            templateSelect.addEventListener('change', function() {
                const mailContent = document.getElementById('mail-content');
                if (this.value === 'greeting') {
                    mailContent.value = '안녕하세요 담당자님\n\n제안서를 첨부합니다.\n\n감사합니다.';
                }
            });
        }
        const sendButton = document.querySelector('.mail-button.send');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                console.log('보내기 버튼 클릭됨');
                const fromSelect = document.getElementById('mail-from');
                const toInput = document.getElementById('mail-to');
                const subjectInput = document.getElementById('mail-subject');
                const bodyEditor = document.querySelector('.mail-body-editor'); // 메일 본문 에디터

                // 필수 필드 검증
                if (!fromSelect.value) {
                    alert('보내는 사람을 선택해주세요.');
                    return;
                }
                if (!toInput.value) {
                    alert('받는 사람을 선택해주세요.');
                    return;
                }
                if (!subjectInput.value.trim()) {
                    alert('제목을 입력해주세요.');
                    return;
                }

                // 모달 요소 확인 및 생성
                let modal = document.getElementById('send-mail-modal');
                if (!modal) {
                    createMailModal();
                    modal = document.getElementById('send-mail-modal');
                }
                // 닫기 버튼 이벤트 추가
                const closeModal = modal.querySelector('.close-modal');
                if (closeModal) {
                    closeModal.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }

                // 취소 버튼 이벤트 추가
                const cancelButton = modal.querySelector('.modal-button.cancel');
                if (cancelButton) {
                    cancelButton.addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                }

                /*
                // 전송 확인 버튼 이벤트 추가
                const confirmButton = modal.querySelector('.modal-button.confirm');
                if (confirmButton) {
                    confirmButton.addEventListener('click', async () => {
                        // 버튼 비활성화 및 로딩 표시
                        confirmButton.disabled = true;
                        cancelButton.disabled = true;
                        const sendingIndicator = modal.querySelector('.sending-indicator');
                        if (sendingIndicator) sendingIndicator.style.display = 'inline-block';

                        try {
                            // 선택된 계정 ID 가져오기
                            const accountId = this.getAccountIdFromEmail(fromSelect.value);

                            if (!accountId) {
                                throw new Error('계정 ID를 찾을 수 없습니다.');
                            }

                            // 본문 내용 가져오기 (수정된 부분)
                            const mailContent = document.getElementById('mail-content');
                            // 줄바꿈을 <br> 태그로 변환
                            const bodyContent = mailContent ? mailContent.value.replace(/\n/g, '<br>') : '<p>제안서를 첨부합니다.</p>';

                            // 계정별 서명 설정
                            const signatures = {
                                'bnam91': `
                                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                            <img src="https://i.ibb.co/QZn65VY/image.png" alt="고야앤드미디어 명함" style="margin-top: 10px; max-width: 300px;">
                                        </div>
                                    `,
                                'contant01': `
                                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                            <img src="https://i.ibb.co/YTRgN6fp/image.png" alt="박슬하 명함" style="margin-top: 10px; max-width: 300px;">
                                        </div>
                                    `,
                                'jisu04': `
                                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                            <img src="https://i.ibb.co/RG93mR7S/2.png" alt="김지수 명함" style="margin-top: 10px; max-width: 300px;">
                                        </div>
                                    `
                            };

                            const signature = signatures[accountId] || '';

                            // 이메일 내용 준비
                            const mailOptions = {
                                from: fromSelect.value,
                                to: toInput.value,
                                subject: subjectInput.value,
                                body: `
                                        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                                            ${bodyContent}
                                            ${signature}
                                        </div>
                                    `
                            };

                            console.log('메일 전송 옵션:', mailOptions);

                            // credentials 파일 경로 설정 부분 수정
                            //const credentialsPath = path.join(__dirname, 'token', `credentials_${accountId}.js`);
                            const credentialsPath = `token/credentials_${accountId}.js`;

                            console.log('자격 증명 경로:', credentialsPath);

                            // Gmail 인증 정보 가져오기
                            //const auth = await window.getGmailCredentials(accountId, credentialsPath);
                            const auth = await getGmailCredentials(accountId, credentialsPath);

                            // Gmail API 초기화
                            const gmail = google.gmail({ version: 'v1', auth });

                            // 이메일 헤더 설정
                            const headers = {
                                'MIME-Version': '1.0',
                                'From': mailOptions.from,
                                'To': mailOptions.to,
                                'Subject': '=?UTF-8?B?' + Buffer.from(mailOptions.subject).toString('base64') + '?=',
                                'Content-Type': 'text/html; charset=UTF-8',
                                'Content-Transfer-Encoding': 'base64'
                            };

                            // 이메일 본문 생성
                            const emailLines = [
                                Object.keys(headers).map(key => `${key}: ${headers[key]}`).join('\r\n'),
                                '',
                                Buffer.from(mailOptions.body).toString('base64')
                            ].join('\r\n');

                            // Base64 인코딩
                            const encodedEmail = Buffer.from(emailLines)
                                .toString('base64')
                                .replace(/\+/g, '-')
                                .replace(/\//g, '_')
                                .replace(/=+$/, '');

                            // 이메일 전송
                            const response = await gmail.users.messages.send({
                                userId: 'me',
                                requestBody: {
                                    raw: encodedEmail
                                }
                            });

                            if (response.data.id) {
                                alert('메일이 성공적으로 전송되었습니다.');

                                // 전송 성공 시 상태 업데이트 (제안서 요청 → 협의대기)
                                this.updateSentBrandsStatus();

                                // 모달 닫기
                                modal.style.display = 'none';
                            } else {
                                throw new Error('메일 전송에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('메일 전송 오류:', error);

                            // 클립보드 복사 기능 제안
                            if (confirm(`메일 전송 중 오류가 발생했습니다: ${error.message}\n메일 내용을 클립보드에 복사하시겠습니까?`)) {
                                copyMailToClipboard({
                                    to: toInput.value,
                                    subject: subjectInput.value,
                                    body: bodyEditor ? bodyEditor.innerHTML : '<p>제안서를 첨부합니다.</p>'
                                });
                            }
                        } finally {
                            // 버튼 활성화 및 로딩 표시 제거
                            confirmButton.disabled = false;
                            cancelButton.disabled = false;
                            const sendingIndicator = modal.querySelector('.sending-indicator');
                            if (sendingIndicator) sendingIndicator.style.display = 'none';
                        }
                    });
                }
                    */
                const confirmButton = modal.querySelector('.modal-button.confirm');
                if (confirmButton) {
                    confirmButton.addEventListener('click', async () => {
                        confirmButton.disabled = true;
                        cancelButton.disabled = true;
                        const sendingIndicator = modal.querySelector('.sending-indicator');
                        if (sendingIndicator) sendingIndicator.style.display = 'inline-block';

                        try {
                            const accountId = this.getAccountIdFromEmail(fromSelect.value);
                            if (!accountId) {
                                throw new Error('계정 ID를 찾을 수 없습니다.');
                            }

                            const mailContent = document.getElementById('mail-content');
                            const bodyContent = mailContent ? mailContent.value.replace(/\n/g, '<br>') : '<p>제안서를 첨부합니다.</p>';

                            const signatures = {
                                'bnam91': `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;"><img src="https://i.ibb.co/QZn65VY/image.png" alt="고야앤드미디어 명함" style="margin-top: 10px; max-width: 300px;"></div>`,
                                'contant01': `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;"><img src="https://i.ibb.co/YTRgN6fp/image.png" alt="박슬하 명함" style="margin-top: 10px; max-width: 300px;"></div>`,
                                'jisu04': `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;"><img src="https://i.ibb.co/RG93mR7S/2.png" alt="김지수 명함" style="margin-top: 10px; max-width: 300px;"></div>`
                            };

                            const signature = signatures[accountId] || '';

                            const mailOptions = {
                                from: fromSelect.value,
                                to: toInput.value,
                                subject: subjectInput.value,
                                body: `
                          <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                            ${bodyContent}
                            ${signature}
                          </div>
                        `
                            };

                            const credentialsPath = `token/credentials_${accountId}.js`;

                            console.log('메일 전송 옵션 준비 완료:', mailOptions);

                              // 1. 인증 시작
                            await window.gmailAuthAPI.startAuth(accountId, credentialsPath);

                            // 2. 인증 코드 사용자에게 입력받기
                            // 인증 코드 받기
                            const codeInput = document.getElementById('auth-code-input');
                            const code = codeInput?.value.trim();

                            if (!code) {
                                alert('인증 코드를 입력해주세요.');
                                return;
                            }

                            // 3. 코드 제출하여 토큰 저장
                            await window.gmailAuthAPI.sendAuthCode(code, accountId);
                            // 🔥 핵심: 메일 전송 요청
                            const result = await window.gmailAuthAPI.sendGmail({
                                accountId,
                                credentialsPath,
                                mailOptions
                            });

                            if (result.success) {
                                alert('메일이 성공적으로 전송되었습니다.');
                                this.updateSentBrandsStatus();
                                modal.style.display = 'none';
                            } else {
                                throw new Error('메일 전송 실패');
                            }

                        } catch (error) {
                            console.error('메일 전송 오류:', error);
                            if (confirm(`메일 전송 중 오류가 발생했습니다: ${error.message}\n메일 내용을 클립보드에 복사하시겠습니까?`)) {
                                copyMailToClipboard({
                                    to: toInput.value,
                                    subject: subjectInput.value,
                                    body: bodyEditor ? bodyEditor.innerHTML : '<p>제안서를 첨부합니다.</p>'
                                });
                            }
                        } finally {
                            confirmButton.disabled = false;
                            cancelButton.disabled = false;
                            const sendingIndicator = modal.querySelector('.sending-indicator');
                            if (sendingIndicator) sendingIndicator.style.display = 'none';
                        }
                    });
                }


                // 모달 외부 클릭 시 닫기
                window.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.style.display = 'none';
                    }
                });
                //}

                // 모달에 미리보기 정보 설정
                const previewFrom = document.getElementById('preview-from');
                const previewTo = document.getElementById('preview-to');
                const previewSubject = document.getElementById('preview-subject');
                const previewContent = document.getElementById('preview-content');

                const mailContent = document.getElementById('mail-content');

                if (previewFrom) previewFrom.textContent = fromSelect.options[fromSelect.selectedIndex].text;
                if (previewTo) previewTo.textContent = toInput.value;
                if (previewSubject) previewSubject.textContent = subjectInput.value;
                if (previewContent && mailContent) {
                    previewContent.innerHTML = mailContent.value.replace(/\n/g, '<br>');
                }

                // 모달 표시
                modal.style.display = 'block';
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.margin = '-5% 0 0 0%'; // 상단 -5%, 좌측 0이 중앙 
                }
                console.log('모달 표시됨');
            });
        }


    }

    // 이메일 주소로부터 계정 ID 추출 (클래스 멤버 변수 사용)
    getAccountIdFromEmail(email) {
        if (!email || !this.accounts) return null;

        try {
            const account = this.accounts.find(acc => acc.email === email);

            if (account && account.id) {
                return account.id;
            }

            console.warn(`${email}에 해당하는 계정 ID를 찾을 수 없습니다.`);
            return null;
        } catch (error) {
            console.error('계정 ID 추출 중 오류:', error);
            return null;
        }
    }

    // 메일 전송 후 브랜드 상태 업데이트 (제안서 요청 → 협의대기)
    updateSentBrandsStatus() {
        // 현재 선택된 이메일 주소 가져오기
        const toEmail = document.getElementById('mail-to').value;

        if (!toEmail) return;

        console.log('메일 전송된 이메일:', toEmail);

        // 해당 이메일을 가진 브랜드 찾기
        const brandIndex = this.brands.findIndex(b => b.email === toEmail);

        if (brandIndex >= 0) {
            console.log('상태 업데이트할 브랜드:', this.brands[brandIndex].brand_name);

            // 상태 업데이트 (제안서 요청 → 협의대기)
            this.brands[brandIndex].nextstep = '협의대기';

            // MongoDB 업데이트
            this.updateMongoDBStatus(this.brands[brandIndex].brand_name, '협의대기');

            // UI 다시 표시
            this.displayRequests(this.brands);

            console.log('상태 업데이트 완료');
        } else {
            console.warn('해당 이메일 주소를 가진 브랜드를 찾을 수 없습니다:', toEmail);
        }
    }
}

// 전체 선택/해제 토글 함수 (글로벌 함수는 이제 불필요)
function toggleAllBrands(checkbox) {
    const isChecked = checkbox.checked;
    document.querySelectorAll('.brand-checkbox').forEach(cb => {
        cb.checked = isChecked;
    });

    // RequestManager 인스턴스 가져오기
    const requestManager = window.requestManager;
    if (!requestManager) return;

    // 체크된 브랜드 확인
    const checkedBrands = isChecked ? requestManager.brands : [];

    // 중앙 패널 업데이트
    requestManager.updateCenterPanel(checkedBrands);
}

// 중앙 패널 전체 선택/해제 토글 함수
function toggleAllCenterBrands(checkbox) {
    const isChecked = checkbox.checked;
    document.querySelectorAll('.center-brand-checkbox').forEach(cb => {
        cb.checked = isChecked;
    });
}

// 체크된 브랜드 데이터 반환 함수 수정
function getCheckedBrandsData(allBrands) {
    if (!allBrands || !allBrands.length) return [];

    const checkedBoxes = document.querySelectorAll('.brand-checkbox:checked');
    const checkedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.index));

    // 체크된 인덱스에 해당하는 브랜드 데이터 반환 (제안서 요청 상태인 것만)
    return checkedIndices
        .map(index => allBrands[index])
        .filter(brand => brand && brand.nextstep === '제안서 요청');
}

// 메일 내용을 클립보드에 복사하는 함수
function copyMailToClipboard(mailOptions) {
    const mailContent = `
받는 사람: ${mailOptions.to}
제목: ${mailOptions.subject}

${mailOptions.body.replace(/<[^>]*>/g, '')}
    `;

    navigator.clipboard.writeText(mailContent)
        .then(() => {
            alert('메일 내용이 클립보드에 복사되었습니다. 직접 메일 클라이언트에 붙여넣기 해주세요.');
        })
        .catch(err => {
            console.error('클립보드 복사 실패:', err);
            alert('클립보드 복사에 실패했습니다.');
        });
}

function createMailModal() {
    console.log('모달 요소가 없어서 동적으로 생성합니다.');
    // 모달 동적 생성
    let modal = document.createElement('div');
    modal.id = 'send-mail-modal';
    modal.className = 'modal';
    modal.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4>메일 전송 확인</h4>
                                <span class="close-modal">&times;</span>
                            </div>
                            <div class="modal-body">
                                <p>다음 내용으로 메일을 전송하시겠습니까?</p>
                                <div class="mail-preview">
                                    <div class="preview-row">
                                        <span class="preview-label">보내는 사람:</span>
                                        <span class="preview-value" id="preview-from"></span>
                                    </div>
                                    <div class="preview-row">
                                        <span class="preview-label">받는 사람:</span>
                                        <span class="preview-value" id="preview-to"></span>
                                    </div>
                                    <div class="preview-row">
                                        <span class="preview-label">제목:</span>
                                        <span class="preview-value" id="preview-subject"></span>
                                    </div>
                                    <div class="preview-row">
                                        <span class="preview-label">내용:</span>
                                        <div class="preview-value" id="preview-content"></div>
                                    </div>
                                </div>
                                <div class="auth-code-section">
                                <label for="auth-code-input" style="display:block; margin: 10px 0 4px;">인증 코드</label>
                                <input id="auth-code-input" type="text" placeholder="📩 이메일 인증 코드를 입력하세요" style="width:100%; padding: 8px;" />
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="modal-button cancel">취소</button>
                                <button class="modal-button confirm">전송</button>
                            </div>
                        </div>
                    `;
    document.body.appendChild(modal);
}

// 인스턴스 생성 및 초기화
//window.requestManager = new RequestManager();
//window.requestManager.init(); // init() 메서드 명시적 호출 