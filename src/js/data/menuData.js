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
        { title: "브랜드 컨택", page: "tab2/vendor" }
      ]
    },
    {
      title: "test",
      tabClass: "tab3",
      children: [
        { title: "대시보드", page: "tab3/dashboard" },
        { title: "브랜드 현황", page: "tab3/brandstatus" },
        { title: "테스트", page: "tab3/test" }
      ]
    },
    {
        title: "인증",
        tabClass: "tab4",
        children: [
          { title: "대시보드", page: "tab4/dashboard" },
          { title: "인증", page: "tab4/auth" },
          { title: "정책", page: "tab4/policy" }
        ]
      }
  ];