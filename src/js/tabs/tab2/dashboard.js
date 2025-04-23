/**
 * dashborad.js
 * @fileoverview 대시보드 탭 초기화
 */

// 필요한 클래스 import
import { Dashboard } from '../../classes/tab2/index.js';

// 인스턴스 생성
const dashboard = new Dashboard();

export function initPage() {
    console.log('initPage Dashboard');

    // 필터 초기화
    if (dashboard && typeof dashboard.init === 'function') {
        dashboard.init();
    } else {
        console.error('dashboard가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}
