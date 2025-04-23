/**
 * seller-analysis.js
 * @fileoverview 셀러분석 탭 초기화
 */

// 필요한 클래스 import
import { ScreeningManager } from '../../classes/tab2/screening.js';

// 인스턴스 생성
const screeningManager = new ScreeningManager();
//const sellerAnalysisFilter = new SellerAnalysisFilter();

export function initPage() {
    console.log('initPage SellerAnalysis');

    // 매니저 초기화
    if (screeningManager && typeof screeningManager.init === 'function') {
        screeningManager.init();
    } else {
        console.error('screeningManager가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}