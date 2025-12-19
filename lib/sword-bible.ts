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
  fullChapter?: ChapterVerse[];
  requestedVerses?: number[];
  bookNumber?: number;
  chapterNumber?: number;
}

interface ChapterVerse {
  number: number;
  text: string;
}

interface BibleBook {
  name: string;
  number: number;
  chapters: number;
}

// All 66 books of the Bible with chapter counts
const BIBLE_BOOKS: BibleBook[] = [
  { name: 'Genesis', number: 1, chapters: 50 },
  { name: 'Exodus', number: 2, chapters: 40 },
  { name: 'Leviticus', number: 3, chapters: 27 },
  { name: 'Numbers', number: 4, chapters: 36 },
  { name: 'Deuteronomy', number: 5, chapters: 34 },
  { name: 'Joshua', number: 6, chapters: 24 },
  { name: 'Judges', number: 7, chapters: 21 },
  { name: 'Ruth', number: 8, chapters: 4 },
  { name: '1 Samuel', number: 9, chapters: 31 },
  { name: '2 Samuel', number: 10, chapters: 24 },
  { name: '1 Kings', number: 11, chapters: 22 },
  { name: '2 Kings', number: 12, chapters: 25 },
  { name: '1 Chronicles', number: 13, chapters: 29 },
  { name: '2 Chronicles', number: 14, chapters: 36 },
  { name: 'Ezra', number: 15, chapters: 10 },
  { name: 'Nehemiah', number: 16, chapters: 13 },
  { name: 'Esther', number: 17, chapters: 10 },
  { name: 'Job', number: 18, chapters: 42 },
  { name: 'Psalms', number: 19, chapters: 150 },
  { name: 'Proverbs', number: 20, chapters: 31 },
  { name: 'Ecclesiastes', number: 21, chapters: 12 },
  { name: 'Song of Solomon', number: 22, chapters: 8 },
  { name: 'Isaiah', number: 23, chapters: 66 },
  { name: 'Jeremiah', number: 24, chapters: 52 },
  { name: 'Lamentations', number: 25, chapters: 5 },
  { name: 'Ezekiel', number: 26, chapters: 48 },
  { name: 'Daniel', number: 27, chapters: 12 },
  { name: 'Hosea', number: 28, chapters: 14 },
  { name: 'Joel', number: 29, chapters: 3 },
  { name: 'Amos', number: 30, chapters: 9 },
  { name: 'Obadiah', number: 31, chapters: 1 },
  { name: 'Jonah', number: 32, chapters: 4 },
  { name: 'Micah', number: 33, chapters: 7 },
  { name: 'Nahum', number: 34, chapters: 3 },
  { name: 'Habakkuk', number: 35, chapters: 3 },
  { name: 'Zephaniah', number: 36, chapters: 3 },
  { name: 'Haggai', number: 37, chapters: 2 },
  { name: 'Zechariah', number: 38, chapters: 14 },
  { name: 'Malachi', number: 39, chapters: 4 },
  { name: 'Matthew', number: 40, chapters: 28 },
  { name: 'Mark', number: 41, chapters: 16 },
  { name: 'Luke', number: 42, chapters: 24 },
  { name: 'John', number: 43, chapters: 21 },
  { name: 'Acts', number: 44, chapters: 28 },
  { name: 'Romans', number: 45, chapters: 16 },
  { name: '1 Corinthians', number: 46, chapters: 16 },
  { name: '2 Corinthians', number: 47, chapters: 13 },
  { name: 'Galatians', number: 48, chapters: 6 },
  { name: 'Ephesians', number: 49, chapters: 6 },
  { name: 'Philippians', number: 50, chapters: 4 },
  { name: 'Colossians', number: 51, chapters: 4 },
  { name: '1 Thessalonians', number: 52, chapters: 5 },
  { name: '2 Thessalonians', number: 53, chapters: 3 },
  { name: '1 Timothy', number: 54, chapters: 6 },
  { name: '2 Timothy', number: 55, chapters: 4 },
  { name: 'Titus', number: 56, chapters: 3 },
  { name: 'Philemon', number: 57, chapters: 1 },
  { name: 'Hebrews', number: 58, chapters: 13 },
  { name: 'James', number: 59, chapters: 5 },
  { name: '1 Peter', number: 60, chapters: 5 },
  { name: '2 Peter', number: 61, chapters: 3 },
  { name: '1 John', number: 62, chapters: 5 },
  { name: '2 John', number: 63, chapters: 1 },
  { name: '3 John', number: 64, chapters: 1 },
  { name: 'Jude', number: 65, chapters: 1 },
  { name: 'Revelation', number: 66, chapters: 22 },
];

