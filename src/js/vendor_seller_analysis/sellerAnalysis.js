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
                        "reels_views_num": 1
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
                        </tr>
                    </thead>
                    <tbody>
                        ${influencers.map((influencer, index) => {
                            const followers = influencer.followers_num || 0;
                            const reelsViews = influencer.reels_views_num || 0;
                            const viewsToFollowers = followers > 0 ? ((reelsViews / followers) * 100).toFixed(2) : '0.00';
                            const isHighViews = parseFloat(viewsToFollowers) > 100;
                            
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${influencer.username || '-'}</td>
                                    <td>${influencer.clean_name || '-'}</td>
                                    <td>${createCategoryBar(influencer.category).outerHTML}</td>
                                    <td>${followers.toLocaleString()}</td>
                                    <td>${influencer.grade || '-'}</td>
                                    <td>${reelsViews.toLocaleString()}</td>
                                    <td class="${isHighViews ? 'high-views' : ''}">${viewsToFollowers}%</td>
                                    <td><a href="${influencer.profile_link}" target="_blank" class="profile-button">프로필 보기</a></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (this.container) {
            // 필터 컨테이너 찾기
            const filtersContainer = this.container.querySelector('.seller-analysis-filters');
            // 테이블 컨테이너 찾기
            const tableContainer = this.container.querySelector('.influencer-table-container');
            
            if (tableContainer) {
                // 테이블 컨테이너가 있으면 내용만 업데이트
                tableContainer.innerHTML = tableHTML;
            } else {
                // 테이블 컨테이너가 없으면 새로 생성
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = tableHTML;
                const newTableContainer = tempDiv.querySelector('.influencer-table-container');
                
                // 필터 뒤에 테이블 추가
                if (filtersContainer) {
                    filtersContainer.after(newTableContainer);
                } else {
                    this.container.appendChild(newTableContainer);
                }
            }
        }
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