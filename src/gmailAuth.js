/*
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();
*/
import { google } from 'googleapis';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export function getTokenPath(accountId) {
    const tokenDir = process.platform === 'win32' 
        ? path.join(process.env.APPDATA, 'GoogleAPI')
        : path.join(process.env.HOME, '.config', 'GoogleAPI');
    
    if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
    }
    
    return path.join(tokenDir, `gmail_token_${accountId}.json`);
}

export async function getGmailCredentials(accountId, credentialsPath) {
    const tokenPath = getTokenPath(accountId);
    let credentials;

    if (fs.existsSync(tokenPath)) {
        credentials = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }

    const auth = new google.auth.OAuth2(
        credentials?.client_id,
        credentials?.client_secret,
        'http://localhost'
    );

    if (credentials?.refresh_token) {
        auth.setCredentials(credentials);
    } else {
        /*
        const credentialsFile = require(credentialsPath);
        const { client_id, client_secret, redirect_uris } = credentialsFile.installed;
        */
        const credentialsFile = await import(`file://${path.resolve(credentialsPath)}`);
        const { installed } = credentialsFile.default;
        const { client_id, client_secret, redirect_uris } = installed;
        
        auth.setCredentials({
            client_id,
            client_secret,
            redirect_uris
        });

        const authUrl = auth.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });

        console.log('다음 URL을 브라우저에서 열어 인증을 완료하세요:', authUrl);
        
        // 크롬 브라우저로 URL 열기
        if (process.platform === 'win32') {
            exec(`start chrome "${authUrl}"`);
        } else if (process.platform === 'darwin') {
            exec(`open -a "Google Chrome" "${authUrl}"`);
        } else {
            exec(`google-chrome "${authUrl}"`);
        }
        
        const code = await new Promise((resolve) => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            readline.question('인증 코드를 입력하세요: ', (code) => {
                readline.close();
                resolve(code);
            });
        });

        const { tokens } = await auth.getToken(code);
        auth.setCredentials(tokens);
        
        fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    }

    return auth;
}
/**
 * Gmail을 통해 이메일 전송
 * @param {Object} auth - 인증된 OAuth2 클라이언트
 * @param {Object} mailOptions - 메일 전송 옵션 (from, to, subject, body)
 * @returns {Promise<Object>} - 전송 결과
 */
export async function sendGmail(auth, mailOptions) {
    const gmail = google.gmail({ version: 'v1', auth });
  
    const messageParts = [
      `From: ${mailOptions.from}`,
      `To: ${mailOptions.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(mailOptions.subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      mailOptions.body
    ];
    const message = messageParts.join('\r\n');
  
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });
  
    return response.data;
  }
/*
module.exports = {
    getGmailCredentials
};
*/ 