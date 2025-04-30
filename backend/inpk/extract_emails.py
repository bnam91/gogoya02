from pymongo import MongoClient
from pymongo.server_api import ServerApi
import re

# MongoDB 연결 설정
uri = "mongodb+srv://coq3820:JmbIOcaEOrvkpQo1@cluster0.qj1ty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))

try:
    # 연결 확인
    client.admin.command('ping')
    print("MongoDB 연결 성공!")
    
    # 데이터베이스와 컬렉션 선택
    db = client['insta09_database']
    collection = db['02_main_influencer_data']
    
    # 이메일 주소를 찾기 위한 정규표현식 패턴
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    
    # 모든 문서 조회
    documents = collection.find({})
    
    # 각 문서의 bio 필드에서 이메일 주소 추출 및 업데이트
    for doc in documents:
        if 'bio' in doc and doc['bio']:
            bio_text = doc['bio']
            emails = re.findall(email_pattern, bio_text)
            
            if emails:
                # 첫 번째 이메일 주소만 사용
                email = emails[0]
                
                # 문서 업데이트
                update_result = collection.update_one(
                    {'_id': doc['_id']},
                    {
                        '$set': {
                            'contact_method': 'email',
                            'contact_info': email
                        }
                    }
                )
                
                print(f"\n인플루언서 ID: {doc.get('_id')}")
                print(f"Bio: {bio_text}")
                print(f"업데이트된 이메일 주소: {email}")
                print(f"업데이트 결과: {update_result.modified_count} 문서 수정됨")
                print("-" * 50)

except Exception as e:
    print(f"에러 발생: {e}")
finally:
    client.close() 