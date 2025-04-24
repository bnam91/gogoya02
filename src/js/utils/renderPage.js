/**
 * renderPage.js
 * @fileoverview 페이지 fetch 및 동적 모듈 로딩 유틸리티
 */
import { menuData } from '../data/menuData.js';

export async function renderPage(pagePath) {
  const content = document.getElementById('content');
  console.log('pagePath:', pagePath);

  const contentId = pagePath.split('/').pop() + '-content';

  // 모든 콘텐츠 숨김
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });

  const existingSection = document.getElementById(contentId);

  if (existingSection) {
    existingSection.style.display = 'block';
    updateBreadcrumbFromMenu(pagePath); // ✅ 숨겨진 페이지 다시 보여줄 때도 브레드크럼 갱신
    return;
  }

  try {
    const [folder, file] = pagePath.split('/');
    const response = await fetch(`./src/pages/tabs/${folder}/${file}.html`);
    if (!response.ok) throw new Error('❌ 페이지 로딩 실패');

    const html = await response.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const newSection = tempDiv.querySelector('.content-section');
    if (newSection) {
      newSection.style.display = 'block';
      content.appendChild(newSection);
      newSection.classList.add('active');
    }

    await additionalPageLoad(pagePath, newSection || content);
    // 렌더 타이밍 보장 후 브레드크럼 업데이트
    requestAnimationFrame(() => {
      updateBreadcrumbFromMenu(pagePath);
    });

    try {
      const module = await import(`../tabs/${folder}/${file}.js`);
      if (module?.initPage) module.initPage();
    } catch (err) {
      console.warn(`⚠️ JS 모듈 없음 또는 로딩 실패 (무시 가능): ${err.message}`);
    }

  } catch (error) {
    console.error('❌ 페이지 렌더링 실패:', error.message);
    content.innerHTML = `
      <div class="error-page">
        <h2>페이지를 불러올 수 없습니다.</h2>
        <p>관리자에게 문의하세요.</p>
      </div>
    `;
  }
}


export function updateBreadcrumbFromMenu(pagePath) {
  console.log('updateBreadcrumbFromMenu', pagePath);
  const contentId = pagePath.split('/').pop() + '-content';
  const activeSection = document.getElementById(contentId);

  if (!activeSection) return;

  const mainElement = activeSection.querySelector('#breadcrumb-main');
  const currentElement = activeSection.querySelector('#breadcrumb-current');

  let mainTitle = '';
  let currentTitle = '';

  for (const menu of menuData) {
    if (menu.page && pagePath === menu.page) {
      mainTitle = menu.title;
      break;
    }

    if (menu.children) {
      const foundChild = menu.children.find(child => child.page === pagePath);
      if (foundChild) {
        mainTitle = menu.title;
        currentTitle = foundChild.title;
        break;
      }
    }
  }

  if (mainElement) mainElement.textContent = mainTitle || '홈';
  if (currentElement) currentElement.textContent = currentTitle || '';
}

// 브랜드 컨택 페이지일 경우 페이지 로드 후 모달 추가
export async function additionalPageLoad(pagePath, content) {
  if (pagePath === 'tab2/brand-contact') {
    // 중복 추가 방지 (이미 있는 경우 생략)
    if (content.querySelector('#call-confirm-modal')) {
      console.log('⚠️ call-modal 이미 추가됨');
      return;
    }

    try {
      const modalResponse = await fetch('./src/pages/components/call-modal.html');
      if (modalResponse.ok) {
        const modalHtml = await modalResponse.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;

        // 모달은 해당 콘텐츠 영역에만 추가
        content.appendChild(tempDiv);
        console.log('✅ call-modal.html 추가 완료');
      } else {
        throw new Error(`상태 코드 ${modalResponse.status}`);
      }
    } catch (e) {
      console.error('❌ call-modal 불러오기 실패:', e.message);
    }
  }
}
