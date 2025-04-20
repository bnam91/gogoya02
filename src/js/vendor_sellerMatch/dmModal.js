class DmModal {
    constructor() {
        this.modal = null;
        this.brandInput = null;
        this.itemInput = null;
        this.init();
    }

    init() {
        // 모달 HTML 생성
        const modalHTML = `
            <div id="dm-modal" class="modal">
                <div class="modal-content">
                    <h3>DM 보내기</h3>
                    <div class="modal-buttons">
                        <div class="sheet-buttons-row">
                            <button class="modal-button sheet-button" onclick="window.dmModal.openDmSheet()">
                                <i class="fas fa-users"></i> DM 인원시트
                            </button>
                            <button class="modal-button sheet-button" onclick="window.dmModal.openTemplateSheet()">
                                <i class="fas fa-file-alt"></i> DM 템플릿
                            </button>
                        </div>
                    </div>
                    <div class="modal-input-group">
                        <label for="brand-input">브랜드</label>
                        <input type="text" id="brand-input" placeholder="브랜드명을 입력하세요">
                    </div>
                    <div class="modal-input-group">
                        <label for="item-input">아이템</label>
                        <input type="text" id="item-input" placeholder="아이템명을 입력하세요">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button upload-button" onclick="window.dmModal.upload()">인원 업로드 하기</button>
                        <button class="modal-button cancel" onclick="window.dmModal.close()">취소</button>
                    </div>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 모달 요소 참조
        this.modal = document.getElementById('dm-modal');
        this.brandInput = document.getElementById('brand-input');
        this.itemInput = document.getElementById('item-input');
    }

    open() {
        this.modal.style.display = 'block';
    }

    close() {
        this.modal.style.display = 'none';
        this.brandInput.value = '';
        this.itemInput.value = '';
    }

    openDmSheet() {
        window.open('https://docs.google.com/spreadsheets/d/1VhEWeQASyv02knIghpcccYLgWfJCe2ylUnPsQ_-KNAI/edit?gid=1878271662#gid=1878271662', '_blank');
    }

    openTemplateSheet() {
        window.open('https://docs.google.com/spreadsheets/d/1mwZ37jiEGK7rQnLWp87yUQZHyM6LHb4q6mbB0A07fI0/edit?gid=1722323555#gid=1722323555', '_blank');
    }

    upload() {
        // 업로드 기능 구현 예정
        console.log('업로드 기능 구현 예정');
    }

    getBrand() {
        return this.brandInput.value.trim();
    }

    getItem() {
        return this.itemInput.value.trim();
    }
}

// 전역 인스턴스 생성
window.dmModal = new DmModal(); 