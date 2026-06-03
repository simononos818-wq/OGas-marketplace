// Re-export from lib/firebase to avoid duplicate initialization
export { app, db, auth, analytics, googleProvider, setupRecaptcha } from '@/lib/firebase';
export { default } from '@/lib/firebase';
