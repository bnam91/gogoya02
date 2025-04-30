from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

def setup_driver():
    print("브라우저 설정을 시작합니다...")
    options = Options()
    options.add_experimental_option("detach", True)
    options.add_argument('--start-maximized')
    driver = webdriver.Chrome(options=options)
    print("브라우저가 성공적으로 실행되었습니다.")
    return driver

def fill_form(driver):
    print("\n=== 폼 작성 시작 ===")
    
    # 페이지 로드
    print("페이지 로딩 중...")
    driver.get('https://business.inpock.co.kr/form?partner=daeguunniya')
    time.sleep(0.3)
    print("페이지 로딩 완료")

    # 회사명 입력
    print("\n회사명 입력 중...")
    company_name = driver.find_element(By.NAME, 'brand_name')
    company_name.send_keys('테스트 회사')
    time.sleep(0.3)  # 입력 후 대기
    print("회사명 입력 완료")

    # 브랜드/제품 카테고리 선택
    print("\n카테고리 선택 중...")
    category_buttons = driver.find_elements(By.CLASS_NAME, 'toggle-button')
    for button in category_buttons:
        if '식품・요리' in button.text:
            button.click()
            time.sleep(0.3)  # 선택 후 대기
            break
    print("카테고리 선택 완료")

    # 제안 종류 선택
    print("\n제안 종류 선택 중...")
    offer_type_radios = driver.find_elements(By.CLASS_NAME, 'radio-button')[2:5]
    offer_type_radios[0].click()
    time.sleep(0.3)  # 선택 후 대기
    print("제안 종류 선택 완료")

    # 제품명 입력
    print("\n제품명 입력 중...")
    product_name = driver.find_element(By.NAME, 'product_name')
    product_name.send_keys('테스트 제품')
    time.sleep(0.3)  # 입력 후 대기
    print("제품명 입력 완료")

    # 제품 소개 링크 입력
    print("\n제품 소개 링크 입력 중...")
    product_url = driver.find_element(By.NAME, 'product_url')
    product_url.send_keys('https://example.com/product')
    time.sleep(0.3)  # 입력 후 대기
    print("제품 소개 링크 입력 완료")

    # 판매가 입력
    print("\n판매가 입력 중...")
    original_price = driver.find_element(By.NAME, 'original_price')
    original_price.send_keys('100000')
    time.sleep(0.3)  # 입력 후 대기
    print("판매가 입력 완료")

    # 공동구매 진행가 입력
    print("\n공동구매 진행가 입력 중...")
    price = driver.find_element(By.NAME, 'price')
    price.send_keys('80000')
    time.sleep(0.3)  # 입력 후 대기
    print("공동구매 진행가 입력 완료")

    # 판매 수수료 입력
    print("\n판매 수수료 입력 중...")
    commission = driver.find_element(By.NAME, 'comission_percentage')
    commission.send_keys('10')
    time.sleep(0.3)  # 입력 후 대기
    print("판매 수수료 입력 완료")

    # 추가 설명 입력
    print("\n추가 설명 입력 중...")
    offer_detail = driver.find_element(By.NAME, 'offer_detail')
    offer_detail.send_keys('''
1. 테스트 제안 요약
2. 테스트 제안 이유
3. 테스트 캠페인 개요
4. 테스트 캠페인 세부 설명
5. 테스트 베니핏
    ''')
    time.sleep(0.3)  # 입력 후 대기
    print("추가 설명 입력 완료")

    # 제품 협찬 여부 선택
    print("\n제품 협찬 여부 선택 중...")
    sponsor_radios = driver.find_elements(By.CLASS_NAME, 'radio-button')[-2:]
    sponsor_radios[0].click()
    time.sleep(0.3)  # 선택 후 대기
    print("제품 협찬 여부 선택 완료")

    # 발송완료 버튼이 활성화될 때까지 대기
    print("\n발송완료 버튼 활성화 대기 중...")
    while True:
        submit_button = driver.find_element(By.CSS_SELECTOR, 'button.inpock-button.size-large.type-primary.full-width')
        if not submit_button.get_attribute('disabled'):
            break
        time.sleep(0.3)
    
    # 발송완료 버튼 클릭
    print("발송완료 버튼 클릭 중...")
    submit_button.click()
    print("발송완료 버튼 클릭 완료")

    # 모달창이 뜨기까지 대기
    time.sleep(0.3)
    
    # 로그인 버튼 클릭
    print("\n로그인 버튼 클릭 중...")
    login_button = driver.find_element(By.CSS_SELECTOR, 'button.gtm-dialog-confirm-btn.inpock-button.size-medium.type-primary')
    login_button.click()
    print("로그인 버튼 클릭 완료")

    # 3초 대기
    time.sleep(0.3)
    
    # 아이디 입력
    print("\n아이디 입력 중...")
    id_input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]')
    id_input.send_keys('test@example.com')
    time.sleep(0.3)
    print("아이디 입력 완료")

    # 비밀번호 입력
    print("\n비밀번호 입력 중...")
    password_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
    password_input.send_keys('test1234')
    time.sleep(0.3)
    print("비밀번호 입력 완료")

    # 로그인 버튼이 활성화될 때까지 대기
    print("\n로그인 버튼 활성화 대기 중...")
    while True:
        login_submit_button = driver.find_element(By.CSS_SELECTOR, 'button.inpock-button.size-large.type-primary.full-width')
        if not login_submit_button.get_attribute('disabled'):
            break
        time.sleep(0.3)

    # 로그인 버튼 클릭
    print("로그인 버튼 클릭 중...")
    login_submit_button.click()
    print("로그인 버튼 클릭 완료")

    print("\n=== 모든 입력이 완료되었습니다 ===")
    time.sleep(0.3)

def main():
    driver = setup_driver()
    try:
        fill_form(driver)
    finally:
        print("\n프로그램을 종료하려면 아무 키나 누르세요...")
        input()
        driver.quit()
        print("프로그램이 종료되었습니다.")

if __name__ == "__main__":
    main()
