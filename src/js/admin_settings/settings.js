class SettingsManager {
    constructor() {
        this.container = document.querySelector('.settings-container');
    }

    init() {
        console.log('시스템 설정 탭 초기화');
        this.render();
    }

    render() {
        this.container.innerHTML = '대기중입니다';
    }
}

window.settingsManager = new SettingsManager(); 