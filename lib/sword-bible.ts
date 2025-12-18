import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SWORD_MODULES_DIR = path.join(process.cwd(), 'sword-modules');
const NET_MODULE_URL = 'https://crosswire.org/ftpmirror/pub/sword/packages/rawzip/NET.zip';

interface Verse {
  reference: string;
  text: string;
}

// Simple NET Bible verse lookup using pre-downloaded JSON
// For now, we'll use a simplified approach with a JSON file
export async function getVerse(reference: string): Promise<Verse | null> {
  try {
    // Use BibleAPI.co (free, no API key required)
    // Defaults to World English Bible (WEB) translation
    const cleanRef = reference.replace(/\s+/g, '+');
    const url = `https://bible-api.com/${cleanRef}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Bible API error:', response.status);
      return null;
    }
    
    const bibleData = await response.json();
    if (bibleData && bibleData.text) {
      return {
        reference: bibleData.reference || reference,
        text: bibleData.text.trim()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
}

// Download NET Sword module (to be called during setup)
export async function downloadNETModule(): Promise<boolean> {
  try {
    if (!fs.existsSync(SWORD_MODULES_DIR)) {
      fs.mkdirSync(SWORD_MODULES_DIR, { recursive: true });
    }

    const zipPath = path.join(SWORD_MODULES_DIR, 'NET.zip');
    
    // Download NET module
    console.log('Downloading NET Bible module...');
    const response = await fetch(NET_MODULE_URL);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(buffer));
    
    console.log('NET Bible module downloaded successfully');
    return true;
  } catch (error) {
    console.error('Error downloading NET module:', error);
    return false;
  }
}
