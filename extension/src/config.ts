export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://nice-clips.vercel.app'
  : 'http://localhost:3000';

export const CLOUDFLARE_R2_BASE_URL = 'https://44936cff27d6568454e39cf5ca432fb7.r2.cloudflarestorage.com/nice-clips-1';