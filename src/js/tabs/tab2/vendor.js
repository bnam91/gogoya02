/**
 * vendor.js
 * @fileoverview 벤더 탭 초기화
 */

// 필요한 클래스 import
import { VendorCallHistory, VendorCallManager, VendorFilter, VendorInfoEditor } from '../../classes/tab2/index.js';

// 인스턴스 생성
const vendorCallManager = new VendorCallManager();
const vendorFilter = new VendorFilter();
const vendorInfoEditor = new VendorInfoEditor();
const vendorCallHistory = new VendorCallHistory();

export function initPage() {
    console.log('initPage Vendor');
  
    // 인스턴스 생성
    /*
    window.vendorFilter = new VendorFilter();
    window.vendorCallManager = new VendorCallManager();
    window.vendorInfoEditor = new VendorInfoEditor();
    window.vendorCallHistory = new VendorCallHistory();
    */

    // 데이터 초기화
    currentSkip = 0;
    hasMoreData = true;
    selectedCardIndex = -1;
    cardData = []; // 데이터 초기화
    loadVendorData(true);
    
    const vendorLeft = document.querySelector('.vendor-left');
    vendorLeft.addEventListener('scroll', handleScroll);
    
    // 우측 패널 초기화
    const rightPanel = document.querySelector('.vendor-right');
    rightPanel.innerHTML = '<p>카드를 선택하면 브랜드 정보가 표시됩니다.</p>';

    // 필터 초기화
    /*
    if (window.vendorFilter && typeof window.vendorFilter.init === 'function') {
        window.vendorFilter.init();
        */
    if (vendorFilter && typeof vendorFilter.init === 'function') {
        vendorFilter.init();
    } else {
        console.error('vendorFilter가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}

let isLoading = false;
let currentSkip = 0;
let hasMoreData = true;
let selectedCardIndex = -1;
let cardData = []; // 카드 데이터를 저장할 배열
let currentBrandData = null;

// 전역 변수들을 window.vendor 객체에 노출
window.vendor = {
    get currentSkip() { return currentSkip; },
    set currentSkip(value) { currentSkip = value; },
    get hasMoreData() { return hasMoreData; },
    set hasMoreData(value) { hasMoreData = value; },
    get cardData() { return cardData; },
    set cardData(value) { cardData = value; },
    loadVendorData
};

function updateCallDuration() {
    console.log('updateCallDuration');
    if (!vendorCallManager.callStartTime || !vendorCallManager.isCalling) return;
    
    const now = new Date();
    const duration = Math.floor((now - vendorCallManager.callStartTime) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    const durationElement = document.querySelector('.call-duration');
    if (durationElement) {
        durationElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

async function handleCall(phoneNumber) {
    console.log('handleCall');
    try {
        if (vendorCallManager.isCalling) {
            await vendorCallManager.endCall();
        } else {
            // 모달창 표시
            const modal = document.getElementById('call-confirm-modal');
            const phoneNumberElement = modal.querySelector('.phone-number');
            phoneNumberElement.textContent = phoneNumber;
            
            // 모달창 표시
            modal.style.display = 'block';
            
            // 모달창 버튼 이벤트 리스너
            return new Promise((resolve) => {
                const confirmButton = modal.querySelector('.modal-button.confirm');
                const cancelButton = modal.querySelector('.modal-button.cancel');
                
                const handleConfirm = async () => {
                    modal.style.display = 'none';
                    
                    try {
                        vendorCallManager.setCurrentBrandData(currentBrandData);
                        await vendorCallManager.startCall(phoneNumber);
                        
                        // 통화 상태 폼 표시
                        const callForm = document.createElement('div');
                        callForm.className = 'call-status-form';
                        callForm.innerHTML = `
                            <div class="call-info">
                                <h3>통화 기록</h3>
                                <p>브랜드: <span class="brand-name">${currentBrandData.brand_name}</span></p>
                                <p>통화 시간: <span class="call-duration">00:00:00</span></p>
                            </div>
                            <div class="call-form">
                                <div class="form-group">
                                    <label for="call-status">통화 상태</label>
                                    <select id="call-status">
                                        <option value="">선택하세요</option>
                                        <option value="연결됨">연결됨</option>
                                        <option value="부재중">부재중</option>
                                        <option value="기타오류">기타오류</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="next-step">다음 단계</label>
                                    <select id="next-step">
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
                                    <label for="call-notes">메모</label>
                                    <textarea id="call-notes" rows="3" placeholder="메모를 입력하세요"></textarea>
                                </div>
                                <div class="form-buttons">
                                    <button class="end-call-button">통화 종료</button>
                                    <button class="save-button" style="display: none;">저장</button>
                                    <button class="cancel-button" style="display: none;">취소</button>
                                </div>
                            </div>
                        `;
                        
                        // 추가 정보 영역에 통화 상태 폼 추가
                        const extraContent = document.querySelector('.extra-content');
                        extraContent.innerHTML = ''; // 기존 내용 제거
                        extraContent.appendChild(callForm);
                        
                        // 통화 종료 버튼 이벤트 리스너
                        const endCallButton = callForm.querySelector('.end-call-button');
                        endCallButton.onclick = async () => {
                            const duration = await vendorCallManager.endCall();
                            if (duration) {
                                // 버튼 상태 업데이트
                                const callButton = document.querySelector('.call-button');
                                if (callButton) {
                                    callButton.textContent = '통화하기';
                                    callButton.classList.remove('end-call');
                                }
                                
                                // 통화 종료 후 메모 입력 활성화
                                const callNotes = document.getElementById('call-notes');
                                if (callNotes) {
                                    callNotes.disabled = false;
                                    callNotes.focus();
                                }
                                
                                // 저장과 취소 버튼 표시
                                const saveButton = callForm.querySelector('.save-button');
                                const cancelButton = callForm.querySelector('.cancel-button');
                                if (saveButton) saveButton.style.display = 'inline-block';
                                if (cancelButton) cancelButton.style.display = 'inline-block';
                                
                                // 통화 종료 버튼 숨기기
                                endCallButton.style.display = 'none';
                            }
                        };
                        
                        // 저장 버튼 이벤트 리스너
                        const saveButton = callForm.querySelector('.save-button');
                        saveButton.onclick = async () => {
                            const callStatus = document.getElementById('call-status').value;
                            const nextStep = document.getElementById('next-step').value;
                            const notes = document.getElementById('call-notes').value;
                            
                            // 필수 값 검증
                            if (!callStatus || !nextStep) {
                                alert('통화 상태와 다음 단계를 선택해주세요.');
                                return;
                            }
                            
                            try {
                                await saveCallRecord();
                            } catch (error) {
                                console.error('통화 기록 저장 중 오류:', error);
                                alert('통화 기록 저장 중 오류가 발생했습니다.');
                            }
                        };
                        
                        // 취소 버튼 이벤트 리스너
                        const cancelButton = callForm.querySelector('.cancel-button');
                        cancelButton.onclick = () => {
                            // 추가 정보 영역 초기화
                            const extraContent = document.querySelector('.extra-content');
                            extraContent.innerHTML = `
                                <h3>추가 정보</h3>
                                <p>여기에 추가 정보가 표시됩니다.</p>
                            `;
                        };
                        
                        resolve(true);
                    } catch (error) {
                        console.error('전화 연결 중 오류:', error);
                        alert('전화 연결 중 오류가 발생했습니다.');
                        resolve(false);
                    }
                };
                
                const handleCancel = () => {
                    modal.style.display = 'none';
                    resolve(false);
                };
                
                confirmButton.onclick = handleConfirm;
                cancelButton.onclick = handleCancel;
            });
        }
    } catch (error) {
        console.error('전화 연결 중 오류:', error);
        alert('전화 연결 중 오류가 발생했습니다.');
    }
}

async function updateCallHistory(brandName) {
    console.log('updateCallHistory');
    try {
        // vendorCallHistory 모듈을 사용하여 통화 기록 렌더링
        /*
        if (window.vendorCallHistory) {
            await window.vendorCallHistory.renderCallHistory(brandName);
        */
        if (vendorCallHistory) {
                await vendorCallHistory.renderCallHistory(brandName);
        } else {
            console.error('vendorCallHistory 모듈을 찾을 수 없습니다.');
            throw new Error('vendorCallHistory 모듈을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('통화 기록 조회 중 오류:', error);
        const extraContent = document.querySelector('.extra-content');
        extraContent.innerHTML = `
            <h3>통화 기록</h3>
            <p>통화 기록을 불러오는 중 오류가 발생했습니다.</p>
        `;
    }
}

// 선택된 카드의 통화 상태 업데이트 (다음 단계 포함)
async function updateCardCallStatus(recordId, newNextStep) {
    console.log('updateCardCallStatus');
    try {
        // 일반적으로 vendorCallHistory 모듈을 사용하지만, 
        // 호환성을 위해 기존 코드도 유지합니다.
        /*
        if (window.vendorCallHistory) {
            // vendorCallHistory 모듈의 메서드 호출
            await window.vendorCallHistory.updateCardNextStep(recordId, newNextStep);
            return;
        }
        */
        if (vendorCallHistory) {
            // vendorCallHistory 모듈의 메서드 호출
            await vendorCallHistory.updateCardNextStep(recordId, newNextStep);
            return;
        }
        
        // 기존 코드 (이전 버전 호환성을 위해 유지)
        // 해당 기록 조회
        //const record = await mongo.getCallRecordById(recordId);
        const record = await window.api.fetchgetCallRecordById(recordId);
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

// 브랜드 정보 패널
//async function updateRightPanel(item) {
async function updateBrandInfoPanel(item) {
    console.log('updateRightPanel');
    const rightPanel = document.querySelector('.vendor-right');
    const extraContent = document.querySelector('.extra-content');
    
    if (!item) {
        rightPanel.innerHTML = '<p>브랜드 정보가 없습니다.</p>';
        extraContent.innerHTML = '<h3>통화 기록</h3><p>카드를 선택하면 통화 기록이 표시됩니다.</p>';
        return;
    }

    // 로딩 상태 표시
    rightPanel.innerHTML = '<p>브랜드 정보를 불러오는 중...</p>';
    extraContent.innerHTML = '<h3>통화 기록</h3><p>통화 기록을 불러오는 중...</p>';

    try {
        const brandName = item.brand;
        //const brandPhoneData = await mongo.getBrandPhoneData(brandName);
        const brandPhoneData = await window.api.fetchBrandPhoneData(brandName);
        
        // 현재 브랜드 데이터 저장
        currentBrandData = {
            ...brandPhoneData,
            _id: item._id,
            brand: item.brand,
            brand_name: item.brand_name || brandPhoneData.brand_name,
            customer_service_number: brandPhoneData.customer_service_number,
            contact_person: brandPhoneData.contact_person
        };

        // vendorInfoEditor에 현재 브랜드 데이터 설정
        vendorInfoEditor.setCurrentBrandData(currentBrandData);
        
        if (!brandPhoneData) {
            rightPanel.innerHTML = `
                <div class="brand-info-header">
                    <h3>${brandName}</h3>
                    <p>해당 브랜드의 상세 정보가 없습니다.</p>
                </div>
            `;
            return;
        }

        // 브랜드 정보 표시
        let html = `
            <div class="brand-info-container">
                <div class="brand-info-header">
                    <h3>${brandName}</h3>
                    ${brandPhoneData.screenshot ? 
                        `<div class="brand-screenshot">
                            <img src="${brandPhoneData.screenshot}" alt="${brandName} 스크린샷">
                        </div>` : ''
                    }
                </div>

                <div class="brand-info-grid">
                    <div class="info-section">
                        <h4>기본 정보</h4>
                        <div class="info-group">
                            <div class="info-item">
                                <label>브랜드명</label>
                                <span>${brandPhoneData.brand_name || '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>회사명</label>
                                <span>${brandPhoneData.company_name || '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>도메인 유형</label>
                                <span>${brandPhoneData.domain_type || '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>인증 여부</label>
                                <span class="verification-status editable" data-status="${brandPhoneData.is_verified}">${
                                    brandPhoneData.is_verified === 'true' ? '<span class="status-badge verified">인증완료</span>' :
                                    brandPhoneData.is_verified === 'false' ? '<span class="status-badge unverified">미인증</span>' :
                                    brandPhoneData.is_verified === 'yet' ? '<span class="status-badge pending">대기중</span>' :
                                    brandPhoneData.is_verified === 'skip' ? '<span class="status-badge skip">스킵</span>' :
                                    '<span class="status-badge unknown">알 수 없음</span>'
                                }</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>연락처 정보</h4>
                        <div class="info-group">
                            <div class="info-item">
                                <label>고객센터</label>
                                <div class="phone-info">
                                    <span class="phone-number editable" data-field="customer_service_number">
                                        ${brandPhoneData.customer_service_number || '-'}
                                    </span>
                                    ${brandPhoneData.customer_service_number ? `
                                        <button class="call-button ${vendorCallManager.isCalling ? 'end-call' : ''}" data-phone="${brandPhoneData.customer_service_number}">
                                            ${vendorCallManager.isCalling ? '통화종료' : '통화하기'}
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="info-item">
                                <label>이메일</label>
                                <span class="editable" data-field="email">${brandPhoneData.email || '-'}</span>
                            </div>
                            <div class="info-item full-width">
                                <label>사업장 주소</label>
                                <span class="editable" data-field="business_address">${brandPhoneData.business_address || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>웹사이트 정보</h4>
                        <div class="info-group">
                            <div class="info-item">
                                <label>공식 웹사이트</label>
                                <a href="${brandPhoneData.official_website_url}" class="link">
                                    ${brandPhoneData.official_website_url || '-'}
                                </a>
                            </div>
                            <div class="info-item">
                                <label>실제 도메인</label>
                                <a href="${brandPhoneData.actual_domain_url}" class="link">
                                    ${brandPhoneData.actual_domain_url || '-'}
                                </a>
                            </div>
                            <div class="info-item">
                                <label>검색 URL</label>
                                <a href="${brandPhoneData.search_url}" target="_blank" class="link">
                                    네이버 검색 결과
                                </a>
                            </div>
                        </div>
                    </div>

                    ${brandPhoneData.aliases && brandPhoneData.aliases.length > 0 ? `
                        <div class="info-section">
                            <h4>별칭</h4>
                            <div class="info-group">
                                <div class="info-item">
                                    <div class="aliases-list">
                                        ${brandPhoneData.aliases.join(', ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        rightPanel.innerHTML = html;

        // 통화하기 버튼 이벤트 리스너 추가
        const callButton = rightPanel.querySelector('.call-button');
        if (callButton) {
            callButton.addEventListener('click', async () => {
                const phoneNumber = callButton.dataset.phone;
                if (phoneNumber) {
                    await handleCall(phoneNumber);
                    // 버튼 텍스트와 스타일 업데이트
                    callButton.textContent = vendorCallManager.isCalling ? '통화종료' : '통화하기';
                    if (vendorCallManager.isCalling) {
                        callButton.classList.add('end-call');
                    } else {
                        callButton.classList.remove('end-call');
                    }
                }
            });
        }

        // 통화 기록 업데이트
        await updateCallHistory(brandPhoneData.brand_name);

        // 인증 상태 변경 이벤트 리스너 추가
        const verificationStatus = rightPanel.querySelector('.verification-status');
        if (verificationStatus) {
            verificationStatus.addEventListener('click', async () => {
                const currentStatus = brandPhoneData.is_verified;
                let newStatus;
                
                // 상태 순환: 'yet' -> 'true' -> 'false' -> 'skip' -> 'yet'
                if (currentStatus === 'yet') {
                    newStatus = 'true';
                } else if (currentStatus === 'true') {
                    newStatus = 'false';
                } else if (currentStatus === 'false') {
                    newStatus = 'skip';
                } else {
                    newStatus = 'yet';
                }
                
                try {
                    // MongoDB 업데이트
                    //await mongo.updateBrandInfo(brandPhoneData.brand_name, {
                    //    is_verified: newStatus
                    //});
                    await window.api.updateBrandInfo(brandPhoneData.brand_name, {
                        is_verified: newStatus
                    });
                    
                    // UI 업데이트
                    brandPhoneData.is_verified = newStatus;
                    verificationStatus.setAttribute('data-status', newStatus);
                    verificationStatus.innerHTML = 
                        newStatus === 'true' ? '<span class="status-badge verified">인증완료</span>' :
                        newStatus === 'false' ? '<span class="status-badge unverified">미인증</span>' :
                        newStatus === 'yet' ? '<span class="status-badge pending">대기중</span>' :
                        newStatus === 'skip' ? '<span class="status-badge skip">스킵</span>' :
                        '<span class="status-badge unknown">알 수 없음</span>';
                    
                    // 성공 메시지 표시
                    // 기존 토스트 제거
                    const existingToast = document.querySelector('.toast-message');
                    if (existingToast) {
                        existingToast.remove();
                    }

                    const toast = document.createElement('div');
                    toast.className = 'toast-message success';
                    toast.style.zIndex = '9999';
                    toast.innerHTML = `
                        <span class="toast-icon">✓</span>
                        <span class="toast-text">인증 상태가 업데이트되었습니다.</span>
                    `;
                    document.body.appendChild(toast);
                    
                    // 3초 후 토스트 메시지 제거
                    setTimeout(() => {
                        toast.classList.add('fade-out');
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                    
                } catch (error) {
                    console.error('인증 상태 업데이트 중 오류:', error);
                    alert('인증 상태 업데이트 중 오류가 발생했습니다.');
                }
            });
        }
        
    } catch (error) {
        console.error('브랜드 정보 로드 중 오류:', error);
        rightPanel.innerHTML = '<p>브랜드 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

async function selectCard(index) {
    console.log('selectCard');
    // 통화 중일 때는 카드 선택 방지
    if (vendorCallManager.isCalling) {
        alert('통화 중에는 다른 카드를 선택할 수 없습니다.');
        return;
    }

    // 통화 상태 폼이 표시되어 있고 저장되지 않은 경우 카드 선택 방지
    const callForm = document.querySelector('.call-status-form');
    if (callForm && callForm.querySelector('.save-button').style.display === 'inline-block') {
        alert('통화 기록을 먼저 저장해주세요.');
        return;
    }

    // 기존 카드 선택 해제
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('selected'));
    
    // 새 카드 선택
    if (index >= 0 && index < cardData.length) {
        const selectedCard = cards[index];
        selectedCard.classList.add('selected');
        selectedCardIndex = index;
        currentBrandData = cardData[index];
        
        // 우측 패널 업데이트
        //await updateRightPanel(currentBrandData);
        await updateBrandInfoPanel(currentBrandData);
    }
}

// 키보드 이벤트 핸들러 추가
document.addEventListener('keydown', async (event) => {
    console.log('keydown', event);
    const modal = document.getElementById('call-confirm-modal');
    
    // ESC 키로 모달창 닫기
    if (event.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        return;
    }
    
    // Ctrl + 스페이스바로 통화하기
    if (event.key === ' ' && event.ctrlKey && selectedCardIndex !== -1) {
        // 스페이스바의 기본 동작(스크롤) 방지
        event.preventDefault();
        
        const callButton = document.querySelector('.call-button');
        if (callButton) {
            const phoneNumber = callButton.dataset.phone;
            if (phoneNumber) {
                if (vendorCallManager.isCalling) {
                    await handleCall(phoneNumber);
                    // 버튼 텍스트와 스타일 업데이트
                    callButton.textContent = vendorCallManager.isCalling ? '통화종료' : '통화하기';
                    if (vendorCallManager.isCalling) {
                        callButton.classList.add('end-call');
                    } else {
                        callButton.classList.remove('end-call');
                    }
                } else {
                    const result = await handleCall(phoneNumber);
                    if (result) {
                        // 버튼 텍스트와 스타일 업데이트
                        callButton.textContent = vendorCallManager.isCalling ? '통화종료' : '통화하기';
                        if (vendorCallManager.isCalling) {
                            callButton.classList.add('end-call');
                        } else {
                            callButton.classList.remove('end-call');
                        }
                    }
                }
            }
        }
    }
});

async function handleKeyDown(e) {
    console.log('handleKeyDown');
    if (!document.getElementById('vendor-content').classList.contains('active')) {
        return;
    }

    // 필터링된 카드만 가져오기
    const visibleCards = Array.from(document.querySelectorAll('.card')).filter(card => 
        card.style.display !== 'none'
    );
    
    if (visibleCards.length === 0) return;

    const vendorLeft = document.querySelector('.vendor-left');
    const cardHeight = visibleCards[0].offsetHeight;
    const containerHeight = vendorLeft.clientHeight;

    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            if (selectedCardIndex === -1) {
                // 첫 번째 보이는 카드의 인덱스 찾기
                const firstVisibleIndex = Array.from(document.querySelectorAll('.card')).indexOf(visibleCards[0]);
                await selectCard(firstVisibleIndex);
            } else {
                // 현재 선택된 카드의 인덱스 찾기
                const currentCard = document.querySelector('.card.selected');
                const currentIndex = Array.from(document.querySelectorAll('.card')).indexOf(currentCard);
                
                // 이전 보이는 카드 찾기
                let prevVisibleIndex = -1;
                for (let i = currentIndex - 1; i >= 0; i--) {
                    const card = document.querySelectorAll('.card')[i];
                    if (card.style.display !== 'none') {
                        prevVisibleIndex = i;
                        break;
                    }
                }
                
                if (prevVisibleIndex !== -1) {
                    await selectCard(prevVisibleIndex);
                    // 선택된 카드가 화면 상단에 오도록 스크롤 조정
                    const selectedCard = document.querySelector('.card.selected');
                    const cardTop = selectedCard.offsetTop;
                    if (cardTop < vendorLeft.scrollTop) {
                        vendorLeft.scrollTop = cardTop;
                    }
                }
            }
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            if (selectedCardIndex === -1) {
                // 첫 번째 보이는 카드의 인덱스 찾기
                const firstVisibleIndex = Array.from(document.querySelectorAll('.card')).indexOf(visibleCards[0]);
                await selectCard(firstVisibleIndex);
            } else {
                // 현재 선택된 카드의 인덱스 찾기
                const currentCard = document.querySelector('.card.selected');
                const currentIndex = Array.from(document.querySelectorAll('.card')).indexOf(currentCard);
                
                // 다음 보이는 카드 찾기
                let nextVisibleIndex = -1;
                for (let i = currentIndex + 1; i < document.querySelectorAll('.card').length; i++) {
                    const card = document.querySelectorAll('.card')[i];
                    if (card.style.display !== 'none') {
                        nextVisibleIndex = i;
                        break;
                    }
                }
                
                if (nextVisibleIndex !== -1) {
                    await selectCard(nextVisibleIndex);
                    // 선택된 카드가 화면 하단에 오도록 스크롤 조정
                    const selectedCard = document.querySelector('.card.selected');
                    const cardBottom = selectedCard.offsetTop + selectedCard.offsetHeight;
                    if (cardBottom > vendorLeft.scrollTop + containerHeight) {
                        vendorLeft.scrollTop = cardBottom - containerHeight;
                    }
                }
            }
            break;
    }
}

async function createCard(item, index, startIndex) {
    console.log('createCard');
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item._id;
    
    // 브랜드 정보 유무 확인
    try {
        //const brandPhoneData = await mongo.getBrandPhoneData(item.brand);
        const brandPhoneData = await window.api.fetchBrandPhoneData(item.brand);
        const hasBrandInfo = brandPhoneData && brandPhoneData.brand_name ? 'true' : 'false';
        card.dataset.hasBrandInfo = hasBrandInfo;
    } catch (error) {
        console.error('브랜드 정보 조회 중 오류:', error);
        card.dataset.hasBrandInfo = 'false';
    }
    
    card.addEventListener('click', async () => await selectCard(startIndex + index));

    // 카드 헤더 (브랜드명과 통화 상태)
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const brandName = document.createElement('div');
    brandName.className = 'brand-name';
    brandName.textContent = item.brand;
    
    // NEW 상태 표시
    const newStatus = document.createElement('div');
    newStatus.className = 'new-status';
    if (item.NEW === "NEW") {
        newStatus.textContent = "NEW";
        newStatus.classList.add('active');
    }
    
    // 최근 통화 상태 표시
    const callStatus = document.createElement('div');
    callStatus.className = 'call-status';
    
    try {
        //const latestCall = await mongo.getLatestCallRecordByCardId(item._id);
        const latestCall = await window.api.fetchLatestCallRecordByCardId(item._id);
        if (latestCall) {
            const callDate = new Date(latestCall.call_date);
            const formattedDate = callDate.toLocaleDateString('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            callStatus.innerHTML = `
                <span class="status-value ${latestCall.call_status === '부재중' ? 'missed' : latestCall.call_status === '연결됨' ? 'connected' : ''}">
                    ${latestCall.call_status} (${formattedDate})
                </span>
                ${latestCall.nextstep ? `<span class="next-step-value">${latestCall.nextstep}</span>` : ''}
            `;
        }
    } catch (error) {
        console.error('통화 상태 조회 중 오류:', error);
    }
    
    header.appendChild(brandName);
    header.appendChild(newStatus);
    header.appendChild(callStatus);
    card.appendChild(header);

    // 상품 정보
    const itemSection = document.createElement('div');
    itemSection.className = 'card-section';
    
    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';
    itemContent.innerHTML = `
        <div class="item-row">
            <div class="item-name">${item.item}</div>
            <div class="item-category">${item.item_category}</div>
        </div>
        <div class="crawl-date">크롤링: ${new Date(item.crawl_date).toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
        <div class="item-feed">
            <a href="${item.item_feed_link}" target="_blank" class="feed-link">인스타그램 피드 보기</a>
        </div>
        
        
        
        
    `;
    
    itemSection.appendChild(itemContent);
    card.appendChild(itemSection);

    // 카테고리 정보
    const categorySection = document.createElement('div');
    categorySection.className = 'card-section';
    
    const categoryContent = document.createElement('div');
    categoryContent.className = 'category-content';
    categoryContent.innerHTML = `
        <div class="category-item">
            <span class="grade-value">등급: ${item.grade}</span>
        </div>
        <div class="clean-name">${item.clean_name}</div>
        <div class="item-author">@${item.author}</div>
        <div class="category-item">
            <span class="category-value">${item.category}</span>
        </div>
        
        
    `;
    
    categorySection.appendChild(categoryContent);
    card.appendChild(categorySection);

    return card;
}

async function loadVendorData(isInitialLoad = true, filters = {}) {
    console.log('loadVendorData');
    if (isLoading || (!isInitialLoad && !hasMoreData)) return;
    
    try {
        isLoading = true;
        
        // 필터가 전달되지 않은 경우 현재 필터 상태를 가져옴
        if (Object.keys(filters).length === 0) {
            filters = {
                searchQuery: vendorFilter.searchQuery,
                categories: vendorFilter.selectedCategories,
                grades: vendorFilter.selectedGrades,
                hasBrandInfo: vendorFilter.hasBrandInfo,
                verificationStatus: vendorFilter.selectedVerificationStatus
            };
        }
        
        //const result = await mongo.getVendorData(currentSkip, 20, filters);
        const result = await window.api.fetchVendorData({
            ...filters,
            skip: currentSkip,
            limit: 20
        });
        const { data, hasMore } = result;
          
        hasMoreData = hasMore;
        
        const dataList = document.getElementById('vendor-data-list');
        if (isInitialLoad) {
            dataList.innerHTML = '';
            selectedCardIndex = -1;
            cardData = []; // 데이터 초기화
        }
        
        if (data.length === 0 && isInitialLoad) {
            dataList.innerHTML = '<p>데이터가 없습니다.</p>';
            return;
        }

        const startIndex = cardData.length;
        // Promise.all을 사용하여 모든 카드 생성이 완료될 때까지 기다림
        const cardPromises = data.map(async (item, index) => {
            cardData.push(item); // 데이터 저장
            const card = await createCard(item, index, startIndex);
            return card;
        });

        const cards = await Promise.all(cardPromises);
        cards.forEach(card => dataList.appendChild(card));

        currentSkip += data.length;
        
        if (!hasMore) {
            const endMessage = document.createElement('p');
            endMessage.style.textAlign = 'center';
            endMessage.style.color = '#666';
            endMessage.style.padding = '20px';
            endMessage.textContent = '모든 데이터를 불러왔습니다.';
            dataList.appendChild(endMessage);
        }
    } catch (error) {
        console.error('벤더 데이터 로드 중 오류 발생:', error);
        const dataList = document.getElementById('vendor-data-list');
        if (isInitialLoad) {
            dataList.innerHTML = '<p>데이터 로드 중 오류가 발생했습니다.</p>';
        }
    } finally {
        isLoading = false;
    }
}

function handleScroll(e) {
    console.log('handleScroll');
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
        loadVendorData(false);
    }
}

async function initVendor() {
    console.log('initVendor');
    // 데이터 초기화
    currentSkip = 0;
    hasMoreData = true;
    selectedCardIndex = -1;
    cardData = []; // 데이터 초기화
    loadVendorData(true);
    
    const vendorLeft = document.querySelector('.vendor-left');
    vendorLeft.addEventListener('scroll', handleScroll);
    
    // 우측 패널 초기화
    const rightPanel = document.querySelector('.vendor-right');
    rightPanel.innerHTML = '<p>카드를 선택하면 브랜드 정보가 표시됩니다.</p>';

    // 필터 초기화
    /*
    if (window.vendorFilter && typeof window.vendorFilter.init === 'function') {
        window.vendorFilter.init();
    } 
    */
    if (vendorFilter && typeof vendorFilter.init === 'function') {
        vendorFilter.init();
    } else {
        console.error('vendorFilter가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}

async function saveCallRecord() {

    try {
        const callStatus = document.getElementById('call-status').value;
        const nextStep = document.getElementById('next-step').value;
        const notes = document.getElementById('call-notes').value;
        const callDuration = Math.floor((Date.now() - vendorCallManager.callStartTime) / 1000);

        // 현재 선택된 카드의 데이터 확인
        if (!currentBrandData || !currentBrandData._id) {
            console.error('선택된 카드의 ID가 없습니다.');
            alert('선택된 카드의 ID가 없습니다.');
            return;
        }

        const callRecord = {
            brand_name: currentBrandData.brand_name,
            customer_service_number: currentBrandData.customer_service_number,
            contact_person: currentBrandData.contact_person,
            call_date: new Date(),
            call_duration_sec: callDuration,
            call_status: callStatus,
            nextstep: nextStep,
            notes: notes,
            card_id: currentBrandData._id  // 선택된 카드의 ID 추가
        };

        //await mongo.saveCallRecord(callRecord);
        await window.api.saveCallRecord(callRecord);
        console.log('통화 기록 저장 완료:', callRecord);
        
        // 통화 기록 저장 후 모달 닫기
        const modal = document.getElementById('call-confirm-modal');
        modal.style.display = 'none';
        
        // vendorCallHistory 모듈을 사용하여 통화 기록 업데이트
        /*
        if (window.vendorCallHistory) {
            await window.vendorCallHistory.renderCallHistory(currentBrandData.brand_name);
        */
        if (vendorCallHistory) {
            await vendorCallHistory.renderCallHistory(currentBrandData.brand_name);
        } else {
            // 이전 방식으로 통화 기록 업데이트
            await updateCallHistory(currentBrandData.brand_name);
        }

        // 선택된 카드의 통화 상태 업데이트
        const selectedCard = document.querySelector('.card.selected');
        if (selectedCard) {
            const callStatusElement = selectedCard.querySelector('.call-status');
            if (callStatusElement) {
                const callDate = new Date(callRecord.call_date);
                const formattedDate = callDate.toLocaleDateString('ko-KR', {
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
        
        // 성공 메시지 표시
        const toast = document.createElement('div');
        toast.className = 'toast-message success';
        toast.innerHTML = `
            <span class="toast-icon">✓</span>
            <span class="toast-text">통화 기록이 저장되었습니다.</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
    } catch (error) {
        console.error('통화 기록 저장 중 오류:', error);
        alert('통화 기록 저장 중 오류가 발생했습니다.');
    }
}