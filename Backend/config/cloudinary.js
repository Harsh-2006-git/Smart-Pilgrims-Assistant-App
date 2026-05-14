import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// For Profile Photos
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ujjain_yatra/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// For Parking Places
const parkingStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ujjain_yatra/parking',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

// For Lost & Found Items
const lostFoundStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ujjain_yatra/lost_found',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

// Pilgrim stays — property + room photos (Cloudinary)
const stayStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ujjain_yatra/stays',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

export { cloudinary, profileStorage, parkingStorage, lostFoundStorage, stayStorage };
