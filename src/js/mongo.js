const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://coq3820:JmbIOcaEOrvkpQo1@cluster0.qj1ty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const ITEMS_PER_PAGE = 20;

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

        const db = client.db('insta09_database');
        const collection = db.collection('gogoya_vendor_brand_info');
        
        const data = await collection.find({}).toArray();
        await client.close();
        
        return data;
    } catch (error) {
        console.error('MongoDB 연결 오류:', error);
        throw error;
    }
}

async function getVendorData(skip = 0, limit = 20, filters = {}) {
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

        const db = client.db('insta09_database');
        const collection = db.collection('04_main_item_today_data');
        
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

        // 브랜드 정보 유무 필터
        if (filters.hasBrandInfo !== null) {
            // 먼저 브랜드 정보가 있는 브랜드들의 목록을 가져옴
            const brandInfoCollection = db.collection('gogoya_vendor_brand_info');
            const brandInfoCursor = await brandInfoCollection.find({}, { projection: { brand_name: 1 } });
            const brandInfos = await brandInfoCursor.toArray();
            const brandNamesWithInfo = brandInfos.map(info => info.brand_name);

            if (filters.hasBrandInfo) {
                // 브랜드 정보가 있는 경우
                query.brand = { $in: brandNamesWithInfo };
            } else {
                // 브랜드 정보가 없는 경우
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
        
        await client.close();
        return { data, hasMore };
    } catch (error) {
        console.error('벤더 데이터 조회 중 오류:', error);
        throw error;
    }
}

async function getBrandPhoneData(brandName) {
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

        const db = client.db('insta09_database');
        const collection = db.collection('gogoya_vendor_brand_info');
        const data = await collection.findOne({ brand_name: brandName });
        await client.close();
        return data;
    } catch (error) {
        console.error('브랜드 폰 데이터 조회 중 오류:', error);
        throw error;
    }
}

async function saveCallRecord(callData) {
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

        const db = client.db('insta09_database');
        const collection = db.collection('gogoya_vendor_CallRecords');
        
        const result = await collection.insertOne(callData);
        await client.close();
        return result;
    } catch (error) {
        console.error('통화 기록 저장 중 오류:', error);
        throw error;
    }
}

async function getCallRecords(brandName) {
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

        const db = client.db('insta09_database');
        const collection = db.collection('gogoya_vendor_CallRecords');
        
        // brand_name으로 통화 기록 조회 (최신순으로 정렬)
        const records = await collection.find({ brand_name: brandName })
            .sort({ call_date: -1 })
            .toArray();
            
        await client.close();
        return records;
    } catch (error) {
        console.error('통화 기록 조회 중 오류:', error);
        throw error;
    }
}

async function getLatestCallRecordByCardId(cardId) {
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

        const db = client.db('insta09_database');
        const collection = db.collection('gogoya_vendor_CallRecords');
        
        // card_id로 통화 기록 조회 (최신순으로 정렬하고 첫 번째만 가져옴)
        const record = await collection.findOne(
            { card_id: cardId },
            { sort: { call_date: -1 } }
        );
            
        await client.close();
        return record;
    } catch (error) {
        console.error('최근 통화 기록 조회 중 오류:', error);
        throw error;
    }
}

async function updateBrandInfo(brandName, updateData) {
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

        const db = client.db('insta09_database');
        const collection = db.collection('gogoya_vendor_brand_info');
        
        const result = await collection.updateOne(
            { brand_name: brandName },
            { $set: updateData }
        );
        
        await client.close();
        return result;
    } catch (error) {
        console.error('브랜드 정보 업데이트 중 오류:', error);
        throw error;
    }
}

module.exports = {
    getMongoData,
    getVendorData,
    getBrandPhoneData,
    saveCallRecord,
    getCallRecords,
    getLatestCallRecordByCardId,
    updateBrandInfo
}; 