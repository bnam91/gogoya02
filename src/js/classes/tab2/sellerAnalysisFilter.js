export class SellerAnalysisFilter {
    constructor() {
        this.container = null;
        this.categoryFilter = null;
        this.percentageInput = null;
        this.searchInput = null;
        this.reelsViewsFilter = null;
        this.customReelsViews = null;
        this.reelsViewsMin = null;
        this.reelsViewsMax = null;
        this.onFilterChange = null;
    }

    init() {
        if (!this.container) {
            console.error('필터 컨테이너가 없습니다.');
            return;
        }

        this.categoryFilter = this.container.querySelector('#category-filter');
        this.percentageInput = this.container.querySelector('#category-percentage');
        this.searchInput = this.container.querySelector('#name-search');
        this.reelsViewsFilter = this.container.querySelector('#reels-views-filter');
        this.customReelsViews = this.container.querySelector('#custom-reels-views');
        this.reelsViewsMin = this.container.querySelector('#reels-views-min');
        this.reelsViewsMax = this.container.querySelector('#reels-views-max');
        this.resetButton = this.container.querySelector('#reset-filters');

        if (!this.categoryFilter || !this.percentageInput || !this.searchInput || !this.reelsViewsFilter || 
            !this.customReelsViews || !this.reelsViewsMin || !this.reelsViewsMax || !this.resetButton) {
            console.error('필터 요소를 찾을 수 없습니다.');
            return;
        }

        this.categoryFilter.addEventListener('change', () => this.handleFilterChange());
        this.percentageInput.addEventListener('input', () => this.handleFilterChange());
        this.searchInput.addEventListener('input', () => this.handleFilterChange());
        this.reelsViewsFilter.addEventListener('change', () => this.handleReelsViewsFilterChange());
        this.reelsViewsMin.addEventListener('input', () => this.handleFilterChange());
        this.reelsViewsMax.addEventListener('input', () => this.handleFilterChange());
        this.resetButton.addEventListener('click', () => this.resetFilters());
    }

    resetFilters() {
        // 모든 필터 값을 초기화
        this.categoryFilter.value = '';
        this.percentageInput.value = '0';
        this.searchInput.value = '';
        this.reelsViewsFilter.value = '';
        this.reelsViewsMin.value = '';
        this.reelsViewsMax.value = '';
        this.customReelsViews.style.display = 'none';

        // 필터 변경 이벤트 발생
        this.handleFilterChange();
    }

    handleReelsViewsFilterChange() {
        if (this.reelsViewsFilter.value === 'custom') {
            this.customReelsViews.style.display = 'flex';
        } else {
            this.customReelsViews.style.display = 'none';
            this.handleFilterChange();
        }
    }

    handleFilterChange() {
        if (this.onFilterChange) {
            this.onFilterChange();
        }
    }

    setOnFilterChange(callback) {
        this.onFilterChange = callback;
    }

    filterInfluencers(influencers) {
        if (!this.categoryFilter || !this.percentageInput || !this.searchInput || !this.reelsViewsFilter) {
            console.error('필터 요소가 초기화되지 않았습니다.');
            return influencers;
        }

        const selectedCategory = this.categoryFilter.value;
        const percentage = parseInt(this.percentageInput.value) || 0;
        const searchText = this.searchInput.value.toLowerCase();
        const reelsViewsRange = this.reelsViewsFilter.value;

        return influencers.filter(influencer => {
            // 카테고리 필터링
            if (selectedCategory) {
                if (!influencer.category) return false;
                
                const categoryPattern = new RegExp(`${selectedCategory}\\((\\d+)%\\)`);
                const match = influencer.category.match(categoryPattern);
                
                if (!match) return false;
                
                const categoryPercentage = parseInt(match[1]);
                if (categoryPercentage < percentage) return false;
            }

            // 이름 검색 필터링
            if (searchText) {
                const username = (influencer.username || '').toLowerCase();
                const cleanName = (influencer.clean_name || '').toLowerCase();
                if (!username.includes(searchText) && !cleanName.includes(searchText)) {
                    return false;
                }
            }

            // 릴스뷰 필터링
            if (reelsViewsRange) {
                const views = influencer.reels_views_num || 0;
                
                if (reelsViewsRange === 'custom') {
                    const min = parseInt(this.reelsViewsMin.value) || 0;
                    const max = parseInt(this.reelsViewsMax.value);
                    
                    if (max) {
                        if (views < min || views > max) return false;
                    } else {
                        if (views < min) return false;
                    }
                } else {
                    const [min, max] = reelsViewsRange.split('-').map(Number);
                    
                    if (max === undefined) {
                        // "100만 이상" 케이스
                        if (views < min) return false;
                    } else {
                        if (views < min || views >= max) return false;
                    }
                }
            }

            return true;
        });
    }
}

// 전역 인스턴스 생성
//window.sellerAnalysisFilter = new SellerAnalysisFilter(); 