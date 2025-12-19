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

// NET Bible verse lookup using API.Bible
export async function getVerse(reference: string): Promise<Verse | null> {
  try {
    const apiKey = process.env.BIBLE_API_KEY;
    if (!apiKey) {
      console.error('BIBLE_API_KEY not configured');
      return null;
    }

    // NET Bible translation ID for API.Bible
    const NET_BIBLE_ID = '06125adad2d5898a-01';
    
    // Convert reference format: "John 3:16" -> "JHN.3.16"
    const verseId = convertReferenceToVerseId(reference);
    if (!verseId) {
      console.error('Invalid verse reference format:', reference);
      return null;
    }

    const url = `https://api.scripture.api.bible/v1/bibles/${NET_BIBLE_ID}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
    
    const response = await fetch(url, {
      headers: {
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error('API.Bible error:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    if (data?.data?.content) {
      return {
        reference: data.data.reference || reference,
        text: data.data.content.trim()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
}

// Convert "Book Chapter:Verse" to API.Bible verse ID format
function convertReferenceToVerseId(reference: string): string | null {
  try {
    // Handle ranges like "John 3:16-17" -> just use first verse
    const cleanRef = reference.split('-')[0].trim();
    
    // Parse "Book Chapter:Verse"
    const match = cleanRef.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)$/);
    if (!match) return null;
    
    const [, book, chapter, verse] = match;
    const bookCode = getBookCode(book.trim());
    if (!bookCode) return null;
    
    return `${bookCode}.${chapter}.${verse}`;
  } catch (error) {
    console.error('Error converting reference:', error);
    return null;
  }
}

// Map book names to API.Bible book codes
function getBookCode(bookName: string): string | null {
  const bookMap: Record<string, string> = {
    'genesis': 'GEN', 'gen': 'GEN',
    'exodus': 'EXO', 'exo': 'EXO', 'ex': 'EXO',
    'leviticus': 'LEV', 'lev': 'LEV',
    'numbers': 'NUM', 'num': 'NUM',
    'deuteronomy': 'DEU', 'deut': 'DEU', 'deu': 'DEU',
    'joshua': 'JOS', 'josh': 'JOS', 'jos': 'JOS',
    'judges': 'JDG', 'judg': 'JDG', 'jdg': 'JDG',
    'ruth': 'RUT', 'rut': 'RUT',
    '1 samuel': '1SA', '1samuel': '1SA', '1sam': '1SA', '1 sam': '1SA',
    '2 samuel': '2SA', '2samuel': '2SA', '2sam': '2SA', '2 sam': '2SA',
    '1 kings': '1KI', '1kings': '1KI', '1ki': '1KI', '1 ki': '1KI',
    '2 kings': '2KI', '2kings': '2KI', '2ki': '2KI', '2 ki': '2KI',
    '1 chronicles': '1CH', '1chronicles': '1CH', '1chr': '1CH', '1 chr': '1CH',
    '2 chronicles': '2CH', '2chronicles': '2CH', '2chr': '2CH', '2 chr': '2CH',
    'ezra': 'EZR', 'ezr': 'EZR',
    'nehemiah': 'NEH', 'neh': 'NEH',
    'esther': 'EST', 'est': 'EST',
    'job': 'JOB',
    'psalm': 'PSA', 'psalms': 'PSA', 'ps': 'PSA', 'psa': 'PSA',
    'proverbs': 'PRO', 'prov': 'PRO', 'pro': 'PRO',
    'ecclesiastes': 'ECC', 'eccl': 'ECC', 'ecc': 'ECC',
    'song of solomon': 'SNG', 'song': 'SNG', 'sng': 'SNG',
    'isaiah': 'ISA', 'isa': 'ISA',
    'jeremiah': 'JER', 'jer': 'JER',
    'lamentations': 'LAM', 'lam': 'LAM',
    'ezekiel': 'EZK', 'ezek': 'EZK', 'ezk': 'EZK',
    'daniel': 'DAN', 'dan': 'DAN',
    'hosea': 'HOS', 'hos': 'HOS',
    'joel': 'JOL', 'joel': 'JOL',
    'amos': 'AMO', 'amo': 'AMO',
    'obadiah': 'OBA', 'obad': 'OBA', 'oba': 'OBA',
    'jonah': 'JON', 'jon': 'JON',
    'micah': 'MIC', 'mic': 'MIC',
    'nahum': 'NAM', 'nah': 'NAM', 'nam': 'NAM',
    'habakkuk': 'HAB', 'hab': 'HAB',
    'zephaniah': 'ZEP', 'zeph': 'ZEP', 'zep': 'ZEP',
    'haggai': 'HAG', 'hag': 'HAG',
    'zechariah': 'ZEC', 'zech': 'ZEC', 'zec': 'ZEC',
    'malachi': 'MAL', 'mal': 'MAL',
    'matthew': 'MAT', 'matt': 'MAT', 'mat': 'MAT', 'mt': 'MAT',
    'mark': 'MRK', 'mrk': 'MRK', 'mk': 'MRK',
    'luke': 'LUK', 'luk': 'LUK', 'lk': 'LUK',
    'john': 'JHN', 'jhn': 'JHN', 'jn': 'JHN',
    'acts': 'ACT', 'act': 'ACT',
    'romans': 'ROM', 'rom': 'ROM',
    '1 corinthians': '1CO', '1corinthians': '1CO', '1cor': '1CO', '1 cor': '1CO',
    '2 corinthians': '2CO', '2corinthians': '2CO', '2cor': '2CO', '2 cor': '2CO',
    'galatians': 'GAL', 'gal': 'GAL',
    'ephesians': 'EPH', 'eph': 'EPH',
    'philippians': 'PHP', 'phil': 'PHP', 'php': 'PHP',
    'colossians': 'COL', 'col': 'COL',
    '1 thessalonians': '1TH', '1thessalonians': '1TH', '1thess': '1TH', '1 thess': '1TH',
    '2 thessalonians': '2TH', '2thessalonians': '2TH', '2thess': '2TH', '2 thess': '2TH',
    '1 timothy': '1TI', '1timothy': '1TI', '1tim': '1TI', '1 tim': '1TI',
    '2 timothy': '2TI', '2timothy': '2TI', '2tim': '2TI', '2 tim': '2TI',
    'titus': 'TIT', 'tit': 'TIT',
    'philemon': 'PHM', 'phlm': 'PHM', 'phm': 'PHM',
    'hebrews': 'HEB', 'heb': 'HEB',
    'james': 'JAS', 'jas': 'JAS', 'jas': 'JAS',
    '1 peter': '1PE', '1peter': '1PE', '1pet': '1PE', '1 pet': '1PE',
    '2 peter': '2PE', '2peter': '2PE', '2pet': '2PE', '2 pet': '2PE',
    '1 john': '1JN', '1john': '1JN', '1jn': '1JN', '1 jn': '1JN',
    '2 john': '2JN', '2john': '2JN', '2jn': '2JN', '2 jn': '2JN',
    '3 john': '3JN', '3john': '3JN', '3jn': '3JN', '3 jn': '3JN',
    'jude': 'JUD', 'jud': 'JUD',
    'revelation': 'REV', 'rev': 'REV',
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
