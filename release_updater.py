import os
import json
import subprocess
import requests

class ReleaseUpdater:
    def __init__(self, owner, repo, version_file="VERSION.txt"):
        self.owner = owner
        self.repo = repo
        self.version_file = version_file
        self.api_url = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"
    
    def get_latest_release(self):
        """GitHub API를 사용하여 최신 릴리즈 정보를 가져옵니다"""
        try:
            response = requests.get(self.api_url)
            response.raise_for_status()
            release_data = response.json()
            return {
                'tag_name': release_data['tag_name'],
                'name': release_data['name'],
                'published_at': release_data['published_at'],
                'body': release_data['body'],  # 릴리즈 노트
                'assets': release_data['assets']
            }
        except requests.RequestException as e:
            print(f"GitHub API 요청 중 오류 발생: {e}")
            return None
        except (KeyError, json.JSONDecodeError) as e:
            print(f"릴리즈 데이터 파싱 중 오류 발생: {e}")
            return None
    
    def get_current_version(self):
        """로컬에 저장된 현재 버전 정보를 반환합니다"""
        if not os.path.exists(self.version_file):
            return None
        
        try:
            with open(self.version_file, 'r', encoding='utf-8') as f:
                version_info = json.load(f)
                return version_info.get('tag_name')
        except (json.JSONDecodeError, FileNotFoundError, KeyError) as e:
            print(f"버전 파일 읽기 오류: {e}")
            return None
    
    def save_version_info(self, release_info):
        """릴리즈 정보를 로컬 파일에 저장합니다"""
        try:
            with open(self.version_file, 'w', encoding='utf-8') as f:
                json.dump(release_info, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"버전 정보 저장 중 오류 발생: {e}")
            return False
    
    def update_to_latest(self):
        """최신 릴리즈 버전으로 업데이트합니다"""
        current_version = self.get_current_version()
        latest_release = self.get_latest_release()
        
        if not latest_release:
            print("❌ 최신 릴리즈 정보를 가져올 수 없습니다.")
            return False
        
        latest_version = latest_release['tag_name']
        
        if current_version is None:
            print(f"⚠️ 첫 실행: 최신 버전 {latest_version}을 설치합니다.")
            should_update = True
        elif current_version != latest_version:
            print(f"🔄 업데이트 필요: {current_version} → {latest_version}")
            should_update = True
        else:
            print(f"✅ 이미 최신 버전입니다: {current_version}")
            return True
        
        if should_update:
            try:
                # Git으로 최신 릴리즈 태그 체크아웃
                subprocess.run(["git", "fetch", "--tags"], check=True)
                subprocess.run(["git", "checkout", latest_version], check=True)
                
                # 버전 정보 저장
                self.save_version_info(latest_release)
                
                print(f"✅ 버전 {latest_version}으로 업데이트 완료")
                
                # 업데이트 후 추가 작업이 필요한 경우 (예: 의존성 설치)
                self._post_update_actions()
                
                return True
            except subprocess.CalledProcessError as e:
                print(f"Git 명령 실행 중 오류 발생: {e}")
                return False
    
    def _post_update_actions(self):
        """업데이트 후 필요한 추가 작업을 수행합니다 (예: pip 패키지 설치)"""
        if os.path.exists("requirements.txt"):
            try:
                print("📦 의존성 패키지 설치 중...")
                subprocess.run(["pip", "install", "-r", "requirements.txt"], check=True)
            except subprocess.CalledProcessError as e:
                print(f"의존성 설치 중 오류 발생: {e}") 