import pandas as pd
from pymongo import MongoClient
from pymongo.server_api import ServerApi

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
    
    # Excel 파일 읽기
    df = pd.read_excel('inpk/inpock_links.xlsx')
    
    # 각 프로필 링크에 대해 MongoDB에서 데이터 찾기
    for index, row in df.iterrows():
        profile_link = row['profile_link']
        
        # MongoDB에서 해당 profile_link를 가진 문서 찾기
        doc = collection.find_one({'profile_link': profile_link})
        
        if doc:
            # 각 필드 업데이트
            if 'clean_name' in doc:
                df.at[index, 'clean_name'] = doc['clean_name']
            if 'contact_method' in doc:
                df.at[index, 'contact_method'] = doc['contact_method']
            if 'contact_info' in doc:
                df.at[index, 'contact_info'] = doc['contact_info']
            if 'contact_method_02' in doc:
                df.at[index, 'contact_method_02'] = doc['contact_method_02']
            if 'contact_info_02' in doc:
                df.at[index, 'contact_info_02'] = doc['contact_info_02']
        else:
            print(f"프로필 링크에 대한 데이터를 찾을 수 없습니다: {profile_link}")
    
    # 업데이트된 데이터를 Excel 파일에 저장
    df.to_excel('inpk/inpock_links_updated.xlsx', index=False)
    print("Excel 파일이 성공적으로 업데이트되었습니다.")

except Exception as e:
    print(f"오류 발생: {e}")
finally:
    client.close() 