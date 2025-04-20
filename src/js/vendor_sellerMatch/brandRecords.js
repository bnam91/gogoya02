class BrandRecordsManager {
    constructor() {
        this.records = [];
    }

    async getBrandRecords(username) {
        try {
            const client = await window.mongo.getMongoClient();
            const db = client.db('insta09_database');
            const collection = db.collection('02_main_influencer_data');
            
            console.log('브랜드 기록 조회 - username:', username);
            const influencer = await collection.findOne({ username: username });
            
            if (!influencer) {
                console.log('인플루언서를 찾을 수 없습니다:', username);
                return [];
            }
            
            if (!influencer.brand) {
                console.log('브랜드 기록이 없습니다:', username);
                return [];
            }

            // mentioned_date 기준으로 정렬
            const sortedBrands = influencer.brand
                .filter(brand => brand.products && brand.products.length > 0)
                .map(brand => ({
                    name: brand.name,
                    products: brand.products.map(product => ({
                        item: product.item,
                        category: product.category,
                        category2: product.category2,
                        mentioned_date: product.mentioned_date,
                        item_feed_link: product.item_feed_link
                    }))
                }))
                .sort((a, b) => {
                    const dateA = new Date(a.products[0].mentioned_date);
                    const dateB = new Date(b.products[0].mentioned_date);
                    return dateB - dateA;
                });

            console.log('브랜드 기록 조회 완료:', sortedBrands.length, '개');
            return sortedBrands;
        } catch (error) {
            console.error('브랜드 기록 조회 중 오류 발생:', error);
            return [];
        }
    }

    renderBrandRecords(records) {
        if (!records || records.length === 0) {
            return '<div class="no-records">브랜드 기록이 없습니다.</div>';
        }

        // 모든 브랜드의 제품을 하나의 배열로 합치고 mentioned_date 기준으로 정렬
        const allProducts = records
            .flatMap(brand => brand.products.map(product => ({
                ...product,
                brandName: brand.name
            })))
            .sort((a, b) => new Date(b.mentioned_date) - new Date(a.mentioned_date));

        return allProducts.map(product => `
            <div class="product-item">
                <div class="product-brand">${product.brandName}</div>
                <div class="product-title">${product.item}</div>
                <div class="product-category">${product.category} ${product.category2}</div>
                <div class="product-date-link-container">
                    <span class="product-date">${new Date(product.mentioned_date).toLocaleString()}</span>
                    <a href="${product.item_feed_link}" target="_blank" class="product-link">게시물 보기</a>
                </div>
            </div>
        `).join('');
    }
}

// 전역 인스턴스 생성
window.brandRecordsManager = new BrandRecordsManager(); 