import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid or missing YouTube URL' }, { status: 400 });
    }

    const info = await ytdl.getInfo(url);
    
    const videoDetails = {
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: info.formats
        .filter(f => f.hasAudio && f.hasVideo)
        .map(f => ({
          qualityLabel: f.qualityLabel,
          container: f.container,
          url: f.url,
          itag: f.itag
        })),
       audioFormats: info.formats
        .filter(f => f.hasAudio && !f.hasVideo)
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))
        .map(f => ({
            audioBitrate: f.audioBitrate,
            container: f.container,
            url: f.url,
            itag: f.itag
        }))
    };

    return NextResponse.json(videoDetails);
  } catch (error) {
    console.error('Error fetching video info:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch video information', details: errorMessage }, { status: 500 });
  }
}
