import { NextRequest, NextResponse } from 'next/server';
import { getChapter, getNextChapter, getPreviousChapter } from '@/lib/sword-bible';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookNumber, chapter, direction } = body;

    if (!bookNumber || !chapter || !direction) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get next or previous chapter
    const targetChapter = direction === 'next' 
      ? getNextChapter(bookNumber, chapter)
      : getPreviousChapter(bookNumber, chapter);

    // Fetch the chapter
    const fullChapter = await getChapter(targetChapter.bookNumber, targetChapter.chapter);

    if (fullChapter.length === 0) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fullChapter,
      bookNumber: targetChapter.bookNumber,
      chapterNumber: targetChapter.chapter,
    });
  } catch (error) {
    console.error('Error navigating chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
