class VendorFilter {
    constructor() {
        this.selectedCategories = [];
        this.selectedGrades = [];
        this.selectedNextSteps = [];
        this.filterContainer = null;
        this.searchQuery = '';
        this.hasBrandInfo = null; // 브랜드 정보 유무 필터 상태
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
    }

    init() {
        // 이미 존재하는 필터 컨테이너가 있다면 제거
        const existingFilter = document.querySelector('.filter-container');
        if (existingFilter) {
            existingFilter.remove();
        }
        this.createFilterUI();
        this.setupEventListeners();
    }

    createFilterUI() {
        // 브레드크럼 아래에 필터 컨테이너 추가
        const breadcrumb = document.querySelector('.breadcrumb');
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

        // 검색 입력 이벤트
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterCards();
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
            radio.addEventListener('change', (e) => {
                this.hasBrandInfo = e.target.value === 'all' ? null : e.target.value === 'has';
                this.updateSelectedBrandInfoDisplay();
                this.filterCards();
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

        // 디스플레이 텍스트 초기화
        this.updateSelectedItemsDisplay();
        this.updateSelectedGradesDisplay();
        this.updateSelectedNextStepsDisplay();
        this.updateSelectedBrandInfoDisplay();

        // 카드 필터링 초기화
        this.filterCards();

        // 초기화 버튼 애니메이션
        const resetButton = this.filterContainer.querySelector('.filter-reset-button');
        resetButton.classList.add('rotate');
        setTimeout(() => {
            resetButton.classList.remove('rotate');
        }, 300);
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

    filterCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const brandName = card.querySelector('.brand-name').textContent.toLowerCase();
            const category = card.querySelector('.item-category').textContent;
            const grade = card.querySelector('.grade-value').textContent;
            const nextStep = card.querySelector('.next-step-value')?.textContent || '';
            const hasBrandInfo = card.dataset.hasBrandInfo === 'true';

            const matchesSearch = !this.searchQuery || brandName.includes(this.searchQuery);
            const matchesCategory = this.selectedCategories.length === 0 || this.selectedCategories.includes(category);
            const matchesGrade = this.selectedGrades.length === 0 || this.selectedGrades.includes(grade);
            const matchesNextStep = this.selectedNextSteps.length === 0 || this.selectedNextSteps.includes(nextStep);
            const matchesBrandInfo = this.hasBrandInfo === null || (this.hasBrandInfo === hasBrandInfo);

            if (matchesSearch && matchesCategory && matchesGrade && matchesNextStep && matchesBrandInfo) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// 필터 인스턴스 생성 및 초기화
const vendorFilter = new VendorFilter();
module.exports = vendorFilter; 