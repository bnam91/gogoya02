const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { getGmailCredentials } = require('./gmailAuth');

// 터미널 인코딩 설정
if (process.platform === 'win32') {
    process.stdout.write('\x1B[2J\x1B[0f');
    process.stdout.write('\x1B[?25l');
    process.stdout.write('\x1B[?7l');
    process.stdout.write('\x1B[?12l');
    process.stdout.write('\x1B[?25h');
}

async function loadAccounts() {
    const accountsData = JSON.parse(fs.readFileSync('accounts.json', 'utf8'));
    return accountsData.accounts;
}

function selectAccount(accounts) {
    return new Promise((resolve) => {
        console.log('\n사용할 계정을 선택하세요:');
        accounts.forEach((account, index) => {
            console.log(`${index + 1}. ${account.name} (${account.email})`);
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = () => {
            rl.question('\n계정 번호를 입력하세요: ', (choice) => {
                const index = parseInt(choice) - 1;
                
                if (!isNaN(index) && index >= 0 && index < accounts.length) {
                    rl.close();
                    resolve(accounts[index]);
                } else {
                    console.log('잘못된 번호입니다. 다시 선택해주세요.');
                    askQuestion();
                }
            });
        };

        askQuestion();
    });
}

async function sendEmail(account) {
    try {
        const credentialsPath = `credentials_${account.id}.json`;
        
        if (!fs.existsSync(credentialsPath)) {
            console.log(`\n오류: ${account.email} 계정의 credentials 파일이 없습니다.`);
            console.log(`'${credentialsPath}' 파일이 필요합니다.`);
            return;
        }

        const auth = await getGmailCredentials(account.id, credentialsPath);
        const gmail = google.gmail({ version: 'v1', auth });

        // 받는 사람 이메일 주소 입력 받기
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const recipientEmail = await new Promise((resolve) => {
            rl.question('\n받는 사람의 이메일 주소를 입력하세요: ', (email) => {
                rl.close();
                resolve(email);
            });
        });

        // 제목 입력 받기
        const rl2 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const emailSubject = await new Promise((resolve) => {
            rl2.question('\n이메일 제목을 입력하세요: ', (subject) => {
                rl2.close();
                resolve(subject);
            });
        });

        // 본문 입력 받기
        const rl3 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const emailBody = await new Promise((resolve) => {
            rl3.question('\n이메일 본문을 입력하세요: ', (body) => {
                rl3.close();
                resolve(body);
            });
        });

        // 계정별 서명 설정
        const signatures = {
            'bnam91': `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <img src="https://i.ibb.co/QZn65VY/image.png" alt="고야앤드미디어 명함" style="margin-top: 10px; max-width: 300px;">
                </div>
            `,
            'contant01': `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <img src="https://i.ibb.co/YTRgN6fp/image.png" alt="박슬하 명함" style="margin-top: 10px; max-width: 300px;">
                </div>
            `,
            'jisu04': `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <img src="https://i.ibb.co/RG93mR7S/2.png" alt="김지수 명함" style="margin-top: 10px; max-width: 300px;">
                </div>
            `
        };

        const signature = signatures[account.id] || '';

        const emailLines = [
            'MIME-Version: 1.0',
            'From: ' + account.email,
            'To: ' + recipientEmail,
            'Subject: =?UTF-8?B?' + Buffer.from(emailSubject).toString('base64') + '?=',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            Buffer.from(`
                <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                    <p>${emailBody}</p>
                    ${signature}
                </div>
            `).toString('base64')
        ].join('\r\n');

        const encodedEmail = Buffer.from(emailLines)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedEmail
            }
        });

        console.log(`메일이 성공적으로 전송되었습니다. 메시지 ID: ${response.data.id}`);
    } catch (error) {
        console.error('메일 전송 중 오류가 발생했습니다:', error);
    }
}

async function main() {
    try {
        const accounts = await loadAccounts();
        const selectedAccount = await selectAccount(accounts);
        console.log(`\n선택된 계정: ${selectedAccount.name} (${selectedAccount.email})`);
        await sendEmail(selectedAccount);
    } catch (error) {
        console.error('프로그램 실행 중 오류가 발생했습니다:', error);
    }
}

main(); 