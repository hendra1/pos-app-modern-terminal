const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('posConfig', {
  apiUrl: `http://localhost:${process.env.API_PORT || 3351}`,
  appName: process.env.APP_NAME || 'POS Terminal',
  companyName: process.env.COMPANY_NAME || 'Toko Demo',
});
