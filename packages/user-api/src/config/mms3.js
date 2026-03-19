import axios from 'axios';
import { config } from '@boqq/shared-models/config';

const mms3Client = axios.create({
  baseURL: config.mms3ApiUrl,
  headers: {
    'X-API-Key': config.mms3ApiKey,
    'X-Tenant-ID': config.mms3TenantId,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export default mms3Client;
