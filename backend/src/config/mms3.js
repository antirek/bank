import axios from 'axios';

const mms3Client = axios.create({
  baseURL: process.env.MMS3_API_URL || 'http://localhost:3000/api',
  headers: {
    'X-API-Key': process.env.MMS3_API_KEY || '',
    'X-Tenant-ID': process.env.MMS3_TENANT_ID || 'tnt_default',
    'Content-Type': 'application/json'
  }
});

export default mms3Client;
