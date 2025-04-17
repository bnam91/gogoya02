class MailManager {
    constructor(requestManager) {
        this.requestManager = requestManager;
        this.mailCache = new Map();
    }

    // 메일 폼 초기화
    initializeMailForm() {
        this.addSendButtonListener();
    }

    // 현재 메일 내용 저장
    saveCurrentMailContent() {
        const mailToInput = document.getElementById('mail-to');
        if (!mailToInput || !mailToInput.value) return;

        const currentBrandEmail = mailToInput.value;
        const currentBrand = this.requestManager.brands.find(b => b.email === currentBrandEmail);
        if (!currentBrand) return;

        const mailContent = {
            subject: document.getElementById('mail-subject').value,
            body: document.getElementById('mail-content').value
        };

        this.mailCache.set(currentBrand.brand_name, mailContent);
        console.log(`${currentBrand.brand_name}의 메일 내용 저장:`, mailContent);
    }

    // 저장된 메일 내용 복원
    restoreMailContent(brandName) {
        const savedContent = this.mailCache.get(brandName);
        const subjectInput = document.getElementById('mail-subject');
        const contentInput = document.getElementById('mail-content');

        if (savedContent) {
            subjectInput.value = savedContent.subject;
            contentInput.value = savedContent.body;
            console.log(`${brandName}의 저장된 메일 내용 복원:`, savedContent);
        } else {
            subjectInput.value = '';
            contentInput.value = '';
            console.log(`${brandName}의 저장된 메일 내용 없음, 폼 초기화`);
        }
    }

    // 보내기 버튼 이벤트 리스너
    addSendButtonListener() {
        const sendButton = document.querySelector('.mail-button.send');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleSendButtonClick());
        }
    }

    // ... (나머지 메일 관련 메서드들)
}

export default MailManager; 