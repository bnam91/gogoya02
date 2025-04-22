class SellerMatchManager {
    constructor() {
        this.container = null;
        this.leftContent = null;
        this.centerContent = null;
        this.rightContent = null;
        this.influencers = [];
        this.selectedInfluencerIds = new Set(); // 선택된 인플루언서의 ID를 저장
        this.initialized = false; // 초기화 여부를 추적하는 플래그 추가
    }

    init() {
        console.log('셀러매칭 탭 초기화');
        if (!this.initialized) {
            this.initializeElements();
            this.loadInfluencerData();
            this.initialized = true;
        }
        this.render();
        
        // 선택된 인플루언서가 있는 경우 중앙 패널 업데이트
        if (this.selectedInfluencerIds.size > 0) {
            const checkedInfluencers = this.influencers.filter(influencer => 
                this.selectedInfluencerIds.has(`${influencer.username}_${influencer.clean_name}`)
            );
            this.updateCenterPanel(checkedInfluencers);
        }
    }

    initializeElements() {
        this.container = document.querySelector('.sellerMatch-container');
        this.leftContent = document.getElementById('sellerMatch-left-content');
        this.centerContent = document.getElementById('sellerMatch-center-content');
        this.rightContent = document.getElementById('sellerMatch-right-content');

        if (!this.container || !this.leftContent || !this.centerContent || !this.rightContent) {
            console.error('셀러매칭 관련 DOM 요소를 찾을 수 없습니다.');
            return false;
        }
        return true;
    }

    async loadInfluencerData() {
        try {
            const client = await window.mongo.getMongoClient();
            const db = client.db('insta09_database');
            const collection = db.collection('02_main_influencer_data');

            const pipeline = [
                {
                    "$match": {
                        "reels_views(15)": { "$exists": true, "$ne": "" },
                        "is_contact_excluded": { "$ne": true }
                    }
                },
                {
                    "$addFields": {
                        "reels_views_num": {
                            "$cond": {
                                "if": { "$eq": ["$reels_views(15)", "-"] },
                                "then": 0,
                                "else": { "$toInt": "$reels_views(15)" }
                            }
                        }
                    }
                },
                {
                    "$sort": { "reels_views_num": -1 }
                },
                {
                    "$project": {
                        "username": 1,
                        "clean_name": 1,
                        "category": 1,
                        "profile_link": 1,
                        "reels_views": "$reels_views(15)",
                        "reels_views_num": 1,
                        "contact_method": 1
                    }
                }
            ];

            const newInfluencers = await collection.aggregate(pipeline).toArray();
            
            // 기존에 선택된 인플루언서들의 ID를 유지하면서 새로운 데이터로 업데이트
            const existingSelectedIds = new Set(this.selectedInfluencerIds);
            this.influencers = newInfluencers;
            
            // 새로운 데이터에서 기존에 선택된 인플루언서들의 ID만 유지
            this.selectedInfluencerIds = new Set();
            this.influencers.forEach(influencer => {
                const influencerId = `${influencer.username}_${influencer.clean_name}`;
                if (existingSelectedIds.has(influencerId)) {
                    this.selectedInfluencerIds.add(influencerId);
                }
            });
            
            this.renderLeftPanel();
        } catch (error) {
            console.error('인플루언서 데이터 로드 중 오류 발생:', error);
            this.leftContent.innerHTML = '<div class="error-message">데이터를 불러오는 중 오류가 발생했습니다.</div>';
        }
    }

    render() {
        if (!this.initializeElements()) {
            return;
        }
        
        // 각 섹션 초기화
        this.renderLeftPanel();
        this.renderCenterPanel();
        this.renderRightPanel();
    }

    renderLeftPanel() {
        if (this.leftContent) {
            const filterHTML = `
                <div class="seller-match-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <span class="filter-label">카테고리:</span>
                            <select id="category-filter">
                                <option value="">전체</option>
                                <option value="뷰티">뷰티</option>
                                <option value="패션">패션</option>
                                <option value="홈/리빙">홈/리빙</option>
                                <option value="푸드">푸드</option>
                                <option value="육아">육아</option>
                                <option value="건강">건강</option>
                                <option value="맛집탐방">맛집탐방</option>
                                <option value="전시/공연">전시/공연</option>
                                <option value="반려동물">반려동물</option>
                                <option value="기타">기타</option>
                            </select>
                            <input type="number" id="category-percentage" min="0" max="100" value="0">
                            <span class="percentage-label">% 이상</span>
                        </div>
                        <div class="filter-group">
                            <span class="filter-label">이름검색:</span>
                            <input type="text" id="name-search" placeholder="이름 또는 유저명으로 검색">
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="filter-group">
                            <span class="filter-label">릴스뷰:</span>
                            <select id="reels-views-filter">
                                <option value="">전체</option>
                                <option value="0-10000">1만 이하</option>
                                <option value="10000-50000">1만-5만</option>
                                <option value="50000-100000">5만-10만</option>
                                <option value="100000-500000">10만-50만</option>
                                <option value="500000-1000000">50만-100만</option>
                                <option value="1000000-">100만 이상</option>
                                <option value="custom">직접입력</option>
                            </select>
                            <div id="custom-reels-views" style="display: none;">
                                <input type="number" id="reels-views-min" placeholder="최소값" min="0">
                                <span>~</span>
                                <input type="number" id="reels-views-max" placeholder="최대값" min="0">
                            </div>
                        </div>
                        <div class="filter-buttons">
                            <button id="reset-filters" class="reset-filters-btn" title="필터 초기화">
                                <i class="fas fa-redo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const tableHTML = `
                <style>
                    .seller-match-filters {
                        margin-bottom: 0px;
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 4px;
                    }
                    .filter-row {
                        display: flex;
                        gap: 20px;
                        margin-bottom: 10px;
                    }
                    .filter-row:last-child {
                        margin-bottom: 0;
                    }
                    .filter-group {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex: 1;
                    }
                    .filter-label {
                        font-size: 0.9rem;
                        color: #666;
                        min-width: 60px;
                    }
                    .percentage-label {
                        font-size: 0.9rem;
                        color: #666;
                    }
                    .filter-group select,
                    .filter-group input {
                        padding: 5px 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 0.9rem;
                    }
                    .filter-group input[type="number"] {
                        width: 60px;
                        text-align: right;
                    }
                    .filter-group input[type="text"] {
                        flex: 1;
                    }
                    #custom-reels-views {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    #custom-reels-views input {
                        width: 100px;
                    }
                    .influencer-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.85rem;
                    }
                    .influencer-table th {
                        background-color: #f8f9fa;
                        padding: 8px;
                        text-align: center;
                        border-bottom: 1px solid #eee;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                    }
                    .influencer-table td {
                        padding: 8px;
                        border-bottom: 1px solid #eee;
                    }
                    .influencer-table tr:hover {
                        background-color: #f8f9fa;
                    }
                    .name-username {
                        max-width: 200px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        color: #4a90e2;
                        cursor: pointer;
                    }
                    .name-username:hover {
                        text-decoration: underline;
                    }
                    .reels-views {
                        text-align: right;
                    }
                    .category {
                        max-width: 200px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .checkbox-col {
                        width: 30px;
                        text-align: center;
                    }
                    .contact-method {
                        max-width: 100px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                </style>
                ${filterHTML}
                <div class="influencer-table-container">
                    <table class="influencer-table">
                        <thead>
                            <tr>
                                <th class="checkbox-col"><input type="checkbox" id="select-all-influencers" onclick="toggleAllInfluencers(this)"></th>
                                <th>순위</th>
                                <th>이름(유저명)</th>
                                <th>카테고리</th>
                                <th>릴스뷰</th>
                                <th>컨택</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.influencers.map((influencer, index) => {
                                const influencerId = `${influencer.username}_${influencer.clean_name}`;
                                const isChecked = this.selectedInfluencerIds.has(influencerId);
                                
                                return `
                                    <tr class="${isChecked ? 'selected-row' : ''}">
                                        <td class="checkbox-col">
                                            <input type="checkbox" 
                                                class="influencer-checkbox" 
                                                data-influencer-id="${influencerId}"
                                                ${isChecked ? 'checked' : ''}>
                                        </td>
                                        <td>${index + 1}</td>
                                        <td class="name-username" 
                                            title="${influencer.clean_name || '-'} (${influencer.username || '-'})"
                                            onclick="window.open('${influencer.profile_link}', '_blank')"
                                            style="color: #0066cc;">
                                            ${influencer.clean_name || '-'} (${influencer.username || '-'})
                                        </td>
                                        <td class="category">${createCategoryBar(influencer.category).outerHTML}</td>
                                        <td class="reels-views">${influencer.reels_views_num.toLocaleString()}</td>
                                        <td class="contact-method" title="${influencer.contact_method || '-'}">${influencer.contact_method || '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            this.leftContent.innerHTML = tableHTML;

            // 필터 초기화
            if (window.sellerMatchFilter) {
                window.sellerMatchFilter.container = this.leftContent.querySelector('.seller-match-filters');
                window.sellerMatchFilter.init();
                window.sellerMatchFilter.setOnFilterChange(() => {
                    const filteredInfluencers = window.sellerMatchFilter.filterInfluencers(this.influencers);
                    this.renderInfluencerTable(filteredInfluencers);
                });
            }

            // 체크박스 이벤트 리스너 추가
            this.addCheckboxEventListeners();

            // 중앙 패널 업데이트
            const checkedInfluencers = this.influencers.filter(influencer => 
                this.selectedInfluencerIds.has(`${influencer.username}_${influencer.clean_name}`)
            );
            this.updateCenterPanel(checkedInfluencers);
        }
    }

    renderInfluencerTable(influencers) {
        const tableBody = this.leftContent.querySelector('.influencer-table tbody');
        if (tableBody) {
            tableBody.innerHTML = influencers.map((influencer, index) => {
                const influencerId = `${influencer.username}_${influencer.clean_name}`;
                const isChecked = this.selectedInfluencerIds.has(influencerId);
                
                return `
                    <tr class="${isChecked ? 'selected-row' : ''}">
                        <td class="checkbox-col">
                            <input type="checkbox" 
                                class="influencer-checkbox" 
                                data-influencer-id="${influencerId}"
                                ${isChecked ? 'checked' : ''}>
                        </td>
                        <td>${index + 1}</td>
                        <td class="name-username" 
                            title="${influencer.clean_name || '-'} (${influencer.username || '-'})"
                            onclick="window.open('${influencer.profile_link}', '_blank')"
                            style="color: #0066cc;">
                            ${influencer.clean_name || '-'} (${influencer.username || '-'})
                        </td>
                        <td class="category">${createCategoryBar(influencer.category).outerHTML}</td>
                        <td class="reels-views">${influencer.reels_views_num.toLocaleString()}</td>
                        <td class="contact-method" title="${influencer.contact_method || '-'}">${influencer.contact_method || '-'}</td>
                    </tr>
                `;
            }).join('');

            // 체크박스 이벤트 리스너 다시 추가
            this.addCheckboxEventListeners();

            // 전체 선택 체크박스 상태 업데이트
            const allCheckboxes = document.querySelectorAll('.influencer-checkbox');
            const allChecked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
            document.getElementById('select-all-influencers').checked = allChecked;

            // 중앙 패널 업데이트
            const checkedInfluencers = influencers.filter(influencer => 
                this.selectedInfluencerIds.has(`${influencer.username}_${influencer.clean_name}`)
            );
            this.updateCenterPanel(checkedInfluencers);
        }
    }

    renderCenterPanel() {
        if (this.centerContent) {
            this.centerContent.innerHTML = '중앙 패널';
        }
    }

    renderRightPanel() {
        if (this.rightContent) {
            this.rightContent.innerHTML = `
                <div class="right-panel-top">
                    <h3>브랜드 히스토리</h3>
                    <div class="right-panel-content">
                        <!-- 상위 패널 내용 -->
                    </div>
                </div>
                <div class="right-panel-bottom">
                    <h3>DM히스토리 <span class="dm-count">(0)</span></h3>
                    <div class="right-panel-content">
                        <!-- 하위 패널 내용 -->
                    </div>
                </div>
                <style>
                    #sellerMatch-right-content {
                        background: none;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        padding: 0;
                    }
                    .right-panel-top,
                    .right-panel-bottom {
                        height: calc(50% - 5px);
                        padding: 10px;
                        box-sizing: border-box;
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .right-panel-content {
                        height: calc(100% - 30px);
                        overflow-y: auto;
                    }
                    h3 {
                        margin: 0 0 10px 0;
                        font-size: 1rem;
                        color: #333;
                    }
                </style>
            `;
        }
    }

    addCheckboxEventListeners() {
        const self = this;
        
        // 개별 체크박스 변경 시
        document.querySelectorAll('.influencer-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const influencerId = this.dataset.influencerId;
                if (this.checked) {
                    self.selectedInfluencerIds.add(influencerId);
                } else {
                    self.selectedInfluencerIds.delete(influencerId);
                }

                const allChecked = Array.from(document.querySelectorAll('.influencer-checkbox')).every(cb => cb.checked);
                document.getElementById('select-all-influencers').checked = allChecked;
                
                // 선택된 로우 스타일 업데이트
                const row = this.closest('tr');
                if (this.checked) {
                    row.classList.add('selected-row');
                } else {
                    row.classList.remove('selected-row');
                }
                
                const checkedInfluencers = getCheckedInfluencersData(self.influencers);
                self.updateCenterPanel(checkedInfluencers);
            });
        });
        
        // 테이블 행 클릭 시 체크박스 토글
        document.querySelectorAll('.influencer-table tbody tr').forEach(row => {
            row.addEventListener('click', function(event) {
                // 체크박스가 클릭된 경우는 처리하지 않음
                if (event.target.type === 'checkbox') return;
                
                // 행에 있는 체크박스 찾기
                const checkbox = this.querySelector('.influencer-checkbox');
                if (checkbox) {
                    // 체크박스 상태 토글
                    checkbox.checked = !checkbox.checked;
                    
                    // 선택된 로우 스타일 업데이트
                    if (checkbox.checked) {
                        this.classList.add('selected-row');
                    } else {
                        this.classList.remove('selected-row');
                    }
                    
                    // change 이벤트 발생시켜 체크박스 이벤트 핸들러 실행
                    const changeEvent = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(changeEvent);
                }
            });
        });
    }

    updateCenterPanel(selectedInfluencers) {
        const centerPanel = this.centerContent;
        if (!centerPanel) return;
        
        if (!selectedInfluencers || selectedInfluencers.length === 0) {
            centerPanel.innerHTML = '<p class="center-panel-placeholder">좌측에서 인플루언서를 선택하면 여기에 표시됩니다.</p>';
            return;
        }
        
        const selectedInfluencersHTML = `
            <div class="panel-header">
                <h3>선택된 인플루언서</h3>
                <span class="count-badge">${selectedInfluencers.length}</span>
                <div class="panel-actions">
                    <button class="exclude-all-button" onclick="window.sellerMatchManager.excludeAllInfluencers()">
                        <i class="fas fa-times-circle"></i> 전체 제외
                    </button>
                    <button class="send-dm-button" onclick="window.sellerMatchManager.sendDm()">
                        <i class="fas fa-paper-plane"></i> DM 보내기
                    </button>
                </div>
            </div>
            <table class="influencer-table">
                <thead>
                    <tr>
                        <th>제외</th>
                        <th>이름(유저명)</th>
                        <th>카테고리</th>
                        <th>릴스뷰</th>
                        <th>컨택</th>
                    </tr>
                </thead>
                <tbody>
                    ${selectedInfluencers.map((influencer, index) => {
                        if (!influencer) return '';
                        const name = influencer.clean_name || '-';
                        const username = influencer.username || '-';
                        const category = influencer.category || '-';
                        const reelsViews = influencer.reels_views_num ? influencer.reels_views_num.toLocaleString() : '-';
                        const influencerId = `${influencer.username}_${influencer.clean_name}`;
                        
                        return `
                            <tr data-influencer-id="${influencerId}" data-clean-name="${name}">
                                <td class="exclude-col">
                                    <button class="exclude-button" onclick="window.sellerMatchManager.excludeInfluencer('${influencerId}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </td>
                                <td class="name-username" 
                                    title="${name} (${username})"
                                    onclick="window.open('${influencer.profile_link || '#'}', '_blank')">
                                    ${name} (${username})
                                </td>
                                <td class="category">${createCategoryBar(category).outerHTML}</td>
                                <td class="reels-views">${reelsViews}</td>
                                <td class="contact-method" title="${influencer.contact_method || '-'}">${influencer.contact_method || '-'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        centerPanel.innerHTML = selectedInfluencersHTML;

        // 중앙 패널의 행 클릭 이벤트 추가
        centerPanel.querySelectorAll('tr[data-clean-name]').forEach(row => {
            row.addEventListener('click', async (event) => {
                // 제외 버튼 클릭 시에는 이벤트 처리하지 않음
                if (event.target.closest('.exclude-button')) return;

                const cleanName = row.dataset.cleanName;
                const influencerId = row.dataset.influencerId;
                const username = influencerId.split('_')[0] + '_' + influencerId.split('_')[1];
                
                console.log('선택된 인플루언서:', username);
                
                const records = await window.dmRecordsManager.getDmRecords(cleanName);
                const rightPanelBottom = document.querySelector('.right-panel-bottom .right-panel-content');
                const dmCount = document.querySelector('.dm-count');
                const rightPanelTop = document.querySelector('.right-panel-top .right-panel-content');
                
                if (rightPanelBottom) {
                    rightPanelBottom.innerHTML = `
                        ${window.dmRecordsManager.renderDmRecords(records)}
                    `;
                    if (dmCount) {
                        dmCount.textContent = `(${records.length})`;
                    }
                }

                if (rightPanelTop) {
                    const brandRecords = await window.brandRecordsManager.getBrandRecords(username);
                    rightPanelTop.innerHTML = `
                        ${window.brandRecordsManager.renderBrandRecords(brandRecords)}
                    `;
                }
            });
        });
    }

    // 인플루언서 제외 함수 추가
    excludeInfluencer(influencerId) {
        // 선택된 인플루언서 목록에서 제거
        this.selectedInfluencerIds.delete(influencerId);
        
        // 좌측 패널의 체크박스 상태 업데이트
        const checkbox = document.querySelector(`.influencer-checkbox[data-influencer-id="${influencerId}"]`);
        if (checkbox) {
            checkbox.checked = false;
            checkbox.closest('tr').classList.remove('selected-row');
        }
        
        // 중앙 패널 업데이트
        const checkedInfluencers = this.influencers.filter(influencer => 
            this.selectedInfluencerIds.has(`${influencer.username}_${influencer.clean_name}`)
        );
        this.updateCenterPanel(checkedInfluencers);
    }

    // 전체 제외 함수 추가
    excludeAllInfluencers() {
        // 모든 선택된 인플루언서 제거
        this.selectedInfluencerIds.clear();
        
        // 좌측 패널의 모든 체크박스 해제
        document.querySelectorAll('.influencer-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('tr').classList.remove('selected-row');
        });
        
        // 중앙 패널 업데이트
        this.updateCenterPanel([]);
    }

    sendDm() {
        window.dmModal.open();
    }
}

// 전체 선택/해제 토글 함수
function toggleAllInfluencers(checkbox) {
    const isChecked = checkbox.checked;
    const visibleInfluencers = Array.from(document.querySelectorAll('.influencer-checkbox'));
    
    visibleInfluencers.forEach(cb => {
        cb.checked = isChecked;
        const influencerId = cb.dataset.influencerId;
        if (isChecked) {
            cb.closest('tr').classList.add('selected-row');
            window.sellerMatchManager.selectedInfluencerIds.add(influencerId);
        } else {
            cb.closest('tr').classList.remove('selected-row');
            window.sellerMatchManager.selectedInfluencerIds.delete(influencerId);
        }
    });
    
    // SellerMatchManager 인스턴스 가져오기
    const sellerMatchManager = window.sellerMatchManager;
    if (!sellerMatchManager) return;
    
    // 체크된 인플루언서 확인
    const checkedInfluencers = sellerMatchManager.influencers.filter(influencer => 
        sellerMatchManager.selectedInfluencerIds.has(`${influencer.username}_${influencer.clean_name}`)
    );
    
    // 중앙 패널 업데이트
    sellerMatchManager.updateCenterPanel(checkedInfluencers);
}

// 체크된 인플루언서 데이터 반환 함수
function getCheckedInfluencersData(allInfluencers) {
    if (!allInfluencers || !allInfluencers.length) return [];
    
    // SellerMatchManager 인스턴스에서 선택된 ID 목록 가져오기
    const sellerMatchManager = window.sellerMatchManager;
    if (!sellerMatchManager) return [];
    
    // 선택된 ID에 해당하는 인플루언서 데이터 반환
    return allInfluencers.filter(influencer => 
        sellerMatchManager.selectedInfluencerIds.has(`${influencer.username}_${influencer.clean_name}`)
    );
}

function createCategoryBar(categoryData) {
    const categories = categoryData.split(',');
    const container = document.createElement('div');
    container.className = 'category-bar-container';
    
    // 카테고리 정보를 먼저 추가
    const info = document.createElement('div');
    info.className = 'category-info';
    
    // 전체 비율 계산
    let totalPercentage = 0;
    categories.forEach(cat => {
        const [_, percent] = cat.split('(');
        const percentage = parseInt(percent);
        totalPercentage += percentage;
    });
    
    categories.forEach(cat => {
        const [category, percent] = cat.split('(');
        const percentage = parseInt(percent);
        const normalizedPercentage = (percentage / totalPercentage) * 100;
        
        const label = document.createElement('div');
        label.className = 'category-label';
        
        const color = document.createElement('div');
        color.className = 'category-color';
        color.style.backgroundColor = getCategoryColor(category);
        
        const text = document.createElement('span');
        text.textContent = `${category}(${percentage}%)`;
        
        label.appendChild(color);
        label.appendChild(text);
        info.appendChild(label);
    });
    
    container.appendChild(info);
    
    // 바 추가
    const bar = document.createElement('div');
    bar.className = 'category-bar';
    
    categories.forEach(cat => {
        const [category, percent] = cat.split('(');
        const percentage = parseInt(percent);
        const normalizedPercentage = (percentage / totalPercentage) * 100;
        
        const segment = document.createElement('div');
        segment.className = 'category-segment';
        segment.setAttribute('data-category', category);
        segment.style.width = `${normalizedPercentage}%`;
        segment.textContent = `${category}(${percentage}%)`;
        bar.appendChild(segment);
    });
    
    container.appendChild(bar);
    return container;
}

function getCategoryColor(category) {
    const colors = {
        '뷰티': '#FFD1DC',
        '패션': '#FFC1B6',
        '홈/리빙': '#D1F0F0',
        '푸드': '#FFE4C4',
        '육아': '#E6D1FF',
        '건강': '#a8e6c9',
        '맛집탐방': '#FFE8C1',
        '전시/공연': '#FFD1DC',
        '반려동물': '#E6D1B8',
        '기타': '#E0E0E0'
    };
    return colors[category] || '#E0E0E0';
}

// DOM이 완전히 로드된 후 초기화
document.addEventListener('DOMContentLoaded', () => {
window.sellerMatchManager = new SellerMatchManager();
});
