import pymongo
import re
from urllib.parse import unquote
from pymongo.server_api import ServerApi
import pandas as pd

# MongoDB 연결
uri = "mongodb+srv://coq3820:JmbIOcaEOrvkpQo1@cluster0.qj1ty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = pymongo.MongoClient(uri, 
                           server_api=ServerApi('1'),
                           tlsAllowInvalidCertificates=True,
                           tlsAllowInvalidHostnames=True,
                           connectTimeoutMS=60000,
                           socketTimeoutMS=60000,
                           serverSelectionTimeoutMS=60000)

def extract_inpock_link(decoded_url):
    # inpock 링크 패턴 매칭 (link.inpock.co.kr과 link.inpock.com 포함)
    pattern = r'https?://link\.inpock\.(?:co\.kr|com)/[^?\s]+'
    match = re.search(pattern, decoded_url)
    if match:
        return match.group(0)
    return None

def get_business_link(inpock_link):
    # link.inpock.co.kr/username 또는 link.inpock.com/username 형식에서 username 추출
    username = inpock_link.split('/')[-1]
    # com 도메인을 co.kr로 변환
    if 'link.inpock.com' in inpock_link:
        inpock_link = inpock_link.replace('link.inpock.com', 'link.inpock.co.kr')
    return f"https://business.inpock.co.kr/form?partner={username}"

def update_document(collection, doc_id, business_link):
    # 기존 문서 확인
    doc = collection.find_one({'_id': doc_id})
    
    if doc:
        # 기존 키 확인
        if 'contact_method' in doc:
            # contact_method가 inpk인 경우는 건너뛰기
            if doc['contact_method'] == 'inpk':
                print("이미 inpk contact_method가 존재합니다.")
                return False
            # contact_method가 다른 값인 경우에만 _02로 추가
            elif 'contact_method_02' not in doc:  # _02가 없는 경우에만 추가
                update_data = {
                    'contact_method_02': 'inpk',
                    'contact_info_02': business_link
                }
                collection.update_one({'_id': doc_id}, {'$set': update_data})
                return True
            else:
                print("이미 contact_method_02가 존재합니다.")
                return False
        else:
            # contact_method가 없으면 새로 추가
            update_data = {
                'contact_method': 'inpk',
                'contact_info': business_link
            }
            collection.update_one({'_id': doc_id}, {'$set': update_data})
            return True
    return False

try:
    # 연결 테스트
    client.admin.command('ping')
    print("MongoDB 연결 성공!")
    
    # 데이터베이스와 컬렉션 선택
    db = client['insta09_database']
    collection = db['02_main_influencer_data']
    
    # 결과를 저장할 리스트
    success_data = []
    
    # 실패한 링크만 저장할 파일 열기
    with open('failed_links.txt', 'w', encoding='utf-8') as f_failed:
        
        # 모든 문서 조회
        documents = collection.find({})
        
        # 각 문서에서 out_link 필드 확인
        for doc in documents:
            if 'out_link' in doc and doc['out_link'] != '링크 없음':
                # URL 디코딩
                decoded_url = unquote(doc['out_link'])
                
                # 'inpock'이 포함된 링크 찾기
                if 'inpock' in decoded_url.lower():
                    inpock_link = extract_inpock_link(decoded_url)
                    
                    if inpock_link:
                        # 성공적으로 추출된 링크 출력
                        print(f"\n인플루언서 ID: {doc['_id']}")
                        print(f"추출된 링크: {inpock_link}")
                        business_link = get_business_link(inpock_link)
                        print(f"비즈니스 링크: {business_link}")
                        
                        # 문서 업데이트
                        if update_document(collection, doc['_id'], business_link):
                            print("문서 업데이트 성공")
                        else:
                            print("문서 업데이트 실패")
                        
                        print("-" * 50)
                        
                        # 성공 데이터 저장
                        success_data.append({
                            '인플루언서 ID': str(doc['_id']),
                            '추출된 링크': inpock_link,
                            '비즈니스 링크': business_link
                        })
                    else:
                        # 추출 실패한 링크 저장
                        f_failed.write(f"인플루언서 ID: {doc['_id']}\n")
                        f_failed.write(f"원본 링크: {doc['out_link']}\n")
                        f_failed.write(f"디코딩된 링크: {decoded_url}\n")
                        f_failed.write("-" * 50 + "\n")
    
    # 성공 데이터를 엑셀로 저장
    if success_data:
        df = pd.DataFrame(success_data)
        df.to_excel('inpock_links.xlsx', index=False)
        print("\n엑셀 파일 저장 완료: inpock_links.xlsx")

except Exception as e:
    print(f"에러 발생: {e}")
finally:
    client.close()
