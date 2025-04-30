class SellerAnalysisManager {
    constructor() {
        this.container = document.querySelector('.seller-analysis-container');
        this.influencers = [];
    }

    async init() {
        try {
            // HTML 파일 로드
            const htmlPath = path.join(process.cwd(), 'src', 'pages', 'vendor', 'sellerAnalysis.html');
            const html = await fs.promises.readFile(htmlPath, 'utf-8');
            
            // 컨테이너에 HTML 추가
            this.container.innerHTML = html;
            
            if (!window.sellerAnalysisFilter) {
                throw new Error('필터 모듈이 로드되지 않았습니다.');
            }
            
            this.setupFilter();
            this.setupExcelDownload();
            await this.loadInfluencerData();
        } catch (error) {
            console.error('셀러 분석 초기화 중 오류:', error);
            this.container.innerHTML = '<div class="error-message">데이터 로드 중 오류가 발생했습니다.</div>';
        }
    }

    setupFilter() {
        const filterContainer = this.container.querySelector('.seller-analysis-filters');
        if (filterContainer && window.sellerAnalysisFilter) {
            window.sellerAnalysisFilter.container = filterContainer;
            window.sellerAnalysisFilter.init();
            window.sellerAnalysisFilter.setOnFilterChange(() => {
                if (this.influencers.length > 0) {
                    const filteredInfluencers = window.sellerAnalysisFilter.filterInfluencers(this.influencers);
                    this.renderInfluencerTable(filteredInfluencers);
                }
            });
        }
    }

    async loadInfluencerData() {
        try {
            const client = await window.mongo.getMongoClient();
            const db = client.db('insta09_database');
            const collection = db.collection('02_main_influencer_data');

            const pipeline = [
                {
                    "$match": {
                        "reels_views(15)": { "$exists": true, "$ne": "" }
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
                        },
                        "followers_num": {
                            "$cond": {
                                "if": { "$eq": ["$followers", "-"] },
                                "then": 0,
                                "else": { "$toInt": "$followers" }
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
                        "followers": 1,
                        "grade": 1,
                        "reels_views": "$reels_views(15)",
                        "profile_link": 1,
                        "followers_num": 1,
                        "reels_views_num": 1,
                        "tags": 1
                    }
                }
            ];

            this.influencers = await collection.aggregate(pipeline).toArray();
            
            if (this.influencers.length > 0) {
                if (window.sellerAnalysisFilter) {
                    const filteredInfluencers = window.sellerAnalysisFilter.filterInfluencers(this.influencers);
                    this.renderInfluencerTable(filteredInfluencers);
                } else {
                    this.renderInfluencerTable(this.influencers);
                }
            } else {
                this.container.innerHTML = '<div class="error-message">데이터를 찾을 수 없습니다.</div>';
            }
        } catch (error) {
            console.error('인플루언서 데이터 로드 중 오류 발생:', error);
            throw error;
        }
    }

    applyFilters() {
        const selectedCategory = this.categoryFilter.value;
        const percentage = parseInt(this.percentageInput.value) || 0;

        let filteredInfluencers = [...this.influencers];

        if (selectedCategory) {
            filteredInfluencers = filteredInfluencers.filter(influencer => {
                if (!influencer.category) return false;
                
                const categoryPattern = new RegExp(`${selectedCategory}\\((\\d+)%\\)`);
                const match = influencer.category.match(categoryPattern);
                
                if (!match) return false;
                
                const categoryPercentage = parseInt(match[1]);
                return categoryPercentage >= percentage;
            });
        }

        this.renderInfluencerTable(filteredInfluencers);
    }

    renderInfluencerTable(influencers) {
        const tableHTML = `
            <style>
                .influencer-table td:nth-child(5),
                .influencer-table td:nth-child(7),
                .influencer-table td:nth-child(8) {
                    text-align: right;
                }
                .influencer-table th:nth-child(5),
                .influencer-table th:nth-child(7),
                .influencer-table th:nth-child(8) {
                    text-align: right;
                }
                .influencer-table th:nth-child(7) {
                    text-align: center;
                }
                .views-box {
                    display: inline-block;
                    background-color: #e3f2fd;
                    padding: 4px 12px;
                    border-radius: 15px;
                    color: #333;
                    font-weight: 500;
                    font-size: 13px;
                }
                .followers-box {
                    font-size: 13px;
                }
                .views-to-followers-box {
                    font-size: 13px;
                }
                .tag-modal {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 1000;
                    width: 400px;
                    max-width: 90%;
                }
                .tag-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    cursor: move;
                    user-select: none;
                }
                .tag-modal-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 18px;
                }
                .tag-modal-content {
                    max-height: 70vh;
                    overflow-y: auto;
                }
                .tag-boxes-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f9f9f9;
                    min-height: 50px;
                    margin-bottom: 15px;
                }
                .tag-input-wrapper {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #fff;
                    margin-bottom: 15px;
                }
                .tag-box {
                    background: #e3f2fd;
                    padding: 4px 10px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    color: #1976d2;
                }
                .tag-box .remove-tag {
                    cursor: pointer;
                    color: #666;
                    font-size: 16px;
                    line-height: 1;
                    padding: 0 2px;
                }
                .tag-box .remove-tag:hover {
                    color: #d32f2f;
                }
                .tag-input {
                    border: none;
                    outline: none;
                    flex-grow: 1;
                    min-width: 100px;
                    background: transparent;
                    font-size: 14px;
                    padding: 4px;
                }
                .tag-input::placeholder {
                    color: #999;
                }
                .modal-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 15px;
                }
                .modal-buttons button {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }
                .save-tags {
                    background-color: #1976d2;
                    color: white;
                }
                .save-tags:hover {
                    background-color: #1565c0;
                }
                .close-modal {
                    background-color: #f5f5f5;
                    color: #333;
                }
                .close-modal:hover {
                    background-color: #e0e0e0;
                }
                .tag-input-btn {
                    padding: 6px 12px;
                    background-color: #90caf9;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: background-color 0.2s;
                }
                .tag-input-btn:hover {
                    background-color: #64b5f6;
                }
                .tag-input-btn.has-tags {
                    background-color: #1976d2;
                }
                .tag-input-btn.has-tags:hover {
                    background-color: #1565c0;
                }
                .contact-method-container {
                    margin: 15px 0;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f9f9f9;
                }
                .contact-method-container h4 {
                    margin: 0 0 10px 0;
                    color: #333;
                    font-size: 14px;
                }
                .contact-method-options {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                .contact-method-options label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                }
                .contact-info-input {
                    margin-top: 10px;
                }
                .contact-info-input input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .contact-exclusion-container {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                }
                .contact-exclusion-container label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-bottom: 10px;
                    cursor: pointer;
                }
                .exclusion-reason-input {
                    margin-top: 10px;
                    display: none;
                }
                .exclusion-reason-input textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    min-height: 60px;
                    resize: vertical;
                }
            </style>
            <div class="influencer-table-container">
                <table class="influencer-table">
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>유저명</th>
                            <th>이름</th>
                            <th>카테고리</th>
                            <th>팔로워</th>
                            <th>등급</th>
                            <th>릴스뷰</th>
                            <th>조회수/팔로워</th>
                            <th>프로필링크</th>
                            <th>태그입력</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${influencers.map((influencer, index) => {
                            const followers = influencer.followers_num || 0;
                            const reelsViews = influencer.reels_views_num || 0;
                            const viewsToFollowers = followers > 0 ? ((reelsViews / followers) * 100).toFixed(2) : '0.00';
                            const isHighViews = parseFloat(viewsToFollowers) > 100;
                            const hasTags = influencer.tags && influencer.tags.length > 0;
                            
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${influencer.username || '-'}</td>
                                    <td>${influencer.clean_name || '-'}</td>
                                    <td>${createCategoryBar(influencer.category).outerHTML}</td>
                                    <td><span class="followers-box">${followers.toLocaleString()}</span></td>
                                    <td>${influencer.grade || '-'}</td>
                                    <td><span class="views-box">${reelsViews.toLocaleString()}</span></td>
                                    <td><span class="views-to-followers-box ${isHighViews ? 'high-views' : ''}">${viewsToFollowers}%</span></td>
                                    <td><a href="${influencer.profile_link}" target="_blank" class="profile-button">프로필 보기</a></td>
                                    <td><button class="tag-input-btn ${hasTags ? 'has-tags' : ''}" data-username="${influencer.username}">태그입력</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="tag-modal" id="tagModal">
                <div class="tag-modal-header">
                    <h3>태그 입력 - <span class="current-username"></span></h3>
                </div>
                <div class="tag-modal-content">
                    <div class="tag-boxes-container">
                        <!-- 태그박스들이 여기에 추가됩니다 -->
                    </div>
                    <div class="tag-input-wrapper">
                        <input type="text" class="tag-input" placeholder="태그를 입력하고 Enter 또는 Tab을 누르세요">
                    </div>
                    <div class="recommended-tags">
                        <h4>추천 태그</h4>
                        <div class="recommended-tags-container">
                            <button class="recommended-tag" data-tag="가성비">가성비</button>
                            <button class="recommended-tag" data-tag="브랜드">브랜드</button>
                            <button class="recommended-tag" data-tag="친근">친근</button>
                            <button class="recommended-tag" data-tag="고자세">고자세</button>      
                            <button class="recommended-tag" data-tag="얼굴공개">얼굴공개</button>
                            <button class="recommended-tag" data-tag="감성적">감성적</button>
                            <button class="recommended-tag" data-tag="실용적">실용적</button>
                            <button class="recommended-tag" data-tag="인테리어">인테리어</button>
                            <button class="recommended-tag" data-tag="셀프인테리어">셀프인테리어</button>
                            <button class="recommended-tag" data-tag="홈데코">홈데코</button>
                            <button class="recommended-tag" data-tag="홈카페">홈카페</button>                                                  
                            <button class="recommended-tag" data-tag="꿀템">꿀템</button>
                            <button class="recommended-tag" data-tag="꿀팁">꿀팁</button>
                            <button class="recommended-tag" data-tag="정보성">정보성</button>                    
                            <button class="recommended-tag" data-tag="이케아">이케아</button>
                            <button class="recommended-tag" data-tag="쿠팡">쿠팡</button>                            
                            <button class="recommended-tag" data-tag="신혼부부">신혼부부</button>       
                            <button class="recommended-tag" data-tag="중등자녀">중등자녀</button>
                            <button class="recommended-tag" data-tag="육아">육아</button>
                            <button class="recommended-tag" data-tag="주부">주부</button>
                            <button class="recommended-tag" data-tag="유튜브운영">유튜브운영</button>
                        </div>
                    </div>
                    <div class="contact-method-container">
                        <h4>컨택방법</h4>
                        <div class="contact-method-options">
                            <label>
                                <input type="radio" name="contactMethod" value="DM" checked>
                                DM
                            </label>
                            <label>
                                <input type="radio" name="contactMethod" value="inpk">
                                인포크
                            </label>
                            <label>
                                <input type="radio" name="contactMethod" value="email">
                                이메일
                            </label>
                            <label>
                                <input type="radio" name="contactMethod" value="other">
                                기타
                            </label>
                        </div>
                        <div class="contact-info-input" style="display: none;">
                            <input type="text" class="contact-info" placeholder="연락처 정보를 입력하세요">
                        </div>
                        <div class="contact-exclusion-container">
                            <label>
                                <input type="checkbox" class="contact-exclusion">
                                컨택제외
                            </label>
                            <div class="exclusion-reason-input">
                                <textarea class="exclusion-reason" placeholder="컨택제외 사유를 입력하세요"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button class="save-tags">저장</button>
                        <button class="close-modal">닫기</button>
                    </div>
                </div>
            </div>
        `;

        if (this.container) {
            const filtersContainer = this.container.querySelector('.seller-analysis-filters');
            const tableContainer = this.container.querySelector('.influencer-table-container');
            
            if (tableContainer) {
                tableContainer.innerHTML = tableHTML;
            } else {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = tableHTML;
                const newTableContainer = tempDiv.querySelector('.influencer-table-container');
                
                if (filtersContainer) {
                    filtersContainer.after(newTableContainer);
                } else {
                    this.container.appendChild(newTableContainer);
                }
            }

            // 태그 입력 관련 이벤트 리스너 설정
            this.setupTagInputHandlers();
        }
    }

    setupTagInputHandlers() {
        const modal = document.getElementById('tagModal');
        const modalHeader = modal.querySelector('.tag-modal-header');
        const tagInput = modal.querySelector('.tag-input');
        const tagBoxesContainer = modal.querySelector('.tag-boxes-container');
        const saveBtn = modal.querySelector('.save-tags');
        const closeBtn = modal.querySelector('.close-modal');
        const contactMethodInputs = modal.querySelectorAll('input[name="contactMethod"]');
        const contactInfoInput = modal.querySelector('.contact-info-input');
        const contactInfoField = modal.querySelector('.contact-info');
        const contactExclusionCheckbox = modal.querySelector('.contact-exclusion');
        const exclusionReasonInput = modal.querySelector('.exclusion-reason-input');
        const exclusionReasonField = modal.querySelector('.exclusion-reason');
        let currentUsername = '';
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // 드래그 기능
        modalHeader.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === modalHeader) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, modal);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        // 모달 초기 위치 설정
        function resetModalPosition() {
            modal.style.transform = 'translate(-50%, -50%)';
            xOffset = 0;
            yOffset = 0;
        }

        // 컨택제외 체크박스 이벤트
        contactExclusionCheckbox.addEventListener('change', () => {
            if (contactExclusionCheckbox.checked) {
                exclusionReasonInput.style.display = 'block';
            } else {
                exclusionReasonInput.style.display = 'none';
                exclusionReasonField.value = '';
            }
        });

        // 컨택방법 선택 이벤트
        contactMethodInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.value === 'DM') {
                    contactInfoInput.style.display = 'none';
                    contactInfoField.value = '';
                } else {
                    contactInfoInput.style.display = 'block';
                    if (input.value === 'inpk') {
                        contactInfoField.placeholder = '인포크 정보를 입력하세요';
                    } else if (input.value === 'email') {
                        contactInfoField.placeholder = '이메일 주소를 입력하세요';
                    } else {
                        contactInfoField.placeholder = '연락처 정보를 입력하세요';
                    }
                }
            });
        });

        // ESC 키 이벤트 리스너
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeBtn.click();
            }
        });

        // 태그 입력 버튼 클릭 이벤트
        document.querySelectorAll('.tag-input-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                currentUsername = btn.dataset.username;
                modal.style.display = 'block';
                tagInput.focus();

                // 현재 선택된 유저명 표시
                modal.querySelector('.current-username').textContent = currentUsername;

                // 기존 태그와 컨택방법 로드
                try {
                    const client = await window.mongo.getMongoClient();
                    const db = client.db('insta09_database');
                    const collection = db.collection('02_main_influencer_data');
                    const influencer = await collection.findOne({ username: currentUsername });
                    
                    // 태그 로드
                    if (influencer && influencer.tags) {
                        tagBoxesContainer.innerHTML = '';
                        influencer.tags.forEach(tag => {
                            const tagBox = document.createElement('div');
                            tagBox.className = 'tag-box';
                            tagBox.innerHTML = `
                                <span>${tag}</span>
                                <span class="remove-tag">×</span>
                            `;
                            tagBoxesContainer.appendChild(tagBox);
                            
                            // 태그 제거 이벤트
                            tagBox.querySelector('.remove-tag').addEventListener('click', () => {
                                tagBox.remove();
                            });
                        });
                    }

                    // 컨택방법 로드
                    if (influencer) {
                        if (influencer.contact_method) {
                            const contactMethodInput = modal.querySelector(`input[name="contactMethod"][value="${influencer.contact_method}"]`);
                            if (contactMethodInput) {
                                contactMethodInput.checked = true;
                                if (influencer.contact_method !== 'DM') {
                                    contactInfoInput.style.display = 'block';
                                    contactInfoField.value = influencer.contact_info || '';
                                }
                            }
                        }

                        // 컨택제외 정보 로드
                        if (influencer.is_contact_excluded) {
                            contactExclusionCheckbox.checked = true;
                            exclusionReasonInput.style.display = 'block';
                            exclusionReasonField.value = influencer.contact_exclusion_reason || '';
                        }
                    }
                } catch (error) {
                    console.error('데이터 로드 중 오류 발생:', error);
                }
            });
        });

        // 태그 입력 처리
        tagInput.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === 'Tab') && tagInput.value.trim()) {
                e.preventDefault();
                const tag = tagInput.value.trim();
                const tagBox = document.createElement('div');
                tagBox.className = 'tag-box';
                tagBox.innerHTML = `
                    <span>${tag}</span>
                    <span class="remove-tag">×</span>
                `;
                tagBoxesContainer.appendChild(tagBox);
                tagInput.value = '';

                // 태그 제거 이벤트
                tagBox.querySelector('.remove-tag').addEventListener('click', () => {
                    tagBox.remove();
                });
            }
        });

        // 모달 닫기
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            tagInput.value = '';
            tagBoxesContainer.innerHTML = '';
            contactInfoField.value = '';
            contactMethodInputs[0].checked = true;
            contactInfoInput.style.display = 'none';
            contactExclusionCheckbox.checked = false;
            exclusionReasonInput.style.display = 'none';
            exclusionReasonField.value = '';
            modal.querySelector('.current-username').textContent = '';
            resetModalPosition();
        });

        // 저장 버튼 클릭
        saveBtn.addEventListener('click', async () => {
            const tags = Array.from(tagBoxesContainer.querySelectorAll('.tag-box span:first-child'))
                .map(span => span.textContent);
            
            const contactMethod = modal.querySelector('input[name="contactMethod"]:checked').value;
            const contactInfo = contactMethod === 'DM' ? '' : contactInfoField.value.trim();
            const isExcluded = contactExclusionCheckbox.checked;
            const exclusionReason = isExcluded ? exclusionReasonField.value.trim() : '';
            
            try {
                await window.mongo.saveInfluencerTags(currentUsername, tags);
                await window.mongo.saveInfluencerContact(
                    currentUsername, 
                    contactMethod, 
                    contactInfo,
                    isExcluded,
                    exclusionReason
                );
                
                // 태그 입력 버튼 스타일 업데이트
                const tagInputBtn = document.querySelector(`.tag-input-btn[data-username="${currentUsername}"]`);
                if (tags.length > 0) {
                    tagInputBtn.classList.add('has-tags');
                } else {
                    tagInputBtn.classList.remove('has-tags');
                }
                
                alert('데이터가 성공적으로 저장되었습니다.');
                closeBtn.click();
            } catch (error) {
                console.error('데이터 저장 중 오류 발생:', error);
                alert('데이터 저장 중 오류가 발생했습니다.');
            }
        });

        // 추천 태그 클릭 이벤트
        modal.querySelectorAll('.recommended-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                const tagBox = document.createElement('div');
                tagBox.className = 'tag-box';
                tagBox.innerHTML = `
                    <span>${tag}</span>
                    <span class="remove-tag">×</span>
                `;
                tagBoxesContainer.appendChild(tagBox);
                
                // 태그 제거 이벤트
                tagBox.querySelector('.remove-tag').addEventListener('click', () => {
                    tagBox.remove();
                });
            });
        });
    }

    setupExcelDownload() {
        const excelBtn = document.getElementById('excel-download');
        if (excelBtn) {
            excelBtn.addEventListener('click', () => this.downloadExcel());
        } else {
            console.error('엑셀 다운로드 버튼을 찾을 수 없습니다.');
        }
    }

    async downloadExcel() {
        if (this.influencers.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        try {
            // 현재 필터링된 데이터 가져오기
            const filteredData = window.sellerAnalysisFilter ? 
                window.sellerAnalysisFilter.filterInfluencers(this.influencers) : 
                this.influencers;

            // CSV 데이터 생성 (BOM 추가 및 셀 정렬을 위한 공백 사용)
            const BOM = '\uFEFF'; // UTF-8 BOM
            
            // 컬럼 너비 정의
            const columnWidths = {
                rank: 8,
                username: 20,
                name: 15,
                category: 30,
                followers: 15,
                grade: 10,
                reelsViews: 15,
                viewsToFollowers: 15,
                profileLink: 30
            };

            // 헤더 생성 (고정 너비)
            const headers = [
                `"${'순위'.padEnd(columnWidths.rank)}"`,
                `"${'유저명'.padEnd(columnWidths.username)}"`,
                `"${'이름'.padEnd(columnWidths.name)}"`,
                `"${'카테고리'.padEnd(columnWidths.category)}"`,
                `"${'팔로워'.padEnd(columnWidths.followers)}"`,
                `"${'등급'.padEnd(columnWidths.grade)}"`,
                `"${'릴스뷰'.padEnd(columnWidths.reelsViews)}"`,
                `"${'조회수/팔로워'.padEnd(columnWidths.viewsToFollowers)}"`,
                `"${'프로필링크'.padEnd(columnWidths.profileLink)}"`
            ];

            const rows = filteredData.map((influencer, index) => {
                const followers = influencer.followers_num || 0;
                const reelsViews = influencer.reels_views_num || 0;
                const viewsToFollowers = followers > 0 ? ((reelsViews / followers) * 100).toFixed(2) : '0.00';
                
                // 각 셀을 고정 너비로 생성하고 따옴표로 감싸기
                return [
                    `"${String(index + 1).padStart(columnWidths.rank)}"`, // 순위 (오른쪽 정렬)
                    `"${(influencer.username || '-').padEnd(columnWidths.username)}"`, // 유저명
                    `"${(influencer.clean_name || '-').padEnd(columnWidths.name)}"`, // 이름
                    `"${(influencer.category || '-').padEnd(columnWidths.category)}"`, // 카테고리
                    `"${followers.toLocaleString().padStart(columnWidths.followers)}"`, // 팔로워 (오른쪽 정렬)
                    `"${(influencer.grade || '-').padEnd(columnWidths.grade)}"`, // 등급
                    `"${reelsViews.toLocaleString().padStart(columnWidths.reelsViews)}"`, // 릴스뷰 (오른쪽 정렬)
                    `"${(viewsToFollowers + '%').padStart(columnWidths.viewsToFollowers)}"`, // 조회수/팔로워 (오른쪽 정렬)
                    `"${(influencer.profile_link || '-').padEnd(columnWidths.profileLink)}"` // 프로필링크
                ];
            });

            // CSV 문자열 생성 (쉼표로 구분)
            const csvContent = BOM + [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // 파일명 생성 (현재 날짜 포함)
            const now = new Date();
            const defaultFileName = `셀러분석_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.csv`;

            // IPC를 통해 메인 프로세스에 파일 저장 요청
            const { ipcRenderer } = require('electron');
            const filePath = await ipcRenderer.invoke('save-file', {
                defaultPath: defaultFileName,
                content: csvContent
            });

            if (filePath) {
                alert('파일이 성공적으로 저장되었습니다.');
            }
        } catch (error) {
            console.error('파일 저장 중 오류 발생:', error);
            alert('파일 저장 중 오류가 발생했습니다.');
        }
    }
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

// 전역 인스턴스 생성
window.sellerAnalysisManager = new SellerAnalysisManager(); 