class SellerMatchFilter {
    constructor() {
        this.container = null;
        this.categoryFilter = null;
        this.percentageInput = null;
        this.onFilterChange = null;
    }

    init() {
        if (!this.container) {
            console.error('필터 컨테이너가 없습니다.');
            return;
        }

        this.categoryFilter = this.container.querySelector('#category-filter');
        this.percentageInput = this.container.querySelector('#category-percentage');

        if (!this.categoryFilter || !this.percentageInput) {
            console.error('필터 요소를 찾을 수 없습니다.');
            return;
        }

        this.categoryFilter.addEventListener('change', () => this.handleFilterChange());
        this.percentageInput.addEventListener('input', () => this.handleFilterChange());
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
        if (!this.categoryFilter || !this.percentageInput) {
            console.error('필터 요소가 초기화되지 않았습니다.');
            return influencers;
        }

        const selectedCategory = this.categoryFilter.value;
        const percentage = parseInt(this.percentageInput.value) || 0;

        if (!selectedCategory) {
            return influencers;
        }

        return influencers.filter(influencer => {
            if (!influencer.category) return false;
            
            const categoryPattern = new RegExp(`${selectedCategory}\\((\\d+)%\\)`);
            const match = influencer.category.match(categoryPattern);
            
            if (!match) return false;
            
            const categoryPercentage = parseInt(match[1]);
            return categoryPercentage >= percentage;
        });
    }
}

// 전역 인스턴스 생성
window.sellerMatchFilter = new SellerMatchFilter(); 