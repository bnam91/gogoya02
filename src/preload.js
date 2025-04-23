const { contextBridge, ipcRenderer } = require('electron');

// 벤더 데이터 요청
contextBridge.exposeInMainWorld('api', {
  fetchVendorData: (filters) => ipcRenderer.invoke('vendor-data-request', filters),
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
  sendGmail: (params) => ipcRenderer.invoke('send-gmail', params)
});
