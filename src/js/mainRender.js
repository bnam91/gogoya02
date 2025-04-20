import { commonUtils } from './utils/commonUtils.js';
import { renderMenu } from './utils/renderMenu.js';
import { renderPage } from './utils/renderPage.js';

/**
 * main.js
 * @fileoverview 앱 메인 엔트리 포인트, 렌더링 메뉴 및 페이지 렌더링
 */
window.onload = () => {
    renderMenu();
    commonUtils.menuToggle();
    commonUtils.initPage(renderPage); // 클릭 이벤트에 renderPage 연결

    renderPage('tab1/home');   // 앱 처음 켰을 때 'home' 렌더링
};