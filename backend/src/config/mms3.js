import axios from 'axios';

const mms3Client = axios.create({
  baseURL: process.env.MMS3_API_URL || 'http://localhost:3005/api',
  headers: {
    'X-API-Key': process.env.MMS3_API_KEY || 'chat3_f0f71a596d0b47977edb7a5064ad2a1fd0a2a920c7c10cff0ff964c3f7ff2c76',
    'X-Tenant-ID': process.env.MMS3_TENANT_ID || 'tnt_default',
    'Content-Type': 'application/json'
  }
});

export default mms3Client;
