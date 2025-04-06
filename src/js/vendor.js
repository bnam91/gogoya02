const mongo = require('./mongo');
const vendorCallManager = require('./vendorCallManager');
const vendorFilter = require('./vendorFilter');

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
        
        // 현재 브랜드 데이터 저장 (원본 카드 데이터 포함)
        currentBrandData = {
            ...brandPhoneData,
            _id: item._id,  // 원본 카드의 _id 추가
            brand: item.brand,
            brand_name: item.brand_name || brandPhoneData.brand_name,
            customer_service_number: brandPhoneData.customer_service_number,
            contact_person: brandPhoneData.contact_person
        };

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
        await updateRightPanel(currentBrandData);
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

    // 필터링된 카드만 가져오기
    const visibleCards = Array.from(document.querySelectorAll('.card')).filter(card => 
        card.style.display !== 'none'
    );
    
    if (visibleCards.length === 0) return;

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
                }
            }
            break;
    }
}

async function createCard(item, index, startIndex) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // 브랜드 정보 유무 확인
    try {
        const brandPhoneData = await mongo.getBrandPhoneData(item.brand);
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
        const latestCall = await mongo.getLatestCallRecordByCardId(item._id);
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

    // 필터 초기화
    vendorFilter.init();
}

document.addEventListener('keydown', handleKeyDown);

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

        await mongo.saveCallRecord(callRecord);
        console.log('통화 기록 저장 완료:', callRecord);
        
        // 통화 기록 저장 후 모달 닫기
        const modal = document.getElementById('call-confirm-modal');
        modal.style.display = 'none';
        
        // 통화 기록 업데이트
        await updateCallHistory(currentBrandData.brand_name);

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
        
    } catch (error) {
        console.error('통화 기록 저장 중 오류:', error);
        alert('통화 기록 저장 중 오류가 발생했습니다.');
    }
}

module.exports = {
    initVendor
}; 