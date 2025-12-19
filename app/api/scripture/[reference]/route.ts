import { NextRequest, NextResponse } from 'next/server';
import { getVerse } from '@/lib/sword-bible';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    
    // Use local Sword module (NET translation)
    const verse = await getVerse(reference);
    
    if (verse) {
      return NextResponse.json({
        reference: verse.reference,
        text: verse.text,
        fullChapter: verse.fullChapter || [],
        requestedVerses: verse.requestedVerses || [],
        bookNumber: verse.bookNumber,
        chapterNumber: verse.chapterNumber,
      });
    }

    return NextResponse.json(
      { error: 'Passage not found', reference },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching scripture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
