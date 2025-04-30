import requests

def get_page_source(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # HTTP 오류 체크
        return response.text
    except requests.RequestException as e:
        print(f"에러 발생: {e}")
        return None

def save_to_file(content, filename):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"파일이 성공적으로 저장되었습니다: {filename}")
    except IOError as e:
        print(f"파일 저장 중 에러 발생: {e}")

# 테스트 URL (첫 번째 비즈니스 링크 사용)
url = "https://business.inpock.co.kr/form?partner=daeguunniya"
page_source = get_page_source(url)

if page_source:
    save_to_file(page_source, "business_page_source.txt") 