/**
 * seller-match.js
 * @fileoverview 셀러매칭 탭 초기화
 */

// 필요한 클래스 import
import { SellerMatchManager } from '../../classes/tab2/sellerMatch.js';

// 인스턴스 생성
const sellerMatch = new SellerMatchManager();

export function initPage() {
    console.log('initPage SellerMatchManager');

    // 필터 초기화
    if (sellerMatch && typeof sellerMatch.init === 'function') {
        sellerMatch.init();
    } else {
        console.error('sellerMatch가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}
