#아이피 우회하기
import requests
from difflib import SequenceMatcher

def get_page_source(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        return response.text
    except requests.RequestException as e:
        print(f"에러 발생: {e}")
        return None

def calculate_similarity(text1, text2):
    return SequenceMatcher(None, text1, text2).ratio() * 100

def save_to_file(content, filename):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"파일이 성공적으로 저장되었습니다: {filename}")
    except IOError as e:
        print(f"파일 저장 중 에러 발생: {e}")

# 두 번째 URL (두 번째 비즈니스 링크 사용)
url = "https://business.inpock.co.kr/form?partner=jjuunnmom"
page_source = get_page_source(url)

if page_source:
    save_to_file(page_source, "business_page_source2.txt")
    
    # 첫 번째 파일 읽기
    try:
        with open("business_page_source.txt", 'r', encoding='utf-8') as f:
            first_source = f.read()
        
        # 유사도 계산
        similarity = calculate_similarity(first_source, page_source)
        print(f"두 페이지 소스의 유사도: {similarity:.2f}%")
    except IOError as e:
        print(f"첫 번째 파일 읽기 중 에러 발생: {e}") 