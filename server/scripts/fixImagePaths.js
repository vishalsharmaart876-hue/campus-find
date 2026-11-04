const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../config/db');
const Item = require('../models/Item');

async function fixPaths() {
  await connectDB();
  const items = await Item.find({});
  for (const it of items) {
    if (it.images && it.images.length > 0) {
      let changed = false;
      it.images = it.images.map((img) => {
        if (img.includes('uploads') || img.includes('item-')) {
          const filename = img.split(/[/\\\\]/).pop();
          changed = true;
          return `/uploads/${filename}`;
        }
        return img;
      });
      if (changed) {
        await it.save();
        console.log(`[Fixed] Updated image path for: ${it.title} -> ${it.images[0]}`);
      }
    }
  }
  process.exit(0);
}
fixPaths();
