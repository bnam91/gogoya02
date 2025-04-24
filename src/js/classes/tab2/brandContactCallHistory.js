/**
 * 통화기록 관리 클래스
 * 통화기록 조회 및 수기 입력 기능 제공
 */
export class BrandContactCallHistory {
    constructor() {
        this.mongo = window.mongo;
        this.currentBrandName = '';
    }

    /**
     * 통화기록 목록을 렌더링
     * @param {string} brandName - 브랜드명
     * @returns {Promise<void>}
     */
    async renderCallHistory(brandName) {
        try {
            this.currentBrandName = brandName;
            const extraContent = document.querySelector('.extra-content');
            extraContent.innerHTML = '<h3>통화 기록</h3><p>기록을 불러오는 중...</p>';

            //const records = await this.mongo.getCallRecords(brandName);
            const records = await window.api.fetchCallRecords(brandName);

            if (!records || records.length === 0) {
                extraContent.innerHTML = `
                    <div class="call-history-header">
                        <h3>통화 기록</h3>
                        <button class="add-call-record-btn" title="통화기록 추가">
                            <span>+</span>
                        </button>
                    </div>
                    <p>이전 통화 기록이 없습니다.</p>
                `;
                this.addEventListeners();
                return;
            }

            let html = `
                <div class="call-history-header">
                    <h3>통화 기록</h3>
                    <button class="add-call-record-btn" title="통화기록 추가">
                        <span>+</span>
                    </button>
                </div>
            `;
            html += '<div class="call-history">';
            
            records.forEach(record => {
                console.log('✅ record:', record);
                
                const callDate = new Date(record.call_date);
                const duration = record.call_duration_sec;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;

                html += `
                    <div class="call-record" data-record-id="${record._id.toString()}">
                        <div class="call-record-header">
                            <span class="call-date">${callDate.toLocaleString()}</span>
                            <span class="call-duration">${minutes}분 ${seconds}초</span>    
                            ${record.is_manual ? '<span class="manual-indicator">수기입력</span>' : ''}
                        </div>
                        <div class="call-record-details">
                            <div class="record-item">
                                <label>통화 상태</label>
                                <span>${record.call_status}</span>
                            </div>
                            <div class="record-item">
                                <label>다음 단계</label>
                                <span class="nextstep" data-record-id="${record._id.toString()}" data-nextstep="${record.nextstep || ''}">${record.nextstep || '미설정'}</span>
                            </div>
                            <div class="record-item">
                                <label>메모</label>
                                <span class="notes" data-record-id="${record._id.toString()}">${record.notes || ''}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            extraContent.innerHTML = html;
            
            this.addEventListeners();
        } catch (error) {
            console.error('통화 기록 조회 중 오류:', error);
            const extraContent = document.querySelector('.extra-content');
            extraContent.innerHTML = `
                <h3>통화 기록</h3>
                <p>통화 기록을 불러오는 중 오류가 발생했습니다.</p>
            `;
        }
    }

    /**
     * 이벤트 리스너 추가
     */
    addEventListeners() {
        // 통화기록 추가 버튼 이벤트 리스너
        const addBtn = document.querySelector('.add-call-record-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddCallRecordForm());
        }

        // 통화기록 선택 이벤트 리스너
        const callRecords = document.querySelectorAll('.call-record');
        callRecords.forEach(record => {
            record.addEventListener('click', () => {
                // 기존 선택 해제
                callRecords.forEach(r => r.classList.remove('selected'));
                // 새 선택 적용
                record.classList.add('selected');
            });
        });

        // 다음단계 더블클릭 이벤트 리스너
        const nextstepElements = document.querySelectorAll('.nextstep');
        nextstepElements.forEach(nextstepElement => {
            nextstepElement.addEventListener('dblclick', async () => {
                const recordId = nextstepElement.dataset.recordId;
                const currentNextStep = nextstepElement.dataset.nextstep;
                this.editNextStep(nextstepElement, recordId, currentNextStep);
            });
        });

        // 메모 더블클릭 이벤트 리스너
        const notesElements = document.querySelectorAll('.notes');
        notesElements.forEach(notesElement => {
            notesElement.addEventListener('dblclick', async () => {
                const recordId = notesElement.dataset.recordId;
                const currentNotes = notesElement.textContent;
                this.editNotes(notesElement, recordId, currentNotes);
            });
        });
    }

    /**
     * 통화기록 추가 폼 표시
     */
    showAddCallRecordForm() {
        const extraContent = document.querySelector('.extra-content');
        const currentContent = extraContent.innerHTML;
        
        const form = document.createElement('div');
        form.className = 'manual-call-form';
        form.innerHTML = `
            <h3>통화기록 수기 추가</h3>
            <div class="form-group">
                <label for="manual-call-date">통화 일시</label>
                <input type="datetime-local" id="manual-call-date" class="form-control" value="${this.getCurrentDateTime()}">
            </div>
            <div class="form-group">
                <label for="manual-call-duration">통화 시간 (초)</label>
                <input type="number" id="manual-call-duration" class="form-control" min="0" value="0">
            </div>
            <div class="form-group">
                <label for="manual-call-status">통화 상태</label>
                <select id="manual-call-status" class="form-control">
                    <option value="">선택하세요</option>
                    <option value="연결됨">연결됨</option>
                    <option value="부재중">부재중</option>
                    <option value="기타오류">기타오류</option>
                </select>
            </div>
            <div class="form-group">
                <label for="manual-next-step">다음 단계</label>
                <select id="manual-next-step" class="form-control">
                    <option value="">선택하세요</option>
                    <option value="제안서 요청">제안서 요청</option>
                    <option value="재시도 예정">재시도 예정</option>
                    <option value="진행거절">진행거절</option>
                    <option value="번호오류">번호오류</option>
                    <option value="콜백대기">콜백대기</option>
                    <option value="기타">기타</option>
                </select>
            </div>
            <div class="form-group">
                <label for="manual-call-notes">메모</label>
                <textarea id="manual-call-notes" class="form-control" rows="4" placeholder="메모를 입력하세요"></textarea>
            </div>
            <div class="form-buttons">
                <button id="manual-save-btn" class="manual-save-btn">저장</button>
                <button id="manual-cancel-btn" class="manual-cancel-btn">취소</button>
            </div>
        `;
        
        extraContent.innerHTML = '';
        extraContent.appendChild(form);
        
        // 저장 버튼 이벤트 리스너
        const saveBtn = document.getElementById('manual-save-btn');
        saveBtn.addEventListener('click', () => this.saveManualCallRecord());
        
        // 취소 버튼 이벤트 리스너
        const cancelBtn = document.getElementById('manual-cancel-btn');
        cancelBtn.addEventListener('click', () => {
            extraContent.innerHTML = currentContent;
            this.addEventListeners();
        });
    }
    
    /**
     * 현재 날짜와 시간을 datetime-local 형식으로 반환
     * @returns {string} - YYYY-MM-DDThh:mm 형식의 문자열
     */
    getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    /**
     * 수기 통화기록 저장
     */
    async saveManualCallRecord() {
        const callDate = document.getElementById('manual-call-date').value;
        const callDuration = document.getElementById('manual-call-duration').value;
        const callStatus = document.getElementById('manual-call-status').value;
        const nextStep = document.getElementById('manual-next-step').value;
        const notes = document.getElementById('manual-call-notes').value;
        
        // 필수 필드 검증
        if (!callDate || !callStatus) {
            alert('통화 일시와 통화 상태는 필수 입력 항목입니다.');
            return;
        }
        
        try {
            // 브랜드 정보 가져오기
            //const brandPhoneData = await this.mongo.getBrandPhoneData(this.currentBrandName);
            const brandPhoneData = await window.api.fetchBrandPhoneData(this.currentBrandName);
            
            // 통화 기록 생성
            const callRecord = {
                brand_name: this.currentBrandName,
                customer_service_number: brandPhoneData?.customer_service_number || '',
                contact_person: brandPhoneData?.contact_person || '',
                call_date: new Date(callDate),
                call_duration_sec: parseInt(callDuration) || 0,
                call_status: callStatus,
                nextstep: nextStep,
                notes: notes,
                is_manual: true // 수기 입력 여부 표시
            };
            
            // 현재 선택된 카드의 ID가 있으면 추가
            const selectedCard = document.querySelector('.card.selected');
            if (selectedCard && selectedCard.dataset.id) {
                callRecord.card_id = selectedCard.dataset.id;
            }
            
            // 통화 기록 저장
            //await this.mongo.saveCallRecord(callRecord);
            await window.api.saveCallRecord(callRecord);
            
            // 성공 메시지 표시
            this.showToast('통화 기록이 저장되었습니다.', 'success');
            
            // 통화 기록 목록 새로고침
            await this.renderCallHistory(this.currentBrandName);
            
            // 선택된 카드의 통화 상태 업데이트
            if (selectedCard && callRecord.card_id) {
                this.updateCardCallStatus(selectedCard, callStatus, nextStep);
            }
        } catch (error) {
            console.error('통화 기록 저장 중 오류:', error);
            alert('통화 기록 저장 중 오류가 발생했습니다.');
        }
    }
    
    /**
     * 카드의 통화 상태 업데이트
     * @param {HTMLElement} card - 카드 요소
     * @param {string} callStatus - 통화 상태
     * @param {string} nextStep - 다음 단계
     */
    updateCardCallStatus(card, callStatus, nextStep) {
        const callStatusElement = card.querySelector('.call-status');
        if (callStatusElement) {
            const formattedDate = new Date().toLocaleDateString('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            callStatusElement.innerHTML = `
                <span class="status-value ${callStatus === '부재중' ? 'missed' : callStatus === '연결됨' ? 'connected' : ''}">
                    ${callStatus} (${formattedDate})
                </span>
                ${nextStep ? `<span class="next-step-value">${nextStep}</span>` : ''}
            `;
        }
    }
    
    /**
     * 다음 단계 수정
     * @param {HTMLElement} nextstepElement - 다음 단계 요소
     * @param {string} recordId - 기록 ID
     * @param {string} currentNextStep - 현재 다음 단계
     */
    editNextStep(nextstepElement, recordId, currentNextStep) {
        // 다음단계 수정 UI 생성
        const nextstepContainer = nextstepElement.parentElement;
        
        // 셀렉트 박스 생성
        const nextstepSelect = document.createElement('select');
        nextstepSelect.className = 'nextstep-select';
        
        // 옵션 추가
        const options = ['', '제안서 요청', '재시도 예정', '진행거절', '번호오류', '콜백대기', '기타'];
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option || '선택하세요';
            if (option === currentNextStep) {
                optionElement.selected = true;
            }
            nextstepSelect.appendChild(optionElement);
        });
        
        // 버튼 컨테이너 생성
        const nextstepButtons = document.createElement('div');
        nextstepButtons.className = 'nextstep-buttons';
        
        // 저장 버튼
        const saveButton = document.createElement('button');
        saveButton.className = 'nextstep-button nextstep-save';
        saveButton.textContent = '저장';
        
        // 취소 버튼
        const cancelButton = document.createElement('button');
        cancelButton.className = 'nextstep-button nextstep-cancel';
        cancelButton.textContent = '취소';
        
        nextstepButtons.appendChild(saveButton);
        nextstepButtons.appendChild(cancelButton);
        
        // 기존 다음단계 숨기기
        nextstepElement.style.display = 'none';
        
        // 수정 UI 추가
        nextstepContainer.appendChild(nextstepSelect);
        nextstepContainer.appendChild(nextstepButtons);
        
        // 저장 버튼 이벤트
        saveButton.onclick = async () => {
            const newNextStep = nextstepSelect.value;
            try {
                // MongoDB 업데이트
                //await this.mongo.updateCallRecord(recordId, { nextstep: newNextStep });
                await window.api.updateCallRecord(recordId, { nextstep: newNextStep });
                
                // UI 업데이트
                nextstepElement.textContent = newNextStep || '미설정';
                nextstepElement.dataset.nextstep = newNextStep;
                nextstepElement.style.display = 'inline';
                nextstepSelect.remove();
                nextstepButtons.remove();
                
                // 성공 메시지 표시
                this.showToast('다음 단계가 업데이트되었습니다.', 'success');
                
                // 선택된 카드의 통화 상태 업데이트
                await this.updateCardNextStep(recordId, newNextStep);
            } catch (error) {
                console.error('다음 단계 저장 중 오류:', error);
                alert('다음 단계 저장 중 오류가 발생했습니다.');
            }
        };
        
        // 취소 버튼 이벤트
        cancelButton.onclick = () => {
            nextstepElement.style.display = 'inline';
            nextstepSelect.remove();
            nextstepButtons.remove();
        };
    }
    
    /**
     * 메모 수정
     * @param {HTMLElement} notesElement - 메모 요소
     * @param {string} recordId - 기록 ID
     * @param {string} currentNotes - 현재 메모
     */
    editNotes(notesElement, recordId, currentNotes) {
        // 메모 수정 UI 생성
        const notesContainer = notesElement.parentElement;
        const notesInput = document.createElement('textarea');
        notesInput.className = 'notes-input';
        notesInput.value = currentNotes === '메모 없음' ? '' : currentNotes;
        
        const notesButtons = document.createElement('div');
        notesButtons.className = 'notes-buttons';
        
        const saveButton = document.createElement('button');
        saveButton.className = 'notes-button notes-save';
        saveButton.textContent = '저장';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'notes-button notes-cancel';
        cancelButton.textContent = '취소';
        
        notesButtons.appendChild(saveButton);
        notesButtons.appendChild(cancelButton);
        
        // 기존 메모 숨기기
        notesElement.style.display = 'none';
        
        // 수정 UI 추가
        notesContainer.appendChild(notesInput);
        notesContainer.appendChild(notesButtons);
        
        // 저장 버튼 이벤트
        saveButton.onclick = async () => {
            const newNotes = notesInput.value.trim();
            try {
                // MongoDB 업데이트
                //await this.mongo.updateCallRecord(recordId, { notes: newNotes });
                console.log('✅ 저장할 recordId:', recordId.toString());
                console.log('✅ 저장할 notes:', newNotes);  
                await window.api.updateCallRecord(recordId, { notes: newNotes });
                
                // UI 업데이트
                notesElement.textContent = newNotes || '메모 없음';
                notesElement.style.display = 'block';
                notesInput.remove();
                notesButtons.remove();
                
                // 성공 메시지 표시
                this.showToast('메모가 저장되었습니다.', 'success');
            } catch (error) {
                console.error('메모 저장 중 오류:', error);
                alert('메모 저장 중 오류가 발생했습니다.');
            }
        };
        
        // 취소 버튼 이벤트
        cancelButton.onclick = () => {
            notesElement.style.display = 'block';
            notesInput.remove();
            notesButtons.remove();
        };
        
        // 입력 필드에 포커스
        notesInput.focus();
    }
    
    /**
     * 카드의 다음 단계 업데이트
     * @param {string} recordId - 기록 ID
     * @param {string} newNextStep - 새 다음 단계
     */
    async updateCardNextStep(recordId, newNextStep) {
        try {
            // 해당 기록 조회
            // const record = await this.mongo.getCallRecordById(recordId);
            const record = await window.api.fetchCallRecordById(recordId);
            if (!record || !record.card_id) return;
            
            // 선택된 카드 찾기
            const selectedCard = document.querySelector(`.card[data-id="${record.card_id}"]`) || 
                                document.querySelector('.card.selected');
            
            if (selectedCard) {
                const callStatusElement = selectedCard.querySelector('.call-status');
                if (callStatusElement) {
                    // 기존 다음 단계 요소 찾기
                    const nextStepElement = callStatusElement.querySelector('.next-step-value');
                    
                    if (nextStepElement) {
                        // 있으면 업데이트
                        nextStepElement.textContent = newNextStep;
                    } else if (newNextStep) {
                        // 없으면 새로 추가
                        const newNextStepElement = document.createElement('span');
                        newNextStepElement.className = 'next-step-value';
                        newNextStepElement.textContent = newNextStep;
                        callStatusElement.appendChild(newNextStepElement);
                    }
                }
            }
        } catch (error) {
            console.error('카드 통화 상태 업데이트 중 오류:', error);
        }
    }
    
    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 메시지 타입 (success, error, info)
     */
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-text">${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 전역 인스턴스 생성
//window.brandContactCallHistory = new BrandContactCallHistory(); 