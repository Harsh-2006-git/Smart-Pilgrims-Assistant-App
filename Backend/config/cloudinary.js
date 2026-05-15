import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

dotenv.config();

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createDiskStorage = (subDir) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const relativeDir = path.join('uploads', subDir);
      fs.mkdirSync(path.resolve(relativeDir), { recursive: true });
      cb(null, relativeDir);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const safeBase = path
        .basename(file.originalname || 'upload', extension)
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .slice(0, 40) || 'upload';
      cb(null, `${Date.now()}-${safeBase}${extension}`);
    },
  });

const createStorage = (folder, subDir, extraParams = {}) => {
  if (!hasCloudinaryConfig) {
    return createDiskStorage(subDir);
  }

  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'png', 'jpeg'],
      ...extraParams,
    },
  });
};

if (!hasCloudinaryConfig) {
  console.warn('Cloudinary credentials missing. Falling back to local uploads/ storage.');
}

// For Profile Photos
const profileStorage = createStorage('ujjain_yatra/profiles', path.join('profiles'), {
  transformation: [{ width: 500, height: 500, crop: 'limit' }],
});

// For Parking Places
const parkingStorage = createStorage('ujjain_yatra/parking', path.join('parking'));

// For Stay Listings
const stayStorage = createStorage('ujjain_yatra/stays', path.join('stays'));

// For Lost & Found Items
const lostFoundStorage = createStorage('ujjain_yatra/lost_found', path.join('lost_found'));

export { cloudinary, profileStorage, parkingStorage, stayStorage, lostFoundStorage };
