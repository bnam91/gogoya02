/**
 * commonUtils.js
 * @fileoverview 공통 유틸리티 함수 객체 모듈
 */

const commonUtils = {
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
  
            // 모든 서브메뉴 닫기
            document.querySelectorAll('.submenu').forEach(menu => {
              menu.classList.remove('expanded');
              const icon = menu.parentElement.querySelector('.toggle-icon');
              if (icon) icon.classList.remove('active');
            });
  
            // 선택된 메뉴만 확장
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
    initPage: () => {
      document.querySelectorAll('[data-page]').forEach(item => {
        item.addEventListener('click', function () {
          const page = this.dataset.page;
          if (page === 'home') {
            commonUtils.showContent('home');
          } else if (page === 'vendor/brandcontact') {
            commonUtils.showContent('vendor');
          }
        });
      });
    },
  
    /**
     * 콘텐츠 전환 로직
     * @param {string} content - 보여줄 콘텐츠 키
     */
    showContent: (content) => {
      // 모든 콘텐츠 비활성화
      document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
      });
  
      // 선택된 콘텐츠 활성화
      const target = document.getElementById(`${content}-content`);
      if (target) target.classList.add('active');
  
      // 벤더 콘텐츠일 경우 추가 초기화
      if (content === 'vendor' && window.vendor?.initVendor) {
        window.vendor.initVendor();
      }
    }
  };
  
  // 전역 등록
  window.commonUtils = commonUtils;
  