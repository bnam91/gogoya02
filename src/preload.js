const { contextBridge, ipcRenderer } = require('electron');

// 벤더 데이터 요청
contextBridge.exposeInMainWorld('api', {
  fetchBrandContactData: (filters) => ipcRenderer.invoke('brand-contact-data-request', filters),
  fetchBrandPhoneData: (brandName) => ipcRenderer.invoke('brand-phone-data-request', brandName),
  fetchLatestCallRecordByCardId: (cardId) => ipcRenderer.invoke('latest-call-record-request', cardId),
  fetchCallRecordById: (recordId) => ipcRenderer.invoke('call-record-by-id-request', recordId),
  updateBrandInfo: (brandName, updateData) => ipcRenderer.invoke('update-brand-info-request', brandName, updateData),
  saveCallRecord: (callRecord) => ipcRenderer.invoke('save-call-record-request', callRecord),
  updateCardNextStep: (recordId, newNextStep) => ipcRenderer.invoke('update-card-next-step-request', recordId, newNextStep),
  updateCallRecord: (recordId, updateData) => ipcRenderer.invoke('update-call-record-request', recordId, updateData),
  fetchCallRecords: (brandName) => ipcRenderer.invoke('fetch-call-records-request', brandName),
  callPhone: (phoneNumber) => ipcRenderer.invoke('call-phone-request', phoneNumber),
  endCall: () => ipcRenderer.invoke('end-call-request'),
  fetchProposalRequests: () => ipcRenderer.invoke('dashboard-proposal-request'),
  fetchBrandEmail: (brandName) => ipcRenderer.invoke('fetch-brand-email-request', brandName),
  updateNextStep: (brandName, newStatus) => ipcRenderer.invoke('update-nextstep-request', brandName, newStatus),
  fetchInfluencerDataForSellerMatch: () => ipcRenderer.invoke('fetch-influencer-data-for-seller-match'),
  fetchInfluencerDataForSellerAnalysis: () => ipcRenderer.invoke('fetch-influencer-data-for-seller-analysis'),
  getInfluencerInfo: (username) => ipcRenderer.invoke('get-influencer-info', username),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  saveInfluencerTags: (username, tags) => ipcRenderer.invoke('save-influencer-tags', { username, tags }),
  saveInfluencerContact: (username, method, info, excluded, reason) => ipcRenderer.invoke('save-influencer-contact', { username, method, info, excluded, reason }),
  fetchScreeningData: () => ipcRenderer.invoke('fetch-screening-data'),
  fetchInfluencerData: (cleanName) => ipcRenderer.invoke('fetch-influencer-data', cleanName),
  fetchItemDetails: (brandName, itemName) => ipcRenderer.invoke('fetch-item-details', { brandName, itemName }),
  fetchInfluencerViews: (cleanNameList) => ipcRenderer.invoke('fetch-influencer-views', cleanNameList),
  updateBrandVerification: (brandName, verificationStatus) => ipcRenderer.invoke('update-brand-verification', { brandName, verificationStatus }),
  fetchInfluencerDataMany: (cleanNameList) => ipcRenderer.invoke('fetch-influencer-data-many', cleanNameList),
  fetchBrandVerificationStatus: (allBrands) => ipcRenderer.invoke('fetch-brand-verification-status', allBrands),
  getDmRecords : (cleanName) => ipcRenderer.invoke('get-dm-records', cleanName)
});

contextBridge.exposeInMainWorld('googleSheetApi', {
  uploadInfluencerData: (uploadPayload) => ipcRenderer.invoke('upload-influencer-data', uploadPayload)
});

contextBridge.exposeInMainWorld('gmailAuthAPI', {
  startAuth: (accountId, credentialsPath) => ipcRenderer.invoke('start-gmail-auth', { accountId, credentialsPath }),
  sendAuthCode: (code) => ipcRenderer.invoke('send-auth-code', code),
  sendGmail: (params) => ipcRenderer.invoke('send-gmail', params)
});