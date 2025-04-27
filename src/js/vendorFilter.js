class VendorFilter {
    constructor() {
        this.selectedCategories = [];
        this.selectedGrades = [];
        this.selectedNextSteps = [];
        this.filterContainer = null;
        this.searchQuery = '';
        this.hasBrandInfo = null; // 브랜드 정보 유무 필터 상태
        this.selectedVerificationStatus = null; // 인증 상태 필터 추가
        this.categoryOptions = [
            "🍽주방용품&식기",
            "🛋생활용품&가전",
            "🥦식품&건강식품",
            "🧴뷰티&헬스",
            "👶유아&교육",
            "👗의류&잡화",
            "🚗기타"
        ];
        this.gradeOptions = ["S", "A", "B", "C", "D", "R"];
        this.nextStepOptions = ['제안서 요청', '재시도 예정', '진행거절', '번호오류', '콜백대기', '기타'];
        this.verificationOptions = [
            { value: 'true', label: '인증완료' },
            { value: 'yet', label: '대기중' },
            { value: 'false', label: '미인증' },
            { value: 'skip', label: '스킵' },
            { value: 'pick', label: '후보컨택' }
        ];
    }

    init() {
        // 모든 필터 컨테이너 제거
        document.querySelectorAll('.filter-container').forEach(filter => {
            filter.remove();
        });
        
        // 현재 페이지가 브랜드 컨택 페이지인 경우에만 필터 생성
        const currentPage = document.querySelector('.content-section.active').id;
        if (currentPage === 'vendor-content') {
            const breadcrumb = document.querySelector('#vendor-content .breadcrumb');
            if (breadcrumb) {
                this.createFilterUI(breadcrumb);
                this.setupEventListeners();
            }
        }
    }

    createFilterUI(breadcrumb) {
        this.filterContainer = document.createElement('div');
        this.filterContainer.className = 'filter-container';
        this.filterContainer.innerHTML = `
            <div class="filter-wrapper">
                <div class="filter-group">
                    <div class="filter-search">
                        <div class="filter-label">브랜드 검색</div>
                        <input type="text" class="search-input" placeholder="브랜드명을 입력하세요">
                    </div>
                    <div class="filter-dropdown">
                        <div class="filter-label">브랜드 정보</div>
                        <div class="filter-select">
                            <div class="selected-brand-info">브랜드 정보 선택</div>
                            <div class="dropdown-arrow">▼</div>
                        </div>
                        <div class="filter-options">
                            <div class="filter-option" data-brand-info="all">
                                <input type="radio" name="brand-info" id="brand-info-all" value="all" checked>
                                <label for="brand-info-all">전체</label>
                            </div>
                            <div class="filter-option" data-brand-info="has">
                                <input type="radio" name="brand-info" id="brand-info-has" value="has">
                                <label for="brand-info-has">정보 있음</label>
                            </div>
                            <div class="filter-option" data-brand-info="none">
                                <input type="radio" name="brand-info" id="brand-info-none" value="none">
                                <label for="brand-info-none">정보 없음</label>
                            </div>
                        </div>
                    </div>
                    <div class="filter-dropdown">
                        <div class="filter-label">인증 상태</div>
                        <div class="filter-select">
                            <div class="selected-verification">인증 상태 선택</div>
                            <div class="dropdown-arrow">▼</div>
                        </div>
                        <div class="filter-options">
                            <div class="filter-option" data-verification="all">
                                <input type="radio" name="verification" id="verification-all" value="all" checked>
                                <label for="verification-all">전체</label>
                            </div>
                            ${this.verificationOptions.map(option => `
                                <div class="filter-option" data-verification="${option.value}">
                                    <input type="radio" name="verification" id="verification-${option.value}" value="${option.value}">
                                    <label for="verification-${option.value}" class="verification-label ${option.value}">
                                        ${option.label}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-dropdown">
                        <div class="filter-label">아이템 카테고리</div>
                        <div class="filter-select">
                            <div class="selected-items">카테고리 선택</div>
                            <div class="dropdown-arrow">▼</div>
                        </div>
                        <div class="filter-options">
                            ${this.categoryOptions.map(category => `
                                <div class="filter-option" data-category="${category}">
                                    <input type="checkbox" id="category-${category}" value="${category}">
                                    <label for="category-${category}">${category}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-dropdown">
                        <div class="filter-label">인플루언서 등급</div>
                        <div class="filter-select">
                            <div class="selected-grades">등급 선택</div>
                            <div class="dropdown-arrow">▼</div>
                        </div>
                        <div class="filter-options">
                            ${this.gradeOptions.map(grade => `
                                <div class="filter-option" data-grade="${grade}">
                                    <input type="checkbox" id="grade-${grade}" value="${grade}">
                                    <label for="grade-${grade}">${grade}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-dropdown">
                        <div class="filter-label">다음 단계</div>
                        <div class="filter-select">
                            <div class="selected-next-steps">다음 단계 선택</div>
                            <div class="dropdown-arrow">▼</div>
                        </div>
                        <div class="filter-options">
                            ${this.nextStepOptions.map(step => `
                                <div class="filter-option" data-next-step="${step}">
                                    <input type="checkbox" id="next-step-${step}" value="${step}">
                                    <label for="next-step-${step}">${step}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <button class="filter-reset-button">
                    <span class="reset-icon">↺</span>
                    필터 초기화
                </button>
            </div>
        `;
        breadcrumb.after(this.filterContainer);
    }

    setupEventListeners() {
        const filterSelects = this.filterContainer.querySelectorAll('.filter-select');
        const categoryCheckboxes = this.filterContainer.querySelectorAll('input[type="checkbox"][id^="category-"]');
        const gradeCheckboxes = this.filterContainer.querySelectorAll('input[type="checkbox"][id^="grade-"]');
        const nextStepCheckboxes = this.filterContainer.querySelectorAll('input[type="checkbox"][id^="next-step-"]');
        const resetButton = this.filterContainer.querySelector('.filter-reset-button');
        const searchInput = this.filterContainer.querySelector('.search-input');
        const brandInfoRadios = this.filterContainer.querySelectorAll('input[name="brand-info"]');
        const verificationRadios = this.filterContainer.querySelectorAll('input[name="verification"]');

        // 검색 입력 이벤트
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                this.searchQuery = e.target.value.trim();
                await this.filterCards();
            }
        });

        // 드롭다운 토글
        filterSelects.forEach(select => {
            select.addEventListener('click', (e) => {
                const options = select.nextElementSibling;
                // 다른 열린 옵션들을 닫기
                this.filterContainer.querySelectorAll('.filter-options').forEach(opt => {
                    if (opt !== options) opt.classList.remove('show');
                });
                options.classList.toggle('show');
                e.stopPropagation();
            });
        });

        // 카테고리 체크박스 변경 이벤트
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedCategories();
                this.updateSelectedItemsDisplay();
                this.filterCards();
            });
        });

        // 등급 체크박스 변경 이벤트
        gradeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedGrades();
                this.updateSelectedGradesDisplay();
                this.filterCards();
            });
        });

        // 다음 단계 체크박스 변경 이벤트
        nextStepCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedNextSteps();
                this.updateSelectedNextStepsDisplay();
                this.filterCards();
            });
        });

        // 브랜드 정보 필터 변경 이벤트
        brandInfoRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                this.hasBrandInfo = e.target.value === 'all' ? null : e.target.value === 'has';
                this.updateSelectedBrandInfoDisplay();
                await this.filterCards();
            });
        });

        // 인증 상태 필터 이벤트 리스너 추가
        verificationRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                this.selectedVerificationStatus = e.target.value === 'all' ? null : e.target.value;
                this.updateSelectedVerificationDisplay();
                await this.filterCards();
            });
        });

        // 초기화 버튼 클릭 이벤트
        resetButton.addEventListener('click', () => {
            this.resetFilters();
        });

        // 문서 클릭 시 드롭다운 닫기
        document.addEventListener('click', () => {
            this.filterContainer.querySelectorAll('.filter-options').forEach(options => {
                options.classList.remove('show');
            });
        });
    }

    resetFilters() {
        // 모든 체크박스 해제
        this.filterContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // 브랜드 정보 필터 초기화
        const allRadio = this.filterContainer.querySelector('#brand-info-all');
        if (allRadio) allRadio.checked = true;
        this.hasBrandInfo = null;

        // 검색 입력 초기화
        const searchInput = this.filterContainer.querySelector('.search-input');
        searchInput.value = '';

        // 선택된 카테고리와 등급 초기화
        this.selectedCategories = [];
        this.selectedGrades = [];
        this.selectedNextSteps = [];
        this.searchQuery = '';

        // 인증 상태 필터 초기화
        this.selectedVerificationStatus = null;
        const verificationAllRadio = this.filterContainer.querySelector('#verification-all');
        if (verificationAllRadio) {
            verificationAllRadio.checked = true;
        }

        // 디스플레이 텍스트 초기화
        this.updateSelectedItemsDisplay();
        this.updateSelectedGradesDisplay();
        this.updateSelectedNextStepsDisplay();
        this.updateSelectedBrandInfoDisplay();
        this.updateSelectedVerificationDisplay();

        // 초기화 버튼 애니메이션
        const resetButton = this.filterContainer.querySelector('.filter-reset-button');
        resetButton.classList.add('rotate');
        setTimeout(() => {
            resetButton.classList.remove('rotate');
        }, 300);

        // 중앙 패널 초기화
        const dataList = document.getElementById('vendor-data-list');
        dataList.innerHTML = '<p>데이터를 불러오는 중...</p>';

        // 우측 패널 초기화
        const rightPanel = document.querySelector('.vendor-right');
        rightPanel.innerHTML = '<p>카드를 선택하면 브랜드 정보가 표시됩니다.</p>';

        // 데이터를 처음부터 다시 로드
        window.vendor.currentSkip = 0;
        window.vendor.hasMoreData = true;
        window.vendor.cardData = [];
        window.vendor.selectedCardIndex = -1;
        window.vendor.currentBrandData = null;
        window.vendor.loadVendorData(true);
    }

    updateSelectedCategories() {
        this.selectedCategories = Array.from(
            this.filterContainer.querySelectorAll('input[type="checkbox"][id^="category-"]:checked')
        ).map(checkbox => checkbox.value);
    }

    updateSelectedGrades() {
        this.selectedGrades = Array.from(
            this.filterContainer.querySelectorAll('input[type="checkbox"][id^="grade-"]:checked')
        ).map(checkbox => checkbox.value);
    }

    updateSelectedNextSteps() {
        this.selectedNextSteps = Array.from(
            this.filterContainer.querySelectorAll('input[type="checkbox"][id^="next-step-"]:checked')
        ).map(checkbox => checkbox.value);
    }

    updateSelectedItemsDisplay() {
        const selectedItemsContainer = this.filterContainer.querySelector('.selected-items');
        if (this.selectedCategories.length === 0) {
            selectedItemsContainer.textContent = '카테고리 선택';
        } else {
            selectedItemsContainer.textContent = this.selectedCategories.join(', ');
        }
    }

    updateSelectedGradesDisplay() {
        const selectedGradesContainer = this.filterContainer.querySelector('.selected-grades');
        if (this.selectedGrades.length === 0) {
            selectedGradesContainer.textContent = '등급 선택';
        } else {
            selectedGradesContainer.textContent = this.selectedGrades.join(', ');
        }
    }

    updateSelectedNextStepsDisplay() {
        const selectedNextStepsContainer = this.filterContainer.querySelector('.selected-next-steps');
        if (this.selectedNextSteps.length === 0) {
            selectedNextStepsContainer.textContent = '다음 단계 선택';
        } else {
            selectedNextStepsContainer.textContent = this.selectedNextSteps.join(', ');
        }
    }

    updateSelectedBrandInfoDisplay() {
        const selectedBrandInfoContainer = this.filterContainer.querySelector('.selected-brand-info');
        if (this.hasBrandInfo === null) {
            selectedBrandInfoContainer.textContent = '브랜드 정보 선택';
        } else {
            selectedBrandInfoContainer.textContent = this.hasBrandInfo ? '정보 있음' : '정보 없음';
        }
    }

    updateSelectedVerificationDisplay() {
        const selectedVerificationContainer = this.filterContainer.querySelector('.selected-verification');
        if (!this.selectedVerificationStatus) {
            selectedVerificationContainer.textContent = '인증 상태 선택';
        } else {
            const option = this.verificationOptions.find(opt => opt.value === this.selectedVerificationStatus);
            selectedVerificationContainer.textContent = option ? option.label : '인증 상태 선택';
        }
    }

    async filterCards() {
        // 로딩 토스트 메시지 표시
        this.showToast('데이터를 필터링하는 중...', 'loading');
        
        // 필터링 시 스크롤 위치와 데이터 초기화
        window.vendor.currentSkip = 0;
        window.vendor.hasMoreData = true;
        window.vendor.cardData = [];
        
        // 중앙 패널 초기화
        const dataList = document.getElementById('vendor-data-list');
        dataList.innerHTML = '<p>데이터를 불러오는 중...</p>';
        
        // 우측 패널 초기화
        const rightPanel = document.querySelector('.vendor-right');
        rightPanel.innerHTML = '<p>카드를 선택하면 브랜드 정보가 표시됩니다.</p>';
        
        // 필터링된 데이터 로드
        const filters = {
            searchQuery: this.searchQuery,
            categories: this.selectedCategories,
            grades: this.selectedGrades,
            hasBrandInfo: this.hasBrandInfo,
            verificationStatus: this.selectedVerificationStatus,
            nextSteps: this.selectedNextSteps
        };
        
        await window.vendor.loadVendorData(true, filters);
        
        // 필터링 완료 후 결과 토스트 메시지 표시
        const cards = document.querySelectorAll('.card');
        this.showFilterResultToast(cards.length, cards.length);
    }

    // 토스트 메시지 표시 메서드
    showToast(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        
        // 타입에 따른 아이콘 추가
        const icon = type === 'loading' ? '⌛' : 
                    type === 'success' ? '✓' : 
                    type === 'error' ? '✕' : 'ℹ';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-text">${message}</span>
        `;
        
        document.body.appendChild(toast);

        // loading 타입이 아닌 경우에만 자동으로 제거
        if (type !== 'loading') {
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast; // 토스트 엘리먼트 반환 (나중에 수동으로 제거할 수 있도록)
    }

    // 필터링 결과 토스트 메시지 표시
    showFilterResultToast(visibleCount, totalCount) {
        // 기존 로딩 토스트 제거
        const loadingToast = document.querySelector('.toast-message.loading');
        if (loadingToast) {
            loadingToast.remove();
        }

        // 결과 메시지 생성
        let message = '';
        let type = 'info';

        if (visibleCount === 0) {
            message = '검색 결과가 없습니다.';
            type = 'error';
        } else if (visibleCount === totalCount) {
            message = `전체 ${totalCount}개의 항목이 표시됩니다.`;
            type = 'success';
        } else {
            message = `전체 ${totalCount}개 중 ${visibleCount}개의 항목이 필터링되었습니다.`;
            type = 'success';
        }

        this.showToast(message, type);
    }
}

// 클래스를 전역 스코프에 노출
window.VendorFilter = VendorFilter; 