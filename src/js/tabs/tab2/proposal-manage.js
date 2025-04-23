/**
 * proposal-manage.js
 * @fileoverview 제안서 관리 탭 초기화
 */

// 필요한 클래스 import
import { ProposalManage } from '../../classes/tab2/proposalManage.js';

// 인스턴스 생성
const proposalManage = new ProposalManage();

export function initPage() {
    console.log('initPage ProposalManage');

    // 필터 초기화
    if (proposalManage && typeof proposalManage.init === 'function') {
        proposalManage.init();
    } else {
        console.error('proposalManage가 초기화되지 않았거나 init 메서드가 없습니다.');
    }
}
