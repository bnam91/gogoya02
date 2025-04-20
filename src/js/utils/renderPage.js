/**
 * renderPage.js
 * @fileoverview 페이지 fetch 및 동적 모듈 로딩 유틸리티
 */
export async function renderPage(pagePath) {
  const content = document.getElementById('content');
  console.log('pagePath:', pagePath);

  try {
    const [folder, file] = pagePath.split('/');
    // 1. HTML 페이지 fetch
    const response = await fetch(`./src/pages/tabs/${folder}/${file}.html`);
    if (!response.ok) {
      throw new Error('❌ 페이지 로딩 실패');
    }
    const html = await response.text();
    content.innerHTML = html;

    // 새로 추가된 content-section에 active 추가
    const newSection = content.querySelector('.content-section');
    if (newSection) {
      newSection.classList.add('active');
    }

    // 페이지별 추가 로드
    await additionalPageLoad(pagePath, content);

    // 2. JS 모듈 동적 import
    try {
      const module = await import(`../tabs/${folder}/${file}.js`);
      if (module?.initPage) {
        module.initPage();
      }
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

// 페이지별 추가 로드
export async function additionalPageLoad(pagePath, content) {
  // 벤더페이지일경우 페이지 로드 후 모달 추가
  if (pagePath === 'tab2/vendor') {
    try {
      const modalResponse = await fetch('./src/pages/components/call-modal.html');
      if (modalResponse.ok) {
        const modalHtml = await modalResponse.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        content.appendChild(tempDiv);
        console.log('✅ call-modal.html 추가 완료');
      }
    } catch (e) {
      console.error('call-modal 불러오기 실패:', e);
    }
  }
}