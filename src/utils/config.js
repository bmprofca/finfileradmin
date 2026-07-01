/**
 * CRA loads `.env.development` on `npm start` and `.env.production` on `npm run build`.
 * Only variables prefixed with REACT_APP_ are exposed to the client bundle.
 */
const API_BASE = (process.env.REACT_APP_BASE_API_URL || '').replace(/\/$/, '');

export { API_BASE };

export default API_BASE;
