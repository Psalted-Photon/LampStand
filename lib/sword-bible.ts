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

// NET Bible verse lookup using Bolls.life API (official NET Bible text)
export async function getVerse(reference: string): Promise<Verse | null> {
  try {
    // Bolls.life provides official NET Bible text - no API key required
    // Format: https://bolls.life/get-verse/NET/{bookNumber}/{chapter}/{verse}/
    const parsedRef = parseReference(reference);
    if (!parsedRef) {
      console.error('Invalid verse reference format:', reference);
      return null;
    }

    const { bookNumber, chapter, verse, endVerse } = parsedRef;
    
    // Fetch verse(s)
    const verses: string[] = [];
    const endV = endVerse || verse;
    
    for (let v = verse; v <= endV; v++) {
      const url = `https://bolls.life/get-verse/NET/${bookNumber}/${chapter}/${v}/`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Bolls.life API error:', response.status);
        continue;
      }
      
      const data = await response.json();
      if (data?.text) {
        verses.push(data.text.trim());
      }
    }
    
    if (verses.length === 0) {
      return null;
    }
    
    return {
      reference: reference,
      text: verses.join(' ')
    };
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
}

// Parse verse reference into components
function parseReference(reference: string): { bookNumber: number; chapter: number; verse: number; endVerse?: number } | null {
  try {
    // Handle ranges like "John 3:16-17" or single verses "John 3:16"
    const rangeMatch = reference.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!rangeMatch) return null;
    
    const [, bookName, chapterStr, verseStr, endVerseStr] = rangeMatch;
    const bookNumber = getBookNumber(bookName.trim());
    if (!bookNumber) return null;
    
    return {
      bookNumber,
      chapter: parseInt(chapterStr),
      verse: parseInt(verseStr),
      endVerse: endVerseStr ? parseInt(endVerseStr) : undefined
    };
  } catch (error) {
    console.error('Error parsing reference:', error);
    return null;
  }
}

// Map book names to Bolls.life book numbers (1-66)
function getBookNumber(bookName: string): number | null {
  const bookMap: Record<string, number> = {
    'genesis': 1, 'gen': 1,
    'exodus': 2, 'exo': 2, 'ex': 2,
    'leviticus': 3, 'lev': 3,
    'numbers': 4, 'num': 4,
    'deuteronomy': 5, 'deut': 5, 'deu': 5,
    'joshua': 6, 'josh': 6, 'jos': 6,
    'judges': 7, 'judg': 7, 'jdg': 7,
    'ruth': 8, 'rut': 8,
    '1 samuel': 9, '1samuel': 9, '1sam': 9, '1 sam': 9,
    '2 samuel': 10, '2samuel': 10, '2sam': 10, '2 sam': 10,
    '1 kings': 11, '1kings': 11, '1ki': 11, '1 ki': 11,
    '2 kings': 12, '2kings': 12, '2ki': 12, '2 ki': 12,
    '1 chronicles': 13, '1chronicles': 13, '1chr': 13, '1 chr': 13,
    '2 chronicles': 14, '2chronicles': 14, '2chr': 14, '2 chr': 14,
    'ezra': 15, 'ezr': 15,
    'nehemiah': 16, 'neh': 16,
    'esther': 17, 'est': 17,
    'job': 18,
    'psalm': 19, 'psalms': 19, 'ps': 19, 'psa': 19,
    'proverbs': 20, 'prov': 20, 'pro': 20,
    'ecclesiastes': 21, 'eccl': 21, 'ecc': 21,
    'song of solomon': 22, 'song': 22, 'sng': 22,
    'isaiah': 23, 'isa': 23,
    'jeremiah': 24, 'jer': 24,
    'lamentations': 25, 'lam': 25,
    'ezekiel': 26, 'ezek': 26, 'ezk': 26,
    'daniel': 27, 'dan': 27,
    'hosea': 28, 'hos': 28,
    'joel': 29, 'joel': 29,
    'amos': 30, 'amo': 30,
    'obadiah': 31, 'obad': 31, 'oba': 31,
    'jonah': 32, 'jon': 32,
    'micah': 33, 'mic': 33,
    'nahum': 34, 'nah': 34, 'nam': 34,
    'habakkuk': 35, 'hab': 35,
    'zephaniah': 36, 'zeph': 36, 'zep': 36,
    'haggai': 37, 'hag': 37,
    'zechariah': 38, 'zech': 38, 'zec': 38,
    'malachi': 39, 'mal': 39,
    'matthew': 40, 'matt': 40, 'mat': 40, 'mt': 40,
    'mark': 41, 'mrk': 41, 'mk': 41,
    'luke': 42, 'luk': 42, 'lk': 42,
    'john': 43, 'jhn': 43, 'jn': 43,
    'acts': 44, 'act': 44,
    'romans': 45, 'rom': 45,
    '1 corinthians': 46, '1corinthians': 46, '1cor': 46, '1 cor': 46,
    '2 corinthians': 47, '2corinthians': 47, '2cor': 47, '2 cor': 47,
    'galatians': 48, 'gal': 48,
    'ephesians': 49, 'eph': 49,
    'philippians': 50, 'phil': 50, 'php': 50,
    'colossians': 51, 'col': 51,
    '1 thessalonians': 52, '1thessalonians': 52, '1thess': 52, '1 thess': 52,
    '2 thessalonians': 53, '2thessalonians': 53, '2thess': 53, '2 thess': 53,
    '1 timothy': 54, '1timothy': 54, '1tim': 54, '1 tim': 54,
    '2 timothy': 55, '2timothy': 55, '2tim': 55, '2 tim': 55,
    'titus': 56, 'tit': 56,
    'philemon': 57, 'phlm': 57, 'phm': 57,
    'hebrews': 58, 'heb': 58,
    'james': 59, 'jas': 59,
    '1 peter': 60, '1peter': 60, '1pet': 60, '1 pet': 60,
    '2 peter': 61, '2peter': 61, '2pet': 61, '2 pet': 61,
    '1 john': 62, '1john': 62, '1jn': 62, '1 jn': 62,
    '2 john': 63, '2john': 63, '2jn': 63, '2 jn': 63,
    '3 john': 64, '3john': 64, '3jn': 64, '3 jn': 64,
    'jude': 65, 'jud': 65,
    'revelation': 66, 'rev': 66,
  };
  
  return bookMap[bookName.toLowerCase()] || null;
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
