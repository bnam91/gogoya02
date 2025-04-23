export class DmRecordsManager {
    constructor() {
        this.records = [];
    }

    async getDmRecords(cleanName) {
        try {
            const client = await window.mongo.getMongoClient();
            const db = client.db('insta09_database');
            const collection = db.collection('gogoya_DmRecords');

            // influencer_name이 cleanName과 일치하고, status가 'failed'가 아닌 레코드 조회
            const records = await collection.find({
                influencer_name: cleanName,
                status: { $ne: 'failed' }
            })
            .sort({ dm_date: -1 }) // 최신순 정렬
            .toArray();

            this.records = records;
            return records;
        } catch (error) {
            console.error('DM 기록 조회 중 오류 발생:', error);
            return [];
        }
    }

    renderDmRecords(records) {
        if (!records || records.length === 0) {
            return '<div class="no-records">DM 기록이 없습니다.</div>';
        }

        return `
            <div class="dm-records">
                ${records.map(record => `
                    <div class="dm-record">
                        <div class="dm-header">
                            <span class="dm-date">${record.dm_date}</span>
                            <span class="dm-status ${record.status}">${record.status}</span>
                        </div>
                        <div class="dm-content">
                            <div class="dm-title">${record.template_content}</div>
                            <div class="dm-message">${record.message}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// 전역 인스턴스 생성
//window.dmRecordsManager = new DmRecordsManager(); 