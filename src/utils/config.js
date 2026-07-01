/**
 * CRA loads `.env.development` on `npm start` and `.env.production` on `npm run build`.
 * Only variables prefixed with REACT_APP_ are exposed to the client bundle.
 */
const API_BASE = (process.env.REACT_APP_BASE_API_URL || '').replace(/\/$/, '');

const UPLOAD_API_URL =
  process.env.REACT_APP_UPLOAD_API_URL || 'https://upload.onesaas.in/api/upload';
const UPLOAD_API_KEY = process.env.REACT_APP_UPLOAD_API_KEY || 'onedevelopers';

export { API_BASE, UPLOAD_API_URL, UPLOAD_API_KEY };

export default API_BASE;
