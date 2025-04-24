/**
 * seller-analysis.js
 * @fileoverview 셀러분석 탭 초기화
 */

// 필요한 클래스 import
import { ScreeningManager } from '../../classes/tab2/screening.js';

// 인스턴스 생성
if (!window.screeningManager) {
    window.screeningManager = new ScreeningManager();
}
//const sellerAnalysisFilter = new SellerAnalysisFilter();

export function initPage() {
    console.log('initPage SellerAnalysis');

    // 매니저 초기화
    if (window.screeningManager && typeof window.screeningManager.init === 'function') {
        window.screeningManager.init();
    } else {
        console.error('screeningManager가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}