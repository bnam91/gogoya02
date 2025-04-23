// window.mongo 사용
export class Dashboard {
    constructor() {
        //this.mongo = window.mongo;
    }

    async init() {
        //console.log("대시보드 초기화 시작");
        //console.log("MongoDB 객체:", this.mongo);
        //console.log("MongoDB 함수 목록:", Object.keys(this.mongo));
        
        // window.api가 존재하는지 확인하고 로그 찍기
        console.log("API 객체:", window.api);
        console.log("API 함수 목록:", Object.keys(window.api));

        try {
            await this.loadMongoData();
        } catch (error) {
            console.error("대시보드 초기화 중 오류:", error);
            this.loadFallbackData();
        }
    }

    // 실제 MongoDB 데이터 로드 시도
    async loadMongoData() {
        try {
            console.log("MongoDB에서 데이터 로드 시도...");

            /*
            if (!this.mongo) {
                throw new Error("MongoDB 모듈이 로드되지 않았습니다.");
            }
            // 정확한 컬렉션에서 직접 쿼리
            if (typeof this.mongo.getMongoClient === 'function') {
                console.log("MongoDB 클라이언트 직접 접근 시도");
                
                try {
                    const client = await this.mongo.getMongoClient();
                    const db = client.db("insta09_database");
                    const collection = db.collection("gogoya_vendor_CallRecords");
                    
                    console.log("insta09_database.gogoya_vendor_CallRecords 컬렉션 접근 중");
                    
                    // nextstep이 '제안서 요청'인 문서 찾기
                    const proposalRequests = await collection.find({ 
                        nextstep: "제안서 요청" 
                    }).toArray();
                    
                    console.log("제안서 요청 상태 레코드 수:", proposalRequests.length);
                    
                    // 건수만 표시
                    this.displayProposalCount(proposalRequests.length);
                    return;
                } catch (err) {
                    console.error("직접 쿼리 오류:", err);
                }
            }
            
            // 직접 쿼리가 실패하면 대체 데이터 사용
            this.loadFallbackData();
            */
           
            const proposalRequests = await window.api.fetchProposalRequests();
    
            console.log("제안서 요청 상태 레코드 수:", proposalRequests.length);
        
            this.displayProposalCount(proposalRequests.length);

        } catch (error) {
            console.error('MongoDB 데이터 로드 중 오류:', error);
            this.loadFallbackData();
        }
    }

    // 대체 데이터 로드
    loadFallbackData() {
        console.log("대체 데이터 사용");
        // 대체 데이터 건수 3개로 설정
        this.displayProposalCount(3);
    }

    // 제안서 요청 건수만 표시
    displayProposalCount(count) {
        console.log("제안서 요청 건수:", count);

        const leftPanel = document.getElementById('dashboard-left-content');
        console.log("좌측 패널 요소:", leftPanel);

        if (!leftPanel) {
            console.error("좌측 패널 요소를 찾을 수 없습니다.");
            return;
        }

        leftPanel.innerHTML = `
            <div class="panel-header">
                <h3>제안서 요청 브랜드</h3>
                <span class="count-badge">${count}</span>
            </div>
        `;

        console.log("innerHTML 설정 완료");
    }
}

// 대시보드 인스턴스 생성
//window.dashboard = new Dashboard(); 