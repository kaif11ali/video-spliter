import fs from 'fs';
import path from 'path';

function cleanupAllUploads() {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    console.log('No uploads directory found.');
    return;
  }

  try {
    // Remove everything in uploads directory
    const items = fs.readdirSync(uploadsPath);
    let cleanedCount = 0;

    items.forEach(item => {
      const itemPath = path.join(uploadsPath, item);
      try {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }
        cleanedCount++;
        console.log(`Removed: ${item}`);
      } catch (err) {
        console.warn(`Could not remove ${item}:`, err.message);
      }
    });

    console.log(`\nCleanup completed successfully!`);
    console.log(`Total items removed: ${cleanedCount}`);
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
}

// Run cleanup
console.log('Starting cleanup of all uploads...');
cleanupAllUploads();
