const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

class ReleaseUpdater {
    constructor(owner, repo, versionFile = "VERSION.txt") {
        this.owner = owner;
        this.repo = repo;
        this.versionFile = versionFile;
        this.apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    }

    async getLatestRelease() {
        try {
            const response = await axios.get(this.apiUrl);
            const releaseData = response.data;
            return {
                tag_name: releaseData.tag_name,
                name: releaseData.name,
                published_at: releaseData.published_at,
                body: releaseData.body,
                assets: releaseData.assets
            };
        } catch (error) {
            console.error('GitHub API 요청 중 오류 발생:', error.message);
            return null;
        }
    }

    getCurrentVersion() {
        try {
            if (!fs.existsSync(this.versionFile)) {
                return null;
            }
            const versionInfo = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
            return versionInfo.tag_name;
        } catch (error) {
            console.error('버전 파일 읽기 오류:', error.message);
            return null;
        }
    }

    saveVersionInfo(releaseInfo) {
        try {
            fs.writeFileSync(
                this.versionFile,
                JSON.stringify(releaseInfo, null, 2),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error('버전 정보 저장 중 오류 발생:', error.message);
            return false;
        }
    }

    async updateToLatest() {
        const currentVersion = this.getCurrentVersion();
        const latestRelease = await this.getLatestRelease();

        if (!latestRelease) {
            console.log('❌ 최신 릴리즈 정보를 가져올 수 없습니다.');
            return false;
        }

        const latestVersion = latestRelease.tag_name;

        if (currentVersion === null) {
            console.log(`⚠️ 첫 실행: 최신 버전 ${latestVersion}을 설치합니다.`);
            return await this.performUpdate(latestRelease);
        } else if (currentVersion !== latestVersion) {
            console.log(`🔄 업데이트 필요: ${currentVersion} → ${latestVersion}`);
            return await this.performUpdate(latestRelease);
        } else {
            console.log(`✅ 이미 최신 버전입니다: ${currentVersion}`);
            return true;
        }
    }

    async performUpdate(releaseInfo) {
        try {
            // Git으로 최신 릴리즈 태그 체크아웃
            await this.executeCommand('git fetch --tags');
            await this.executeCommand(`git checkout ${releaseInfo.tag_name}`);

            // 버전 정보 저장
            this.saveVersionInfo(releaseInfo);

            console.log(`✅ 버전 ${releaseInfo.tag_name}으로 업데이트 완료`);

            // 업데이트 후 추가 작업
            await this.postUpdateActions();

            return true;
        } catch (error) {
            console.error('Git 명령 실행 중 오류 발생:', error.message);
            return false;
        }
    }

    async postUpdateActions() {
        if (fs.existsSync('package.json')) {
            try {
                console.log('📦 의존성 패키지 설치 중...');
                await this.executeCommand('npm install');
            } catch (error) {
                console.error('의존성 설치 중 오류 발생:', error.message);
            }
        }
    }

    executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

module.exports = ReleaseUpdater; 