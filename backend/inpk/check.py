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

    # contact_method_02가 존재하는 문서 찾기
    documents = collection.find({"contact_method_02": {"$exists": True}})
    
    # 결과를 리스트로 변환하여 개수 확인
    doc_list = list(documents)
    total_count = len(doc_list)
    
    # 결과 출력
    print("\ncontact_method_02가 있는 문서들:")
    for doc in doc_list:
        print(f"\n문서 ID: {doc['_id']}")
        print(f"username: {doc.get('username', '없음')}")
        print(f"contact_method: {doc.get('contact_method', '없음')}")
        print(f"contact_info: {doc.get('contact_info', '없음')}")
        print(f"contact_method_02: {doc.get('contact_method_02', '없음')}")
        print(f"contact_info_02: {doc.get('contact_info_02', '없음')}")
    
    print(f"\n총 {total_count}개의 문서가 contact_method_02를 가지고 있습니다.")

    # contact_info와 contact_info_02가 같은 경우 찾기
    same_info_docs = [doc for doc in doc_list if doc.get('contact_info') == doc.get('contact_info_02') and doc.get('contact_info') is not None]
    
    if same_info_docs:
        print("\ncontact_info와 contact_info_02가 같은 문서들:")
        for doc in same_info_docs:
            print(f"\n문서 ID: {doc['_id']}")
            print(f"username: {doc.get('username', '없음')}")
            print(f"contact_method: {doc.get('contact_method', '없음')}")
            print(f"contact_info: {doc.get('contact_info')}")
            print(f"contact_method_02: {doc.get('contact_method_02', '없음')}")
            print(f"contact_info_02: {doc.get('contact_info_02')}")
        print(f"\n총 {len(same_info_docs)}개의 문서가 contact_info와 contact_info_02가 같습니다.")

        # 중복 제거 및 업데이트
        print("\n중복 제거 및 업데이트 시작...")
        for doc in same_info_docs:
            # contact_method_02와 contact_info_02 값을 contact_method와 contact_info로 업데이트
            update_result = collection.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "contact_method": doc["contact_method_02"],
                        "contact_info": doc["contact_info_02"]
                    },
                    "$unset": {
                        "contact_method_02": "",
                        "contact_info_02": ""
                    }
                }
            )
            print(f"문서 ID {doc['_id']} 업데이트 완료")
        
        print("중복 제거 및 업데이트 완료!")

    # contact_method가 'other'이고 contact_info가 빈 값인 경우 찾기
    other_empty_docs = collection.find({
        "contact_method": "other",
        "$or": [
            {"contact_info": None},
            {"contact_info": ""},
            {"contact_info": {"$exists": False}}
        ]
    })
    
    other_empty_list = list(other_empty_docs)
    if other_empty_list:
        print("\ncontact_method가 'other'이고 contact_info가 빈 값인 문서들:")
        for doc in other_empty_list:
            print(f"\n문서 ID: {doc['_id']}")
            print(f"username: {doc.get('username', '없음')}")
            print(f"contact_method: {doc.get('contact_method')}")
            print(f"contact_info: {doc.get('contact_info', '없음')}")
            print(f"contact_method_02: {doc.get('contact_method_02', '없음')}")
            print(f"contact_info_02: {doc.get('contact_info_02', '없음')}")
        print(f"\n총 {len(other_empty_list)}개의 문서가 contact_method가 'other'이고 contact_info가 빈 값입니다.")

        # contact_method_02와 contact_info_02가 있는 경우 업데이트
        print("\ncontact_method_02와 contact_info_02로 업데이트 시작...")
        for doc in other_empty_list:
            if "contact_method_02" in doc and "contact_info_02" in doc:
                update_result = collection.update_one(
                    {"_id": doc["_id"]},
                    {
                        "$set": {
                            "contact_method": doc["contact_method_02"],
                            "contact_info": doc["contact_info_02"]
                        },
                        "$unset": {
                            "contact_method_02": "",
                            "contact_info_02": ""
                        }
                    }
                )
                print(f"문서 ID {doc['_id']} 업데이트 완료")
            else:
                # contact_method_02와 contact_info_02가 없는 경우 contact_method와 contact_info 삭제
                update_result = collection.update_one(
                    {"_id": doc["_id"]},
                    {
                        "$unset": {
                            "contact_method": "",
                            "contact_info": ""
                        }
                    }
                )
                print(f"문서 ID {doc['_id']}의 contact_method와 contact_info 삭제 완료")
        
        print("업데이트 완료!")

    # contact_info와 contact_info_02가 'https://business.inpock.co.kr/form?partner='인 경우 찾기
    form_docs = collection.find({
        "$or": [
            {"contact_info": "https://business.inpock.co.kr/form?partner="},
            {"contact_info_02": "https://business.inpock.co.kr/form?partner="}
        ]
    })
    
    form_list = list(form_docs)
    if form_list:
        print("\ncontact_info나 contact_info_02가 'https://business.inpock.co.kr/form?partner='인 문서들:")
        for doc in form_list:
            print(f"\n문서 ID: {doc['_id']}")
            print(f"username: {doc.get('username', '없음')}")
            print(f"contact_method: {doc.get('contact_method', '없음')}")
            print(f"contact_info: {doc.get('contact_info', '없음')}")
            print(f"contact_method_02: {doc.get('contact_method_02', '없음')}")
            print(f"contact_info_02: {doc.get('contact_info_02', '없음')}")
        print(f"\n총 {len(form_list)}개의 문서가 contact_info나 contact_info_02가 'https://business.inpock.co.kr/form?partner='입니다.")

        # username을 붙여서 업데이트
        print("\nusername을 붙여서 업데이트 시작...")
        for doc in form_list:
            username = doc.get('username', '')
            if username:
                # contact_info가 'https://business.inpock.co.kr/form?partner='인 경우
                if doc.get('contact_info') == "https://business.inpock.co.kr/form?partner=":
                    update_result = collection.update_one(
                        {"_id": doc["_id"]},
                        {
                            "$set": {
                                "contact_info": f"https://business.inpock.co.kr/form?partner={username}"
                            }
                        }
                    )
                    print(f"문서 ID {doc['_id']}의 contact_info 업데이트 완료")
                
                # contact_info_02가 'https://business.inpock.co.kr/form?partner='인 경우
                if doc.get('contact_info_02') == "https://business.inpock.co.kr/form?partner=":
                    update_result = collection.update_one(
                        {"_id": doc["_id"]},
                        {
                            "$set": {
                                "contact_info_02": f"https://business.inpock.co.kr/form?partner={username}"
                            }
                        }
                    )
                    print(f"문서 ID {doc['_id']}의 contact_info_02 업데이트 완료")
        
        print("username 붙이기 업데이트 완료!")

except Exception as e:
    print(f"에러 발생: {e}")
finally:
    client.close()
