// This file provides the base API URL for all fetch calls.
// In development: Vite proxy handles /api -> localhost:5001
// In production (Vercel): calls go directly to the Render backend URL
const API_BASE = import.meta.env.VITE_API_URL || '';
export default API_BASE;
