const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 상대 경로 대신 절대 경로로 모듈 참조
const gmailAuthPath = path.join(__dirname, 'gmailAuth.js');
console.log('Gmail 인증 모듈 경로:', gmailAuthPath);

let getGmailCredentials;
try {
  // 직접 require로 모듈 로드 시도
  const gmailAuth = require(gmailAuthPath);
  getGmailCredentials = gmailAuth.getGmailCredentials;
} catch (error) {
  console.error('Gmail Auth 모듈 로드 오류:', error);
  
  // 대체 함수 제공 (Window 전역 객체에서 가져오기 시도)
  getGmailCredentials = window.getGmailCredentials || 
    // 대체 구현
    async function(accountId, credentialsPath) {
      console.log('대체 인증 함수 사용:', accountId, credentialsPath);
      throw new Error('Gmail 인증 모듈을 로드할 수 없습니다. Window 전역 객체에도 인증 함수가 없습니다.');
    };
}

async function sendEmail(auth, options) {
  try {
    const gmail = google.gmail({ version: 'v1', auth });
    
    // 기본 헤더 설정
    const headers = {
      To: options.to,
      Subject: options.subject,
      'Content-Type': 'text/html; charset=utf-8'
    };
    
    // From 헤더 추가 (if provided)
    if (options.from) {
      headers.From = options.from;
    }
    
    // 헤더와 본문을 합쳐서 raw 메시지 생성
    const email = [
      Object.keys(headers).map(key => `${key}: ${headers[key]}`).join('\r\n'),
      '',
      options.body
    ].join('\r\n');
    
    // Base64 인코딩
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // 이메일 전송
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    return {
      success: true,
      messageId: res.data.id,
      message: '이메일이 성공적으로 전송되었습니다.'
    };
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    return {
      success: false,
      error: error.message,
      message: '이메일 전송 중 오류가 발생했습니다.'
    };
  }
}

// 계정 ID와 메일 옵션을 받아 이메일 전송
async function sendMailWithAccount(accountId, mailOptions, credentialsPath) {
  try {
    console.log(`계정 ID: ${accountId}, 자격 증명 경로: ${credentialsPath} 로 메일 전송 시도`);
    
    // 경로 처리를 개선하여 __dirname 문제 해결
    let resolvedCredentialsPath = credentialsPath;
    
    // 상대 경로로 되어 있다면 절대 경로로 변환
    if (!path.isAbsolute(credentialsPath)) {
      resolvedCredentialsPath = path.join(__dirname, path.basename(credentialsPath));
    }
    
    console.log(`자격 증명 파일 절대 경로: ${resolvedCredentialsPath}`);
    
    // 파일이 존재하는지 확인
    if (!fs.existsSync(resolvedCredentialsPath)) {
      console.error(`자격 증명 파일이 존재하지 않습니다: ${resolvedCredentialsPath}`);
      
      // 대체 경로 시도
      const alternativePath = path.join(__dirname, `credentials_${accountId}.js`);
      console.log(`대체 자격 증명 파일 경로 시도: ${alternativePath}`);
      
      if (fs.existsSync(alternativePath)) {
        resolvedCredentialsPath = alternativePath;
      } else {
        throw new Error(`인증 파일을 찾을 수 없습니다: ${credentialsPath}`);
      }
    }
    
    // 계정 인증 정보 가져오기
    const auth = await getGmailCredentials(accountId, resolvedCredentialsPath);
    
    // 메일 전송
    const result = await sendEmail(auth, mailOptions);
    return result;
  } catch (error) {
    console.error('계정 인증 또는 이메일 전송 오류:', error);
    
    // 클립보드 복사 기능을 대체 방법으로 제안
    try {
      const mailContent = `
받는 사람: ${mailOptions.to}
제목: ${mailOptions.subject}

${mailOptions.body.replace(/<[^>]*>/g, '')}
      `;
      
      if (window.navigator && window.navigator.clipboard) {
        await window.navigator.clipboard.writeText(mailContent);
        console.log('메일 내용이 클립보드에 복사되었습니다.');
      }
    } catch (clipboardError) {
      console.error('클립보드 복사 중 오류:', clipboardError);
    }
    
    return {
      success: false,
      error: error.message,
      message: '계정 인증 또는 이메일 전송 중 오류가 발생했습니다. 클립보드에 복사하시겠습니까?',
      suggestClipboard: true
    };
  }
}

// 모듈 외부에서도 사용할 수 있도록 window 객체에 함수 추가
if (typeof window !== 'undefined') {
  window.sendMailWithAccount = sendMailWithAccount;
}

// CommonJS 모듈 내보내기
module.exports = {
  sendEmail,
  sendMailWithAccount
}; 