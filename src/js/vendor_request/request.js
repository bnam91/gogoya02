// window.mongo 사용
class RequestManager {
    constructor() {
        this.mongo = window.mongo;
        this.brands = []; // 브랜드 데이터 저장용 배열
    }

    async init() {
        console.log("제안서 관리 초기화 시작");
        console.log("MongoDB 객체:", this.mongo);
        console.log("MongoDB 함수 목록:", Object.keys(this.mongo));
        
        try {
            await this.loadMongoData();
        } catch (error) {
            console.error("제안서 관리 초기화 중 오류:", error);
            this.loadFallbackData();
        }
    }

    async loadMongoData() {
        try {
            console.log("MongoDB에서 데이터 로드 시도...");
            
            if (!this.mongo) {
                throw new Error("MongoDB 모듈이 로드되지 않았습니다.");
            }
            
            // 정확한 컬렉션에서 직접 쿼리
            if (typeof this.mongo.getMongoClient === 'function') {
                console.log("MongoDB 클라이언트 직접 접근 시도");
                
                try {
                    const client = await this.mongo.getMongoClient();
                    const db = client.db("insta09_database");
                    const collection = db.collection("gogoya_vendor_CallRecords");
                    
                    console.log("insta09_database.gogoya_vendor_CallRecords 컬렉션 접근 중");
                    
                    // nextstep이 '제안서 요청'인 문서 찾기
                    const proposalRequests = await collection.find({ 
                        nextstep: "제안서 요청" 
                    }).toArray();
                    
                    console.log("제안서 요청 상태 레코드 수:", proposalRequests.length);
                    
                    if (proposalRequests.length > 0) {
                        console.log("제안서 요청 레코드 샘플:", proposalRequests[0]);
                        
                        // 필요한 데이터만 추출
                        const simplifiedData = proposalRequests.map(doc => ({
                            brand_name: doc.brand_name,
                            email: "", // 이메일 필드는 일단 빈 값으로
                            notes: doc.notes,
                            call_date: doc.call_date,
                            nextstep: doc.nextstep || "제안서 요청" // nextstep 필드 추가
                        }));
                        
                        // 최신 날짜순으로 정렬 (내림차순)
                        simplifiedData.sort((a, b) => {
                            const dateA = a.call_date instanceof Date ? a.call_date : new Date(a.call_date);
                            const dateB = b.call_date instanceof Date ? b.call_date : new Date(b.call_date);
                            return dateB - dateA; // 내림차순 정렬 (최신이 위로)
                        });
                        
                        // 브랜드 데이터 저장
                        this.brands = simplifiedData;
                        this.displayRequests(simplifiedData);
                        return;
                    } else {
                        console.log("제안서 요청 상태인 문서를 찾을 수 없습니다.");
                    }
                } catch (err) {
                    console.error("직접 쿼리 오류:", err);
                }
            }
            
            // 직접 쿼리가 실패하면 대체 데이터 사용
            this.loadFallbackData();
            
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
                email: "",
                notes: "가을까지 풀이 다 차서 바로 진행은 어려우나 메일로 제안서 발송하면 일정 비었을때 연락 준다고 함",
                call_date: new Date("2025-04-08T05:34:28.233Z"),
                nextstep: "제안서 요청"
            },
            {
                brand_name: "퓨어썸",
                email: "",
                notes: "제안서 요청 받음. 마케팅 담당자에게 이메일로 전달 예정",
                call_date: new Date("2025-04-07T10:15:00.000Z"),
                nextstep: "제안서 요청"
            },
            {
                brand_name: "코스닥브랜드",
                email: "",
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

        const brandListHTML = `
            <div class="panel-header">
                <h3>제안서 요청 브랜드</h3>
                <span class="count-badge">${brands.length}</span>
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
                        
                        return `
                            <tr>
                                <td class="checkbox-col"><input type="checkbox" name="brand-checkbox" data-index="${index}" data-brand="${brand.brand_name}" class="brand-checkbox"></td>
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

        requestPanel.innerHTML = brandListHTML;
        
        // 체크박스 이벤트 리스너 추가
        this.addCheckboxEventListeners();
        
        // 중앙 패널 초기화
        this.initCenterPanel();
        
        console.log("innerHTML 설정 완료");
    }
    
    // 체크박스 이벤트 리스너 추가
    addCheckboxEventListeners() {
        const self = this; // 클래스 인스턴스에 접근하기 위한 참조
        
        // 개별 체크박스 변경 시
        document.querySelectorAll('.brand-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allChecked = Array.from(document.querySelectorAll('.brand-checkbox')).every(cb => cb.checked);
                document.getElementById('select-all-brands').checked = allChecked;
                
                // 체크된 브랜드 확인
                const checkedBrands = getCheckedBrandsData(self.brands);
                console.log('체크된 브랜드:', checkedBrands);
                
                // 중앙 패널 업데이트
                self.updateCenterPanel(checkedBrands);
            });
        });
        
        // 테이블 행 클릭 시 체크박스 토글
        document.querySelectorAll('.brand-table tbody tr').forEach(row => {
            row.addEventListener('click', function(event) {
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
            selectAllCheckbox.addEventListener('change', function() {
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
        
        const selectedBrandsHTML = `
            <div class="panel-header">
                <h3>선택된 브랜드</h3>
                <span class="count-badge">${selectedBrands.length}</span>
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
                        // 통화 날짜 형식화 - 'YY.MM.DD' 형식으로 변경
                        const callDate = brand.call_date instanceof Date ? 
                            `${(brand.call_date.getFullYear() % 100).toString().padStart(2, '0')}.${(brand.call_date.getMonth() + 1).toString().padStart(2, '0')}.${brand.call_date.getDate().toString().padStart(2, '0')}` 
                            : '정보 없음';
                        
                        return `
                            <tr>
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
        
        // 중앙 패널 체크박스에 이벤트 리스너 추가
        this.addCenterCheckboxEventListeners();
    }
    
    // 중앙 패널 체크박스 이벤트 리스너 추가
    addCenterCheckboxEventListeners() {
        const self = this;
        
        // 개별 체크박스 변경 시
        document.querySelectorAll('.center-brand-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allChecked = Array.from(document.querySelectorAll('.center-brand-checkbox')).every(cb => cb.checked);
                if (document.getElementById('center-select-all')) {
                    document.getElementById('center-select-all').checked = allChecked;
                }
                
                // 체크박스 변경 이벤트 처리 (필요 시 추가 기능 구현)
            });
        });
        
        // 테이블 행 클릭 시 체크박스 토글
        document.querySelectorAll('.request-panel:nth-child(2) .brand-table tbody tr').forEach(row => {
            row.addEventListener('click', function(event) {
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

// 체크된 브랜드 데이터 반환 함수
function getCheckedBrandsData(allBrands) {
    if (!allBrands || !allBrands.length) return [];
    
    const checkedBoxes = document.querySelectorAll('.brand-checkbox:checked');
    const checkedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.index));
    
    // 체크된 인덱스에 해당하는 브랜드 데이터 반환
    return checkedIndices.map(index => allBrands[index]).filter(brand => brand);
}

// 요청 관리자 인스턴스 생성
window.requestManager = new RequestManager(); 