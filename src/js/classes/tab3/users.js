class UsersManager {
    constructor() {
        this.container = document.querySelector('.users-container');
    }

    init() {
        console.log('사용자 관리 탭 초기화');
        this.render();
    }

    render() {
        this.container.innerHTML = '대기중입니다';
    }
}

window.usersManager = new UsersManager(); 