// Get next chapter with infinite looping (Revelation 22 → Genesis 1)
export function getNextChapter(bookNumber: number, chapter: number): { bookNumber: number; chapter: number } {
  const book = BIBLE_BOOKS.find(b => b.number === bookNumber);
  if (!book) return { bookNumber: 1, chapter: 1 };
  
  // If not last chapter of book, go to next chapter
  if (chapter < book.chapters) {
    return { bookNumber, chapter: chapter + 1 };
  }
  
  // Last chapter of book - go to first chapter of next book
  if (bookNumber < 66) {
    return { bookNumber: bookNumber + 1, chapter: 1 };
  }
  
  // Revelation 22 - wrap to Genesis 1
  return { bookNumber: 1, chapter: 1 };
}

// Get previous chapter with infinite looping (Genesis 1 → Revelation 22)
export function getPreviousChapter(bookNumber: number, chapter: number): { bookNumber: number; chapter: number } {
  // If not first chapter of book, go to previous chapter
  if (chapter > 1) {
    return { bookNumber, chapter: chapter - 1 };
  }
  
  // First chapter of book - go to last chapter of previous book
  if (bookNumber > 1) {
    const prevBook = BIBLE_BOOKS.find(b => b.number === bookNumber - 1);
    if (prevBook) {
      return { bookNumber: prevBook.number, chapter: prevBook.chapters };
    }
  }
  
  // Genesis 1 - wrap to Revelation 22
  return { bookNumber: 66, chapter: 22 };
}

// Fetch entire chapter from Bolls.life API
export async function getChapter(bookNumber: number, chapter: number): Promise<ChapterVerse[]> {
  const verses: ChapterVerse[] = [];
  let verseNum = 1;
  
  // Loop until we get a 404 (no more verses in chapter)
  while (true) {
    try {
      const url = `https://bolls.life/get-verse/NET/${bookNumber}/${chapter}/${verseNum}/`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // 404 means no more verses in this chapter
        break;
      }
      
      const data = await response.json();
      if (data?.text) {
        verses.push({
          number: verseNum,
          text: data.text.trim()
        });
        verseNum++;
      } else {
        break;
      }
    } catch (error) {
      console.error(`Error fetching verse ${bookNumber}:${chapter}:${verseNum}:`, error);
      break;
    }
  }
  
  return verses;
}

// NET Bible verse lookup using Bolls.life API (official NET Bible text)
// Returns requested verse(s) plus full chapter data for expansion
export async function getVerse(reference: string): Promise<Verse | null> {
  try {
    const parsedRef = parseReference(reference);
    if (!parsedRef) {
      console.error('Invalid verse reference format:', reference);
      return null;
    }

    const { bookNumber, chapter, verse, endVerse } = parsedRef;
    
    // Fetch entire chapter
    const fullChapter = await getChapter(bookNumber, chapter);
    
    if (fullChapter.length === 0) {
      return null;
    }
    
    // Extract requested verse(s) text
    const requestedVerses: number[] = [];
    const verseTexts: string[] = [];
    const endV = endVerse || verse;
    
    for (let v = verse; v <= endV; v++) {
      const chapterVerse = fullChapter.find(cv => cv.number === v);
      if (chapterVerse) {
        requestedVerses.push(v);
        verseTexts.push(chapterVerse.text);
      }
    }
    
    if (verseTexts.length === 0) {
      return null;
    }
    
    return {
      reference,
      text: verseTexts.join(' '),
      fullChapter,
      requestedVerses,
      bookNumber,
      chapterNumber: chapter
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
    'joel': 29,
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
