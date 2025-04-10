const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('./config');
const { ObjectId } = require('mongodb');

const uri = "mongodb+srv://coq3820:JmbIOcaEOrvkpQo1@cluster0.qj1ty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const ITEMS_PER_PAGE = 20;

// MongoDB 클라이언트를 전역으로 관리
let client = null;

// MongoDB 클라이언트 연결 함수
async function getMongoClient() {
    if (!client) {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 10, // 최대 연결 풀 크기
            minPoolSize: 5,  // 최소 연결 풀 크기
            connectTimeoutMS: 10000, // 연결 타임아웃
            socketTimeoutMS: 45000,  // 소켓 타임아웃
            retryWrites: true,
            retryReads: true
        });
        await client.connect();
    }
    return client;
}

// 재시도 로직을 포함한 함수 실행
async function withRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                console.log(`재시도 중... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

async function getMongoData() {
    try {
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB 연결 성공!");

        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.vendorBrandInfo);
        
        const data = await collection.find({}).toArray();
        await client.close();
        
        return data;
    } catch (error) {
        console.error('MongoDB 연결 오류:', error);
        throw error;
    }
}

async function getVendorData(skip = 0, limit = 20, filters = {}) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.mainItemTodayData);
        
        // 필터 쿼리 생성
        const query = {};
        
        // 브랜드명 검색 필터
        if (filters.searchQuery) {
            query.brand = { 
                $regex: filters.searchQuery, 
                $options: 'i'  // 대소문자 구분 없이 검색
            };
        }
        
        // 카테고리 필터
        if (filters.categories && filters.categories.length > 0) {
            query.item_category = { $in: filters.categories };
        }
        
        // 등급 필터
        if (filters.grades && filters.grades.length > 0) {
            query.grade = { $in: filters.grades };
        }

        // 인증 상태 필터
        if (filters.verificationStatus) {
            const brandInfoCollection = db.collection(config.database.collections.vendorBrandInfo);
            const brandInfoCursor = await brandInfoCollection.find(
                { is_verified: filters.verificationStatus },
                { projection: { brand_name: 1 } }
            );
            const brandInfos = await brandInfoCursor.toArray();
            const brandNamesWithVerification = brandInfos.map(info => info.brand_name);
            
            query.brand = { $in: brandNamesWithVerification };
        }

        // 브랜드 정보 유무 필터
        if (filters.hasBrandInfo !== null) {
            const brandInfoCollection = db.collection(config.database.collections.vendorBrandInfo);
            const brandInfoCursor = await brandInfoCollection.find({}, { projection: { brand_name: 1 } });
            const brandInfos = await brandInfoCursor.toArray();
            const brandNamesWithInfo = brandInfos.map(info => info.brand_name);

            if (filters.hasBrandInfo) {
                query.brand = { $in: brandNamesWithInfo };
            } else {
                query.brand = { $nin: brandNamesWithInfo };
            }
        }
        
        // 필요한 필드만 프로젝션
        const cursor = collection.find(query, {
            projection: {
                _id: 1,
                NEW: 1,
                crawl_date: 1,
                brand: 1,
                item_category: 1,
                item: 1,
                author: 1,
                clean_name: 1,
                grade: 1,
                category: 1,
                item_feed_link: 1
            }
        })
        .sort([
            ['crawl_date', -1],  // 크롤링 날짜 기준 내림차순
            ['brand', 1],        // 브랜드명 기준 오름차순
            ['_id', 1]           // _id 기준 오름차순
        ])
        .skip(skip)
        .limit(limit);
            
        const data = await cursor.toArray();
        console.log('조회된 데이터 수:', data.length);
        
        const hasMore = data.length === limit;
        return { data, hasMore };
    });
}

async function getBrandPhoneData(brandName) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.vendorBrandInfo);
        return await collection.findOne({ brand_name: brandName });
    });
}

async function saveCallRecord(callData) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.callRecords);
        return await collection.insertOne(callData);
    });
}

async function getCallRecords(brandName) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.callRecords);
        return await collection.find({ brand_name: brandName })
            .sort({ call_date: -1 })
            .toArray();
    });
}

async function getLatestCallRecordByCardId(cardId) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.callRecords);
        
        const record = await collection.findOne(
            { card_id: cardId },
            { sort: { call_date: -1 } }
        );
            
        return record;
    });
}

async function updateBrandInfo(brandName, updateData) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.vendorBrandInfo);
        return await collection.updateOne(
            { brand_name: brandName },
            { $set: updateData }
        );
    });
}

async function updateCallRecord(recordId, updateData) {
    return withRetry(async () => {
        const client = await getMongoClient();
        const db = client.db(config.database.name);
        const collection = db.collection(config.database.collections.callRecords);
        return await collection.updateOne(
            { _id: new ObjectId(recordId) },
            { $set: updateData }
        );
    });
}

module.exports = {
    getMongoData,
    getVendorData,
    getBrandPhoneData,
    saveCallRecord,
    getCallRecords,
    getLatestCallRecordByCardId,
    updateBrandInfo,
    updateCallRecord
}; 