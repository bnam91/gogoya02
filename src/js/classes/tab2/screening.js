// window.mongo 사용
export class ScreeningManager {
    constructor() {
        this.mongo = window.api;
        this.currentPage = 1;
        this.itemsPerPage = 1000; // 충분히 큰 값으로 설정
        this.viewMode = 'brand'; // 'brand', 'item', 'influencer'
        this.searchTerm = '';
        this.selectedCategories = [];
        this.selectedViews = null;
        this.data = [];
        this.filteredData = [];
        this.categories = [
            "🍽주방용품&식기",
            "🛋생활용품&가전",
            "🥦식품&건강식품",
            "🧴뷰티&헬스",
            "👶유아&교육",
            "👗의류&잡화",
            "🚗기타"
        ];
    }

    init = async () => {
        console.log("스크리닝 초기화 시작");
        //console.log("MongoDB 객체:", this.mongo);
        try {
            console.log("요소들 렌더링 시작");
            await this.loadScreeningData();
            this.setupEventListeners();
            this.setupViewModeButtons();
            this.setupFilters();
        } catch (error) {
            console.error("스크리닝 초기화 중 오류:", error);
            this.loadFallbackData();
        }
    }

    setupEventListeners = () => {
        // 데이터 아이템 클릭 이벤트
        document.addEventListener('click', (e) => {
            const dataItem = e.target.closest('.data-item');
            if (dataItem) {
                const brandName = dataItem.dataset.brand;
                const itemName = dataItem.dataset.item;
                this.showDetailInfo(brandName, itemName);
            }
        });
    }

