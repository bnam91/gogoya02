from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pandas as pd
import random
import pyperclip

def setup_driver():
    print("브라우저 설정을 시작합니다...")
    options = Options()
    options.add_experimental_option("detach", True)
    options.add_argument('--start-maximized')
    driver = webdriver.Chrome(options=options)
    print("브라우저가 성공적으로 실행되었습니다.")
    return driver

def fill_form(driver, contact_link, name):
    print("\n=== 폼 작성 시작 ===")
    
    # 페이지 로드
    print("페이지 로딩 중...")
    driver.get(contact_link)
    time.sleep(3)  # 페이지 로딩 대기 시간 증가
    print("페이지 로딩 완료")

    # 회사명 입력
    print("\n회사명 입력 중...")
    try:
        # 요소가 클릭 가능할 때까지 대기
        company_name = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.NAME, 'brand_name'))
        )
        
        # disabled 속성 확인
        if company_name.get_attribute('disabled'):
            print("회사명이 이미 입력되어 있어 건너뜁니다.")
        else:
            # JavaScript를 사용하여 요소에 포커스
            driver.execute_script("arguments[0].scrollIntoView(true);", company_name)
            time.sleep(1)
            company_name.clear()  # 기존 입력값이 있다면 제거
            company_name.send_keys('노르딕슬립')
            time.sleep(1)
            print("회사명 입력 완료")
    except Exception as e:
        print(f"회사명 입력 중 오류 발생: {str(e)}")
        print("페이지를 새로고침하고 다시 시도합니다...")
        driver.refresh()
        time.sleep(3)
        try:
            company_name = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.NAME, 'brand_name'))
            )
            
            # disabled 속성 확인
            if company_name.get_attribute('disabled'):
                print("회사명이 이미 입력되어 있어 건너뜁니다.")
            else:
                driver.execute_script("arguments[0].scrollIntoView(true);", company_name)
                time.sleep(1)
                company_name.clear()
                company_name.send_keys('노르딕슬립')
                time.sleep(1)
                print("회사명 입력 완료")
        except Exception as e:
            print(f"재시도 후에도 오류 발생: {str(e)}")
            return

    # 브랜드/제품 카테고리 선택
    print("\n카테고리 선택 중...")
    category_buttons = driver.find_elements(By.CLASS_NAME, 'toggle-button')
    for button in category_buttons:
        if '홈・리빙' in button.text:
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
    product_name.send_keys('노르딕슬립')
    time.sleep(0.3)  # 입력 후 대기
    print("제품명 입력 완료")

    # 제품 소개 링크 입력
    print("\n제품 소개 링크 입력 중...")
    product_url = driver.find_element(By.NAME, 'product_url')
    product_url.send_keys('https://nordicsleep.co.kr/surl/P/272')
    time.sleep(0.3)  # 입력 후 대기
    print("제품 소개 링크 입력 완료")

    # 판매가 입력
    print("\n판매가 입력 중...")
    original_price = driver.find_element(By.NAME, 'original_price')
    original_price.send_keys('159000')
    time.sleep(0.3)  # 입력 후 대기
    print("판매가 입력 완료")

    # 공동구매 진행가 입력
    print("\n공동구매 진행가 입력 중...")
    price = driver.find_element(By.NAME, 'price')
    price.send_keys('99900')
    time.sleep(0.3)  # 입력 후 대기
    print("공동구매 진행가 입력 완료")

    # 판매 수수료 입력
    print("\n판매 수수료 입력 중...")
    commission = driver.find_element(By.NAME, 'comission_percentage')
    commission.send_keys('20')
    time.sleep(0.3)  # 입력 후 대기
    print("판매 수수료 입력 완료")

    # 추가 설명 입력
    print("\n추가 설명 입력 중...")
    offer_detail = driver.find_element(By.NAME, 'offer_detail')
    
    # 클립보드에 텍스트 복사
    text = f'''안녕하세요 :) {name}님 🤍
프리미엄  벤더사 고야앤드미디어입니다.

{name}님께 덴마크 감성 프리미엄 침구브랜드 노르딕슬립 공구 제안드리고자 이렇게 연락드렸어요-! 💌

무신사∙SSG∙현대백화점 등에서 인기 있는 브랜드로,
배우 이진욱님이 릴리즈한 썸머라인이 새롭게 출시되었습니다.

특히 이번 썸머라인은 자체 개발한 냉감 기능성 원단 **콜드스토프** 를 사용해 피부에 닿는 순간 시원한 촉감이 느껴지는 프리미엄 여름이불이에요 ❄️
(디자인은 미니멀하고 고급스러워, 여름 시즌 베스트셀러로 기대되는 제품입니다 🌿)

긍정적 검토 부탁드립니다. 감사합니다.😊

고야앤드미디어 박슬하

010-2130-0380'''
    
    pyperclip.copy(text)
    time.sleep(0.3)
    
    # Ctrl+V로 붙여넣기
    offer_detail.send_keys(Keys.CONTROL + 'v')
    time.sleep(0.3)
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
    
    # 사용자 확인 후 발송완료 버튼 클릭
    # while True:
    #     user_input = input("발송완료 버튼을 누를까요? (Y/N): ").strip().upper()
    #     if user_input == 'Y':
    #         print("발송완료 버튼 클릭 중...")
    #         submit_button.click()
    #         print("발송완료 버튼 클릭 완료")
    #         break
    #     elif user_input == 'N':
    #         print("발송을 취소합니다...")
    #         return
    #     else:
    #         print("Y 또는 N을 입력해주세요.")
    
    print("발송완료 버튼 클릭 중...")
    submit_button.click()
    print("발송완료 버튼 클릭 완료")

    # 모달창이 뜨기까지 대기
    print("\n모달창 로딩 대기 중...")
    time.sleep(2)

    try:
        # 제안 발송 완료 메시지 확인
        success_message = driver.find_element(By.CLASS_NAME, 'dialog-form-submit-success')
        if success_message:
            print("제안 발송이 완료되었습니다. 모달창을 닫습니다...")
            close_button = driver.find_element(By.CSS_SELECTOR, 'button.gtm-dialog-close-btn.inpock-button.size-medium.type-default')
            close_button.click()
            print("모달창 닫기 완료")
            return
    except:
        print("로그인이 필요한 모달창이 나타났습니다.")

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
    id_input.send_keys('goyanmedia')
    time.sleep(0.3)
    print("아이디 입력 완료")

    # 비밀번호 입력
    print("\n비밀번호 입력 중...")
    password_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
    password_input.send_keys('@rhdi120')
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

    # 2초 대기 후 페이지 끝까지 스크롤
    print("\n페이지 스크롤 중...")
    time.sleep(2)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)  # 스크롤 완료 대기
    print("페이지 스크롤 완료")

    # 발송완료 버튼 다시 클릭
    print("\n발송완료 버튼 재클릭 대기 중...")
    submit_button = driver.find_element(By.CSS_SELECTOR, 'button.inpock-button.size-large.type-primary.full-width')
    submit_button.click()
    print("발송완료 버튼 재클릭 완료")

    # 모달창이 뜨기까지 대기
    print("\n모달창 로딩 대기 중...")
    time.sleep(5)

    # 모달창의 닫기 버튼 클릭
    print("\n모달창 닫기 버튼 클릭 중...")
    close_button = driver.find_element(By.CSS_SELECTOR, 'button.gtm-dialog-close-btn.inpock-button.size-medium.type-default')
    close_button.click()
    print("모달창 닫기 완료")

    print("\n=== 모든 입력이 완료되었습니다 ===")
    time.sleep(0.3)

