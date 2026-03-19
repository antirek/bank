import axios from 'axios';
import { config } from '@boqq/shared/config';

const mms3Client = axios.create({
  baseURL: config.mms3.apiUrl,
  headers: {
    'X-API-Key': config.mms3.apiKey,
    'X-Tenant-ID': config.mms3.tenantId,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export default mms3Client;
