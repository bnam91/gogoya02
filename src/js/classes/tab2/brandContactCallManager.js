// const mongo = require('./mongo'); 삭제
// const phone = require('./phone'); 삭제
// 대신 window.mongo와 window.phone 사용

export class BrandContactCallManager {
    constructor() {
        this.isCalling = false;
        this.callStartTime = null;
        this.callDurationTimer = null;
        this.currentBrandData = null;
    }

    updateCallDuration() {
        if (!this.callStartTime || !this.isCalling) return;
        
        const now = new Date();
        const duration = Math.floor((now - this.callStartTime) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        const durationElement = document.querySelector('.call-duration');
        if (durationElement) {
            durationElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    async endCall() {
        try {
            if (this.isCalling) {
                await window.phone.endCall();
                this.isCalling = false;
                
                if (this.callDurationTimer) {
                    clearInterval(this.callDurationTimer);
                    this.callDurationTimer = null;
                }
                
                const endTime = new Date();
                const duration = Math.floor((endTime - this.callStartTime) / 1000);
                
                const endCallButton = document.querySelector('.end-call-button');
                const saveButton = document.querySelector('.save-button');
                if (endCallButton) endCallButton.style.display = 'none';
                if (saveButton) saveButton.style.display = 'inline-block';
                
                return duration;
            }
        } catch (error) {
            console.error('통화 종료 중 오류:', error);
            throw error;
        }
    }

    async startCall(phoneNumber) {
        try {
            //await window.phone.call(phoneNumber);
            await window.api.callPhone(phoneNumber);
            this.isCalling = true;
            this.callStartTime = new Date();
            
            if (this.callDurationTimer) clearInterval(this.callDurationTimer);
            this.callDurationTimer = setInterval(() => this.updateCallDuration(), 1000);
            
            return true;
        } catch (error) {
            console.error('전화 연결 중 오류:', error);
            throw error;
        }
    }

    async saveCallRecord(callStatus, nextStep, notes) {
        if (!this.currentBrandData) throw new Error('브랜드 데이터가 없습니다.');
        
        const endTime = new Date();
        const duration = Math.floor((endTime - this.callStartTime) / 1000);
        
        const callRecord = {
            brand_name: this.currentBrandData.brand_name,
            customer_service_number: this.currentBrandData.customer_service_number,
            contact_person: {
                name: "고야앤드미디어",
                phone: "01021300380"
            },
            call_date: this.callStartTime.toISOString(),
            call_duration_sec: duration,
            call_status: callStatus,
            nextstep: nextStep,
            notes: notes
        };
        
        try {
            //await window.mongo.saveCallRecord(callRecord);
            await window.api.saveCallRecord(callRecord);
            return true;
        } catch (error) {
            console.error('통화 기록 저장 중 오류:', error);
            throw error;
        }
    }

    setCurrentBrandData(brandData) {
        this.currentBrandData = brandData;
    }

    async getCallHistory(brandName) {
        try {
            //return await window.mongo.getCallRecords(brandName);
            return await window.api.fetchCallRecords(brandName);
        } catch (error) {
            console.error('통화 기록 조회 중 오류:', error);
            throw error;
        }
    }
}

//module.exports = BrandContactCallManager; 