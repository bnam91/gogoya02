const { exec } = require('child_process');

const ADB_PATH = "C:\\adb\\adb.exe";

function makeCall(phoneNumber) {
    return new Promise((resolve, reject) => {
        if (!phoneNumber) {
            reject(new Error('전화번호가 제공되지 않았습니다.'));
            return;
        }

        const command = `"${ADB_PATH}" shell am start -a android.intent.action.CALL -d tel:${phoneNumber}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`전화 걸기 오류: ${error}`);
                reject(error);
                return;
            }
            console.log(`전화 걸기 성공: ${stdout}`);
            if (stderr) {
                console.warn(`경고: ${stderr}`);
            }
            resolve(stdout);
        });
    });
}

module.exports = {
    makeCall,
    call: makeCall  // call 이름으로도 export
}; 