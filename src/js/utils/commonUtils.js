/**
 * commonUtils.js
 * @fileoverview 공통 유틸리티 함수 모듈
 */

export const commonUtils = {
  /**
   * 메뉴 토글 기능
   */
  menuToggle: () => {
    document.querySelectorAll('.menu-header').forEach(header => {
      header.addEventListener('click', function () {
        const menuItem = this.parentElement;
        const submenu = menuItem.querySelector('.submenu');
        const toggleIcon = menuItem.querySelector('.toggle-icon');

        if (submenu) {
          const isExpanded = submenu.classList.contains('expanded');

          document.querySelectorAll('.submenu').forEach(menu => {
            menu.classList.remove('expanded');
            const icon = menu.parentElement.querySelector('.toggle-icon');
            if (icon) icon.classList.remove('active');
          });

          if (!isExpanded) {
            submenu.classList.add('expanded');
            if (toggleIcon) toggleIcon.classList.add('active');
          }
        }
      });
    });
  },

  /**
 * 페이지 전환 이벤트 바인딩
 */
  initPage: (renderPage) => {
    document.querySelectorAll('[data-page]').forEach(item => {
      item.addEventListener('click', function () {
        const page = this.dataset.page;
        if (page) {
          renderPage(page);
        }
      });
    });
  },

  /**
   * 모든 토글 닫기
   */
  closeAllSubmenu: () => {
    document.querySelectorAll('.submenu').forEach(menu => {
      menu.classList.remove('expanded');
      const icon = menu.parentElement.querySelector('.toggle-icon');
      if (icon) icon.classList.remove('active');
    });
  }
};