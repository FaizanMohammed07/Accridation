const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (file, folder = 'accreditech') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: false,
    }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};