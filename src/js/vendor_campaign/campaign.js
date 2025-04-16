class CampaignManager {
    constructor() {
        this.container = document.querySelector('.campaign-container');
    }

    init() {
        console.log('캠페인 관리 탭 초기화');
        this.render();
    }

    render() {
        // 초기 렌더링 로직
        this.container.innerHTML = '대기중입니다';
    }
}

// 전역 인스턴스 생성
window.campaignManager = new CampaignManager();
