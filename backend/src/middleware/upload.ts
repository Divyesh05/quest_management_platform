import multer from 'multer';

// Use memory storage since we want to upload directly to Supabase storage,
// not save it to local disk permanently.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