def main():
    # 엑셀 파일 읽기
    print("엑셀 파일을 읽는 중...")
    df = pd.read_excel(r'C:\Users\USER\Desktop\github\gogoya02\backend\inpk\inpock_links_updated.xlsx')
    
    # contact_info 열에 값이 있는 행만 필터링
    valid_rows = df[df['contact_info'].notna()]
    
    if valid_rows.empty:
        print("처리할 수 있는 데이터가 없습니다.")
        return
    
    # contact_info와 clean_name 열의 데이터 가져오기
    contact_links = valid_rows['contact_info'].tolist()
    clean_names = valid_rows['clean_name'].tolist()
    
    print("\n처리할 데이터 목록:")
    for i, (link, name) in enumerate(zip(contact_links, clean_names), 1):
        print(f"{i}. {name} - {link}")
    
    driver = setup_driver()
    try:
        for link, name in zip(contact_links, clean_names):
            print(f"\n링크 처리 중: {link}")
            print(f"이름: {name}")
            fill_form(driver, link, name)
            print(f"링크 처리 완료: {link}")
            wait_time = random.uniform(1, 10)
            print(f"다음 링크 처리까지 {wait_time:.1f}초 대기 중...")
            time.sleep(wait_time)  # 1~10초 사이의 랜덤한 대기 시간
            
            # while True:
            #     user_input = input("다음 링크로 넘어갈까요? (Y/N): ").strip().upper()
            #     if user_input == 'Y':
            #         break
            #     elif user_input == 'N':
            #         print("프로그램을 종료합니다...")
            #         return
            #     else:
            #         print("Y 또는 N을 입력해주세요.")
    finally:
        print("\n프로그램을 종료하려면 아무 키나 누르세요...")
        input()
        driver.quit()
        print("프로그램이 종료되었습니다.")

if __name__ == "__main__":
    main()
