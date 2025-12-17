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
    // Parse reference (e.g., "John 3:16" or "Romans 8:28-30")
    const match = reference.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(-(\d+))?/);
    
    if (!match) {
      console.error('Invalid verse reference:', reference);
      return null;
    }

    const [, book, chapter, startVerse, , endVerse] = match;
    
    // For initial implementation, fall back to API.Bible if local module not available
    // This allows gradual migration
    const netBibleId = '06125adad2d5898a-01'; // NET translation on API.Bible
    const apiKey = process.env.BIBLE_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    const cleanReference = reference.trim();
    const url = new URL(`https://api.scripture.api.bible/v1/bibles/${netBibleId}/search`);
    url.searchParams.append('query', cleanReference);
    url.searchParams.append('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error('Bible API error:', await response.text());
      return null;
    }

    const data = await response.json();
    
    if (data.data?.passages && data.data.passages.length > 0) {
      const passage = data.data.passages[0];
      return {
        reference: passage.reference,
        text: passage.content,
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
