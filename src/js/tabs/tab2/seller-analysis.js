/**
 * seller-analysis.js
 * @fileoverview 셀러분석 탭 초기화
 */

// 필요한 클래스 import
import { SellerAnalysisManager, SellerAnalysisFilter } from '../../classes/tab2/index.js';

// 인스턴스 생성
const sellerAnalysisManager = new SellerAnalysisManager();
//const sellerAnalysisFilter = new SellerAnalysisFilter();

export function initPage() {
    console.log('initPage SellerAnalysis');

    // 매니저 초기화
    if (sellerAnalysisManager && typeof sellerAnalysisManager.init === 'function') {
        sellerAnalysisManager.init();
    } else {
        console.error('sellerAnalysisManager가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}