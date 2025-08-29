const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory already exists');
}

// Create subdirectories for organized file storage
const subdirs = ['documents', 'temp', 'exports'];

subdirs.forEach(subdir => {
  const subdirPath = path.join(uploadsDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
    console.log(`✅ Created ${subdir} subdirectory`);
  }
});

console.log('📁 Upload directory structure ready!');