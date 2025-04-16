class SellerMatchManager {
    constructor() {
        this.container = document.querySelector('.sellerMatch-container');
    }

    init() {
        console.log('셀러매칭 탭 초기화');
        this.render();
    }

    render() {
        // 초기 렌더링 로직
        this.container.innerHTML = '대기중입니다';
    }
}

// 전역 인스턴스 생성
window.sellerMatchManager = new SellerMatchManager();
