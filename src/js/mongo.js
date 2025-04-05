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
        const collection = db.collection('99_test_brand_phone_data');
        
        const data = await collection.find({}).toArray();
        await client.close();
        
        return data;
    } catch (error) {
        console.error('MongoDB 연결 오류:', error);
        throw error;
    }
}

async function getVendorData(skip = 0) {
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
        const collection = db.collection('04_test_item_today_data');
        
        // 전체 문서 수 가져오기
        const totalCount = await collection.countDocuments();
        
        // 페이지 단위로 데이터 가져오기
        const data = await collection.find({})
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .toArray();
            
        await client.close();
        
        return {
            data,
            totalCount,
            hasMore: skip + ITEMS_PER_PAGE < totalCount
        };
    } catch (error) {
        console.error('MongoDB 연결 오류:', error);
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
        const collection = db.collection('99_test_brand_phone_data');
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

module.exports = {
    getMongoData,
    getVendorData,
    getBrandPhoneData,
    saveCallRecord,
    getCallRecords
}; 