    setupViewModeButtons = () => {
        const viewModeButtons = document.querySelectorAll('.view-mode-btn');
        viewModeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 모든 버튼에서 active 클래스 제거
                viewModeButtons.forEach(btn => btn.classList.remove('active'));
                // 클릭된 버튼에 active 클래스 추가
                button.classList.add('active');

                const mode = button.dataset.mode;
                this.setViewMode(mode);
            });
        });
    }

    setupFilters = () => {
        // 검색어 필터
        const searchInput = document.getElementById('screening-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
            });
        }

        // 카테고리 필터
        const categorySelect = document.querySelector('.filter-select');
        const categoryOptions = document.querySelector('.filter-options');
        const categoryCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');

        if (categorySelect) {
            // 드롭다운 토글
            categorySelect.addEventListener('click', () => {
                categoryOptions.classList.toggle('show');
            });

            // 체크박스 변경 이벤트
            categoryCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateSelectedCategories();
                    this.updateSelectedItemsDisplay();
                });
            });
        }

        // 릴스뷰 필터
        const viewsSelect = document.querySelectorAll('.filter-dropdown')[1].querySelector('.filter-select');
        const viewsOptions = document.querySelectorAll('.filter-dropdown')[1].querySelector('.filter-options');
        const viewsRadios = document.querySelectorAll('.filter-option input[type="radio"]');

        if (viewsSelect) {
            // 드롭다운 토글
            viewsSelect.addEventListener('click', () => {
                viewsOptions.classList.toggle('show');
            });

            // 라디오 버튼 변경 이벤트
            viewsRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    this.selectedViews = radio.value;
                    this.updateSelectedViewsDisplay();
                });
            });
        }

        // 필터 적용 버튼
        const applyButton = document.getElementById('screening-apply');
        if (applyButton) {
            applyButton.addEventListener('click', () => {
                console.log('필터 적용 버튼 클릭');
                this.applyFilters();
            });
        } else {
            console.error('필터 적용 버튼을 찾을 수 없습니다.');
        }

        // 필터 초기화 버튼
        const resetButton = document.getElementById('screening-reset');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // 문서 클릭 시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!categorySelect?.contains(e.target) && !categoryOptions?.contains(e.target)) {
                categoryOptions?.classList.remove('show');
            }
            if (!viewsSelect?.contains(e.target) && !viewsOptions?.contains(e.target)) {
                viewsOptions?.classList.remove('show');
            }
        });
    }

    updateSelectedCategories = () => {
        this.selectedCategories = Array.from(
            document.querySelectorAll('.filter-option input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
    }

    updateSelectedItemsDisplay = () => {
        const selectedItems = document.querySelector('.selected-items');
        if (this.selectedCategories.length === 0) {
            selectedItems.textContent = '카테고리 선택';
        } else {
            selectedItems.textContent = this.selectedCategories.join(', ');
        }
    }

    updateSelectedViewsDisplay = () => {
        const selectedViews = document.querySelectorAll('.filter-dropdown')[1].querySelector('.selected-items');
        if (this.selectedViews) {
            const selectedOption = document.querySelector(`input[type="radio"][value="${this.selectedViews}"]`).nextElementSibling.textContent;
            selectedViews.textContent = selectedOption;
        } else {
            selectedViews.textContent = '릴스뷰 선택';
        }
    }

    applyFilters = async () => {
        // 로딩 토스트 메시지 표시
        const toast = document.createElement('div');
        toast.className = 'toast-message loading';
        toast.innerHTML = `
            <span class="toast-icon">⌛</span>
            <span class="toast-text">필터를 적용하는 중...</span>
        `;
        document.body.appendChild(toast);

        try {
            let result = this.data;

            // 카테고리 필터
            if (this.selectedCategories.length > 0) {
                result = result.filter(item => this.selectedCategories.includes(item.item_category));
            }

            // 검색어 필터
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                result = result.filter(item =>
                    item.brand.toLowerCase().includes(term) ||
                    item.item.toLowerCase().includes(term) ||
                    item.author.toLowerCase().includes(term) ||
                    (item.clean_name && item.clean_name.toLowerCase().includes(term))
                );
            }

            // 릴스뷰 필터
            if (this.selectedViews) {
                console.log("릴스뷰 필터 적용");
                const [min, max] = this.selectedViews.split('-').map(Number);
                /*
                const [min, max] = this.selectedViews.split('-').map(Number);

                // 02_main_influencer_data 컬렉션에서 조회수 데이터 가져오기
                const client = await this.mongo.getMongoClient();
                const db = client.db("insta09_database");
                const influencerCollection = db.collection("02_main_influencer_data");

                // 각 아이템의 인플루언서 정보 가져오기
                const itemsWithInfluencerInfo = await Promise.all(
                    result.map(async (item) => {
                        const cleanName = item.clean_name || item.author;
                        const influencerData = await influencerCollection.findOne(
                            { clean_name: cleanName },
                            { projection: { "reels_views(15)": 1 } }
                        );

                        return {
                            ...item,
                            reelsViews: influencerData ? influencerData["reels_views(15)"] || 0 : 0
                        };
                    })
                );
                */

                // clean_name 목록 추출
                const cleanNames = result.map(item => item.clean_name || item.author);
              
                // IPC로 인플루언서 조회수 데이터 요청
                console.log("인플루언서 조회수 데이터 요청");
                const influencerDataList = await window.api.fetchInfluencerViews(cleanNames);
                console.log("인플루언서 조회수 데이터 요청 완료");
                console.log("인플루언서 조회수 데이터 요청 결과 크기:", influencerDataList.length);

                // 맵으로 빠르게 접근 가능하게 가공
                const influencerMap = new Map(
                  influencerDataList.map(data => [data.clean_name, data["reels_views(15)"] || 0])
                );
                console.log("influencerMap:", influencerMap);

                // 결과에 조회수 붙이기
                const itemsWithInfluencerInfo = result.map(item => ({
                  ...item,
                  reelsViews: influencerMap.get(item.clean_name || item.author) || 0
                }));
                console.log("itemsWithInfluencerInfo:", itemsWithInfluencerInfo);

                // 조회수 기준으로 필터링
                result = itemsWithInfluencerInfo.filter(item => {
                    const views = item.reelsViews;

                    if (max === undefined) {
                        // "100만 이상" 케이스
                        return views >= min;
                    } else {
                        // 일반 구간 케이스
                        return views >= min && views < max;
                    }
                });
            }

            this.filteredData = result;

            // 필터링 결과 카운트 업데이트
            const totalCount = document.getElementById('screening-total-count');
            const filteredCount = document.getElementById('screening-filtered-count');

            if (totalCount && filteredCount) {
                totalCount.textContent = this.data.length;
                filteredCount.textContent = result.length;
            }

            await this.renderContent();

            // 성공 토스트 메시지로 변경
            toast.className = 'toast-message success';
            toast.innerHTML = `
                <span class="toast-icon">✓</span>
                <span class="toast-text">필터가 적용되었습니다.</span>
            `;
        } catch (error) {
            console.error('필터 적용 중 오류:', error);
            // 에러 토스트 메시지로 변경
            toast.className = 'toast-message error';
            toast.innerHTML = `
                <span class="toast-icon">✕</span>
                <span class="toast-text">필터 적용 중 오류가 발생했습니다.</span>
            `;
        } finally {
            // 3초 후 토스트 메시지 제거
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    resetFilters = async () => {
        // 로딩 토스트 메시지 표시
        const toast = document.createElement('div');
        toast.className = 'toast-message loading';
        toast.innerHTML = `
            <span class="toast-icon">⌛</span>
            <span class="toast-text">필터를 초기화하는 중...</span>
        `;
        document.body.appendChild(toast);

        try {
            // 모든 체크박스 해제
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            // 라디오 버튼 초기화
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.checked = false;
            });

            // 검색어 초기화
            const searchInput = document.getElementById('screening-search');
            if (searchInput) {
                searchInput.value = '';
            }

            // 선택된 값 초기화
            this.selectedCategories = [];
            this.selectedViews = null;
            this.searchTerm = '';

            // 디스플레이 텍스트 초기화
            this.updateSelectedCategories();
            this.updateSelectedViewsDisplay();

            // 데이터 초기화
            this.filteredData = this.data;

            // 필터링 결과 카운트 업데이트
            const totalCount = document.getElementById('screening-total-count');
            const filteredCount = document.getElementById('screening-filtered-count');

            if (totalCount && filteredCount) {
                totalCount.textContent = this.data.length;
                filteredCount.textContent = this.data.length;
            }

            await this.renderContent();

            // 성공 토스트 메시지로 변경
            toast.className = 'toast-message success';
            toast.innerHTML = `
                <span class="toast-icon">✓</span>
                <span class="toast-text">필터가 초기화되었습니다.</span>
            `;
        } catch (error) {
            // 에러 토스트 메시지로 변경
            toast.className = 'toast-message error';
            toast.innerHTML = `
                <span class="toast-icon">✕</span>
                <span class="toast-text">필터 초기화 중 오류가 발생했습니다.</span>
            `;
        } finally {
            // 3초 후 토스트 메시지 제거
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    setViewMode = async (mode) => {
        this.viewMode = mode;

        // 로딩 토스트 메시지 표시
        const toast = document.createElement('div');
        toast.className = 'toast-message loading';
        toast.innerHTML = `
            <span class="toast-icon">⌛</span>
            <span class="toast-text">데이터를 불러오는 중...</span>
        `;
        document.body.appendChild(toast);

        try {
            await this.renderContent();
        } finally {
            // 로딩 토스트 메시지 제거
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }

    // 실제 MongoDB 데이터 로드 시도
    loadScreeningData = async () => {
        try {
            console.log("MongoDB에서 데이터 로드 시도...");

            if (!this.mongo) {
                throw new Error("MongoDB 모듈이 로드되지 않았습니다.");
            }

            // 정확한 컬렉션에서 직접 쿼리
            //if (typeof this.mongo.getMongoClient === 'function') {
            console.log("MongoDB 클라이언트 직접 접근 시도");

            try {
                /*
                const client = await this.mongo.getMongoClient();
                console.log("MongoDB 클라이언트 연결 성공");
                
                const db = client.db("insta09_database");
                console.log("데이터베이스 접근 성공");
                
                const collection = db.collection("04_main_item_today_data");
                console.log("컬렉션 접근 성공");
                
                // 20일 전 날짜 계산 (날짜변경)
                const twentyDaysAgo = new Date();
                twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 25);
                
                // 최근 20일 데이터 조회 (브랜드명이 '확인필요'가 아닌 데이터만)
                const data = await collection.find({
                    crawl_date: { $gte: twentyDaysAgo },
                    brand: { $ne: "확인필요" }
                })
                    .sort({ crawl_date: -1 })
                    .toArray();
                */
                const data = await window.api.fetchScreeningData();
                console.log("로드된 데이터 수:", data.length);
                console.log("첫 번째 데이터:", data[0]);

                if (data.length > 0) {
                    this.data = data;
                    this.filteredData = data;
                    this.renderContent();
                } else {
                    console.log("데이터가 없습니다.");
                    this.loadFallbackData();
                }
                return;
            } catch (err) {
                console.error("MongoDB 쿼리 오류:", err);
                throw err;
            }
            //} else {
            //  console.error("getMongoClient 함수를 찾을 수 없습니다.");
            //throw new Error("getMongoClient 함수를 찾을 수 없습니다.");
            //}
        } catch (error) {
            console.error('MongoDB 데이터 로드 중 오류:', error);
            this.loadFallbackData();
        }
    }

    // 대체 데이터 로드
    loadFallbackData = () => {
        console.log("대체 데이터 사용");
        const fallbackData = [
            {
                _id: '1',
                brand: "브랜드1",
                item: "아이템1",
                item_category: "카테고리1",
                author: "인플루언서1",
                clean_name: "클린네임1",
                crawl_date: new Date().toISOString(),
                item_feed_link: "https://instagram.com"
            },
            {
                _id: '2',
                brand: "브랜드2",
                item: "아이템2",
                item_category: "카테고리2",
                author: "인플루언서2",
                clean_name: "클린네임2",
                crawl_date: new Date().toISOString(),
                item_feed_link: "https://instagram.com"
            }
        ];
        this.data = fallbackData;
        this.filteredData = fallbackData;
        this.renderContent();
    }

    // 데이터 그룹화
    groupByBrand = () => {
        const grouped = {};
        this.filteredData.forEach(item => {
            if (!grouped[item.brand]) {
                grouped[item.brand] = [];
            }
            grouped[item.brand].push(item);
        });
        return grouped;
    }

    groupByItem = () => {
        const grouped = {};
        this.filteredData.forEach(item => {
            if (!grouped[item.item]) {
                grouped[item.item] = [];
            }
            grouped[item.item].push(item);
        });
        return grouped;
    }

    groupByInfluencer = () => {
        const grouped = {};
        this.filteredData.forEach(item => {
            if (!grouped[item.author]) {
                grouped[item.author] = [];
            }
            grouped[item.author].push(item);
        });
        return grouped;
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 콘텐츠 렌더링
    renderContent = async () => {
        const contentContainer = document.getElementById('screening-content-container');
        if (!contentContainer) return;

        let html = '';

        if (this.viewMode === 'brand') {
            const groupedByBrand = this.groupByBrand();
            html = await this.renderBrandView(groupedByBrand);
        } else if (this.viewMode === 'item') {
            const groupedByItem = this.groupByItem();
            html = await this.renderItemView(groupedByItem);
        } else {
            const groupedByInfluencer = this.groupByInfluencer();
            html = await this.renderInfluencerView(groupedByInfluencer);
        }

        contentContainer.innerHTML = html;
    }

    // 브랜드별 뷰 렌더링
    renderBrandView = async (groupedByBrand) => {
        try {
            /*
            const client = await this.mongo.getMongoClient();
            const db = client.db("insta09_database");
            const influencerCollection = db.collection("02_main_influencer_data");
            
            // 각 아이템의 인플루언서 정보 가져오기
            const itemsWithInfluencerInfo = await Promise.all(
                Object.keys(groupedByBrand).map(async (brand) => {
                    const items = await Promise.all(
                        groupedByBrand[brand].map(async (item) => {
                            const cleanName = item.clean_name || item.author;
                            const influencerData = await influencerCollection.findOne(
                                { clean_name: cleanName },
                                { projection: { "reels_views(15)": 1, grade: 1 } }
                            );
                            return {
                                ...item,
                                reelsViews: influencerData ? influencerData["reels_views(15)"] || 0 : 0,
                                grade: influencerData ? influencerData.grade || 'N/A' : 'N/A'
                            };
                        })
                    );
                    return { brand, items };
                })
            );
            */

            // 각 브랜드별 아이템 처리
            const itemsWithInfluencerInfo = await Promise.all(
                Object.keys(groupedByBrand).map(async (brand) => {
                    const items = await Promise.all(
                        groupedByBrand[brand].map(async (item) => {
                            const cleanName = item.clean_name || item.author;

                            // ✅ IPC를 통해 메인 프로세스에서 인플루언서 데이터 가져오기
                            const influencerData = await window.api.fetchInfluencerData(cleanName);

                            return {
                                ...item,
                                reelsViews: influencerData ? influencerData["reels_views(15)"] || 0 : 0,
                                grade: influencerData ? influencerData.grade || 'N/A' : 'N/A'
                            };
                        })
                    );
                    return { brand, items };
                })
            );

            return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${itemsWithInfluencerInfo.map(({ brand, items }) => `
                    <div class="bg-white rounded-lg shadow-md p-4 overflow-hidden">
                        <div class="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <h3 class="text-lg font-semibold truncate">${brand}</h3>
                            <span class="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                    ${items.length}
                            </span>
                        </div>
                        <div class="overflow-y-auto max-h-64">
                                ${items.map(item => `
                                <div class="mb-3 pb-2 border-b border-gray-100 last:border-0">
                                    <div class="flex items-center">
                                        <p class="text-sm font-medium">${item.item}</p>
                                    </div>
                                    <div class="flex items-center mt-1">
                                        <p class="text-sm text-gray-600">
                                            ${item.clean_name || item.author}
                                        </p>
                                            <span class="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                                조회수: ${item.reelsViews.toLocaleString()}
                                            </span>
                                            <span class="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                                등급: ${item.grade}
                                            </span>
                                        <a 
                                            href="${item.item_feed_link}" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            class="ml-auto text-pink-500 hover:text-pink-700"
                                        >
                                            <i class="fab fa-instagram"></i>
                                        </a>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">
                                        ${this.formatDate(item.crawl_date)}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        } catch (error) {
            console.error('브랜드별 뷰 렌더링 중 오류:', error);
            return this.renderBrandViewFallback(groupedByBrand);
        }
    }

    // 상품별 뷰 렌더링
    renderItemView = async (groupedByItem) => {
        try {
            // 각 브랜드별 아이템 처리
            const itemsWithInfluencerInfo = await Promise.all(
                Object.keys(groupedByItem).map(async (item) => {
                  const products = await Promise.all(
                    groupedByItem[item].map(async (product) => {
                      const cleanName = product.clean_name || product.author;
                      const influencerData = await window.api.fetchInfluencerData(cleanName);
              
                      return {
                        ...product,
                        reelsViews: influencerData ? influencerData["reels_views(15)"] || 0 : 0,
                        grade: influencerData ? influencerData.grade || 'N/A' : 'N/A'
                      };
                    })
                  );

                  return { item, products };
                })
              );

            return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${itemsWithInfluencerInfo.map(({ item, products }) => `
                    <div class="bg-white rounded-lg shadow-md p-4 overflow-hidden">
                        <div class="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <h3 class="text-lg font-semibold truncate">${item}</h3>
                            <span class="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                    ${products.length}
                            </span>
                        </div>
                        <div class="overflow-y-auto max-h-64">
                                ${products.map(product => `
                                <div class="mb-3 pb-2 border-b border-gray-100 last:border-0">
                                    <div class="flex items-center">
                                        <p class="text-sm font-medium">${product.brand}</p>
                                    </div>
                                    <div class="flex items-center mt-1">
                                        <p class="text-sm text-gray-600">
                                            ${product.clean_name || product.author}
                                        </p>
                                            <span class="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                                조회수: ${product.reelsViews.toLocaleString()}
                                            </span>
                                            <span class="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                                등급: ${product.grade}
                                            </span>
                                        <a 
                                            href="${product.item_feed_link}" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            class="ml-auto text-pink-500 hover:text-pink-700"
                                        >
                                            <i class="fab fa-instagram"></i>
                                        </a>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">
                                        ${this.formatDate(product.crawl_date)}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        } catch (error) {
            console.error('상품별 뷰 렌더링 중 오류:', error);
            return this.renderItemViewFallback(groupedByItem);
        }
    }

    // 인플루언서별 뷰 렌더링
    renderInfluencerView = async (groupedByInfluencer) => {
        try {

            // 각 브랜드별 아이템 처리
            const sortedInfluencers = await Promise.all(
                Object.keys(groupedByInfluencer).map(async (influencer) => {
                  const items = await Promise.all(
                    groupedByInfluencer[influencer].map(async (item) => {
                      const cleanName = item.clean_name || item.author;
                      const influencerData = await window.api.fetchInfluencerData(cleanName);
              
                      return {
                        ...item,
                        reelsViews: influencerData ? influencerData["reels_views(15)"] || 0 : 0,
                        grade: influencerData ? influencerData.grade || 'N/A' : 'N/A'
                      };
                    })
                  );
              
                  return {
                    influencer,
                    items,
                    cleanName: items[0]?.clean_name || influencer,
                    reelsViews: items[0]?.reelsViews || 0,
                    grade: items[0]?.grade || 'N/A'
                  };
                })
              );

            // reels_views(15) 기준으로 내림차순 정렬
            sortedInfluencers.sort((a, b) => b.reelsViews - a.reelsViews);

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${sortedInfluencers.map(({ influencer, cleanName, reelsViews, grade }) => `
                        <div class="bg-white rounded-lg shadow-md p-4 overflow-hidden">
                            <div class="flex items-center mb-3 pb-2 border-b border-gray-200">
                                <h3 class="text-lg font-semibold truncate">
                                    ${cleanName}
                                </h3>
                                <a 
                                    href="https://www.instagram.com/${influencer}" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    class="ml-2 text-pink-500 hover:text-pink-700"
                                >
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <span class="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                    조회수: ${reelsViews.toLocaleString()}
                                </span>
                                <span class="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                    등급: ${grade}
                                </span>
                                <span class="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
                                    ${groupedByInfluencer[influencer].length}
                                </span>
                            </div>
                            <div class="overflow-y-auto max-h-64">
                                ${groupedByInfluencer[influencer].map(promo => `
                                    <div class="mb-3 pb-2 border-b border-gray-100 last:border-0">
                                        <div class="flex items-center">
                                            <p class="text-sm font-medium">${promo.brand}</p>
                                        </div>
                                        <div class="flex items-center mt-1">
                                            <p class="text-sm text-gray-600">${promo.item}</p>
                                            <a 
                                                href="${promo.item_feed_link}" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                class="ml-auto text-pink-500 hover:text-pink-700"
                                            >
                                                <i class="fab fa-instagram"></i>
                                            </a>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-1">
                                            ${this.formatDate(promo.crawl_date)}
                                        </p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('인플루언서 데이터 정렬 중 오류:', error);
            return this.renderInfluencerViewFallback(groupedByInfluencer);
        }
    }

    // 정렬 실패 시 기본 렌더링
    renderInfluencerViewFallback = (groupedByInfluencer) => {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${Object.keys(groupedByInfluencer).map(influencer => `
                    <div class="bg-white rounded-lg shadow-md p-4 overflow-hidden">
                        <div class="flex items-center mb-3 pb-2 border-b border-gray-200">
                            <h3 class="text-lg font-semibold truncate">
                                ${groupedByInfluencer[influencer][0].clean_name || influencer}
                            </h3>
                            <a 
                                href="https://www.instagram.com/${influencer}" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="ml-2 text-pink-500 hover:text-pink-700"
                            >
                                <i class="fab fa-instagram"></i>
                            </a>
                            <span class="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
                                ${groupedByInfluencer[influencer].length}
                            </span>
                        </div>
                        <div class="overflow-y-auto max-h-64">
                            ${groupedByInfluencer[influencer].map(promo => `
                                <div class="mb-3 pb-2 border-b border-gray-100 last:border-0">
                                    <div class="flex items-center">
                                        <p class="text-sm font-medium">${promo.brand}</p>
                                    </div>
                                    <div class="flex items-center mt-1">
                                        <p class="text-sm text-gray-600">${promo.item}</p>
                                        <a 
                                            href="${promo.item_feed_link}" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            class="ml-auto text-pink-500 hover:text-pink-700"
                                        >
                                            <i class="fab fa-instagram"></i>
                                        </a>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">
                                        ${this.formatDate(promo.crawl_date)}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 상세 정보 표시
    showDetailInfo = async (brandName, itemName) => {
        try {

            const data = await window.api.fetchItemDetails(brandName, itemName);
            // 상세 정보 표시
            const detailInfo = document.querySelector('.detail-info');
            if (detailInfo) {
                const html = `
                    <h4>${brandName} - ${itemName}</h4>
                    <div class="info-item">
                        <span class="info-label">총 등록 수:</span>
                        <span class="info-value">${data.length}건</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">카테고리:</span>
                        <span class="info-value">${data[0]?.item_category || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">인플루언서 목록:</span>
                        <div class="influencer-list">
                            ${data.map(item => `
                                <div class="influencer-item">
                                    <span>${item.author}</span>
                                    <span>${new Date(item.crawl_date).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                detailInfo.innerHTML = html;
            }
        } catch (error) {
            console.error('상세 정보 로드 중 오류:', error);
        }
    }
}

// 스크리닝 매니저 인스턴스 생성
//console.log("ScreeningManager 인스턴스 생성 시작");
//window.screeningManager = new ScreeningManager();
//console.log("ScreeningManager 인스턴스 생성 완료"); 