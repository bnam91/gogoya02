class SellerMatchFilter {
    constructor() {
        this.container = null;
        this.categoryFilter = null;
        this.percentageInput = null;
        this.searchInput = null;
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

        if (!this.categoryFilter || !this.percentageInput || !this.searchInput) {
            console.error('필터 요소를 찾을 수 없습니다.');
            return;
        }

        this.categoryFilter.addEventListener('change', () => this.handleFilterChange());
        this.percentageInput.addEventListener('input', () => this.handleFilterChange());
        this.searchInput.addEventListener('input', () => this.handleFilterChange());
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
        if (!this.categoryFilter || !this.percentageInput || !this.searchInput) {
            console.error('필터 요소가 초기화되지 않았습니다.');
            return influencers;
        }

        const selectedCategory = this.categoryFilter.value;
        const percentage = parseInt(this.percentageInput.value) || 0;
        const searchText = this.searchInput.value.toLowerCase();

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

            return true;
        });
    }
}

// 전역 인스턴스 생성
window.sellerMatchFilter = new SellerMatchFilter(); 