/**
 * 메뉴 구성 데이터
 * 각 탭과 하위 서브메뉴 정보를 배열로 관리한다.
 * 추후 메뉴 추가/삭제가 필요할 경우 이 파일만 수정 하기.
 */
export const menuData = [
    {
      title: "홈",          // 탭 이름
      page: "home",          // 연결될 페이지 경로
      tabClass: "tab1",      // 탭 CSS 클래스명
      page:"tab1/home",
      children: []           // 하위 메뉴 없음
    },
    {
      title: "벤더",
      tabClass: "tab2",
      children: [
        { title: "대시보드", page: "tab2/dashboard" },
        { title: "스크리닝", page: "tab2/screening" },
        { title: "브랜드 컨택", page: "tab2/brand-contact" },
        { title: "제안서 관리", page: "tab2/proposal-manage" },
        { title: "공급가 관리", page: "tab2/supply-prices-manage" },
        { title: "셀러매칭", page: "tab2/seller-match" },
        { title: "캠페인 관리", page: "tab2/campaign-manage" },
        { title: "셀러분석", page: "tab2/seller-analysis" }
      ]
    },
    {
      title: "관리자",
      tabClass: "tab3",
      children: [
        { title: "사용자 관리", page: "tab3/user-manage" },
        { title: "시스템 설정", page: "tab3/system-setting" }
      ]
    }
  ];