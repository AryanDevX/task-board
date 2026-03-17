import fs from 'fs';
import path from 'path';
import multer from 'multer';

const avatarUploadDir = path.resolve(process.cwd(), 'uploads/avatars');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

export const uploadAvatar = multer({ storage });
