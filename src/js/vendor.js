const mongo = require('./mongo');
const vendorCallManager = require('./vendorCallManager');

let isLoading = false;
let currentSkip = 0;
let hasMoreData = true;
let selectedCardIndex = -1;
let cardData = []; // 카드 데이터를 저장할 배열
let currentBrandData = null;

function updateCallDuration() {
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
                                // 저장과 취소 버튼 표시
                                const saveButton = callForm.querySelector('.save-button');
                                const cancelButton = callForm.querySelector('.cancel-button');
                                if (saveButton) saveButton.style.display = 'inline-block';
                                if (cancelButton) cancelButton.style.display = 'inline-block';
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
                                await vendorCallManager.saveCallRecord(callStatus, nextStep, notes);
                                console.log('통화 기록이 저장되었습니다.');
                                // 통화 상태 폼 제거 및 추가 정보 영역 초기화
                                const extraContent = document.querySelector('.extra-content');
                                extraContent.innerHTML = `
                                    <h3>추가 정보</h3>
                                    <p>여기에 추가 정보가 표시됩니다.</p>
                                `;
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
    try {
        const extraContent = document.querySelector('.extra-content');
        extraContent.innerHTML = '<h3>통화 기록</h3><p>기록을 불러오는 중...</p>';

        const records = await vendorCallManager.getCallHistory(brandName);

        if (!records || records.length === 0) {
            extraContent.innerHTML = `
                <h3>통화 기록</h3>
                <p>이전 통화 기록이 없습니다.</p>
            `;
            return;
        }

        let html = '<h3>통화 기록</h3>';
        html += '<div class="call-history">';
        
        records.forEach(record => {
            const callDate = new Date(record.call_date);
            const duration = record.call_duration_sec;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;

            html += `
                <div class="call-record">
                    <div class="call-record-header">
                        <span class="call-date">${callDate.toLocaleString()}</span>
                        <span class="call-duration">${minutes}분 ${seconds}초</span>
                    </div>
                    <div class="call-record-details">
                        <div class="record-item">
                            <label>통화 상태:</label>
                            <span>${record.call_status}</span>
                        </div>
                        <div class="record-item">
                            <label>다음 단계:</label>
                            <span>${record.nextstep}</span>
                        </div>
                        ${record.notes ? `
                            <div class="record-item">
                                <label>메모:</label>
                                <span class="notes">${record.notes}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        extraContent.innerHTML = html;
    } catch (error) {
        console.error('통화 기록 조회 중 오류:', error);
        extraContent.innerHTML = `
            <h3>통화 기록</h3>
            <p>통화 기록을 불러오는 중 오류가 발생했습니다.</p>
        `;
    }
}

async function updateRightPanel(item) {
    const rightPanel = document.querySelector('.vendor-right');
    if (!item) {
        rightPanel.innerHTML = '<p>브랜드 정보가 없습니다.</p>';
        return;
    }

    // 로딩 상태 표시
    rightPanel.innerHTML = '<p>브랜드 정보를 불러오는 중...</p>';

    try {
        const brandName = item.brand;
        const brandPhoneData = await mongo.getBrandPhoneData(brandName);
        
        // 현재 브랜드 데이터 저장
        currentBrandData = brandPhoneData;

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
                                <span>${brandPhoneData.is_verified ? '인증됨' : '미인증'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>연락처 정보</h4>
                        <div class="info-group">
                            <div class="info-item">
                                <label>고객센터</label>
                                <div class="phone-info">
                                    <span class="phone-number">${brandPhoneData.customer_service_number || '-'}</span>
                                    ${brandPhoneData.customer_service_number ? `
                                        <button class="call-button ${vendorCallManager.isCalling ? 'end-call' : ''}" data-phone="${brandPhoneData.customer_service_number}">
                                            ${vendorCallManager.isCalling ? '통화종료' : '통화하기'}
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="info-item">
                                <label>이메일</label>
                                <span>${brandPhoneData.email || '-'}</span>
                            </div>
                            <div class="info-item full-width">
                                <label>사업장 주소</label>
                                <span>${brandPhoneData.business_address || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4>웹사이트 정보</h4>
                        <div class="info-group">
                            <div class="info-item">
                                <label>공식 웹사이트</label>
                                <a href="${brandPhoneData.official_website_url}" target="_blank" class="link">
                                    ${brandPhoneData.official_website_url || '-'}
                                </a>
                            </div>
                            <div class="info-item">
                                <label>실제 도메인</label>
                                <a href="${brandPhoneData.actual_domain_url}" target="_blank" class="link">
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

    } catch (error) {
        console.error('브랜드 정보 로드 중 오류:', error);
        rightPanel.innerHTML = '<p>브랜드 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

async function selectCard(index) {
    const cards = document.querySelectorAll('.card');
    if (index >= 0 && index < cards.length) {
        cards.forEach(c => c.classList.remove('selected'));
        cards[index].classList.add('selected');
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        selectedCardIndex = index;
        
        // 선택된 카드의 데이터로 우측 패널 업데이트
        await updateRightPanel(cardData[index]);
    }
}

// 키보드 이벤트 핸들러 추가
document.addEventListener('keydown', async (event) => {
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
    if (!document.getElementById('vendor-content').classList.contains('active')) {
        return;
    }

    const cards = document.querySelectorAll('.card');
    if (cards.length === 0) return;

    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            if (selectedCardIndex === -1) {
                await selectCard(0);
            } else {
                await selectCard(Math.max(0, selectedCardIndex - 1));
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (selectedCardIndex === -1) {
                await selectCard(0);
            } else {
                await selectCard(Math.min(cards.length - 1, selectedCardIndex + 1));
            }
            break;
    }
}

function createCard(item, index, startIndex) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.addEventListener('click', async () => await selectCard(startIndex + index));

    const header = document.createElement('div');
    header.className = 'card-header';
    
    const brandName = document.createElement('div');
    brandName.className = 'brand-name';
    brandName.textContent = item.brand_name || item.name;
    
    header.appendChild(brandName);
    card.appendChild(header);

    const categorySection = document.createElement('div');
    categorySection.className = 'card-section';
    
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'section-title';
    categoryTitle.textContent = '카테고리 정보';
    categorySection.appendChild(categoryTitle);

    Object.entries(item).forEach(([key, value]) => {
        if (key === '_id' || key === 'brand_name' || key === 'name') return;
        
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'card-field';
        
        const label = document.createElement('div');
        label.className = 'card-field-label';
        label.textContent = key;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'card-field-value';
        valueDiv.textContent = value;
        
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(valueDiv);
        categorySection.appendChild(fieldDiv);
    });
    
    card.appendChild(categorySection);
    return card;
}

async function loadVendorData(isInitialLoad = true) {
    if (isLoading || (!isInitialLoad && !hasMoreData)) return;
    
    try {
        isLoading = true;
        const result = await mongo.getVendorData(currentSkip);
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
        data.forEach((item, index) => {
            cardData.push(item); // 데이터 저장
            const card = createCard(item, index, startIndex);
            dataList.appendChild(card);
        });

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
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
        loadVendorData(false);
    }
}

function initVendor() {
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
}

document.addEventListener('keydown', handleKeyDown);

module.exports = {
    initVendor
}; 