const mongo = require('./mongo');
const phone = require('./phone');

let isLoading = false;
let currentSkip = 0;
let hasMoreData = true;
let selectedCardIndex = -1;
let cardData = []; // 카드 데이터를 저장할 배열

async function handleCall(phoneNumber) {
    try {
        await phone.call(phoneNumber);
    } catch (error) {
        console.error('전화 연결 중 오류:', error);
        alert('전화 연결 중 오류가 발생했습니다.');
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
                                        <button class="call-button" data-phone="${brandPhoneData.customer_service_number}">
                                            📞 통화하기
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
                }
            });
        }

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