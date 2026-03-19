import axios from 'axios';

const mms3Client = axios.create({
  baseURL: process.env.MMS3_API_URL || 'http://localhost:3005/api',
  headers: {
    'X-API-Key': process.env.MMS3_API_KEY || 'chat3_f3d5f7101d9b1f56284c648e107630f30ed6444883d9d91d0fc74e04120fdd98',
    'X-Tenant-ID': process.env.MMS3_TENANT_ID || 'tnt_default',
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 секунд таймаут
});

export default mms3Client;
