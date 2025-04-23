/**
 * home.js
 * @fileoverview 홈 탭 초기화
 */

import { commonUtils } from '../../utils/commonUtils.js';

// 홈 페이지 초기화
export function initPage() {
  console.log('홈 페이지 초기화');

  commonUtils.closeAllSubmenu();
}