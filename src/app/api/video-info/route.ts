/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { VideoInfo, VideoFormat } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid or missing YouTube URL' },
        { status: 400 }
      );
    }

    const info = await ytdl.getInfo(url);
    const formats = info.formats
      .filter((format) => format.hasVideo || format.hasAudio)
      .map((format): VideoFormat => ({
        itag: format.itag,
        quality: format.qualityLabel || `${format.audioBitrate}kbps`,
        format: format.mimeType?.split(';')[0] || 'unknown',
        size: format.contentLength
          ? `${Math.round(parseInt(format.contentLength) / (1024 * 1024))} MB`
          : 'Unknown',
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo,
        container: format.container,
      }))
      .sort((a, b) => {
        if (a.hasVideo && !b.hasVideo) return -1;
        if (!a.hasVideo && b.hasVideo) return 1;
        return 0;
      });

    const videoInfo: VideoInfo = {
      title: info.videoDetails.title,
      thumbnail:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          .url,
      duration: new Date(parseInt(info.videoDetails.lengthSeconds) * 1000)
        .toISOString()
        .substr(11, 8),
      author: info.videoDetails.author.name,
      viewCount: parseInt(info.videoDetails.viewCount).toLocaleString(),
      formats,
    };

    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error('Error fetching video info:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (error instanceof Error && (error as any).statusCode === 410) {
      return NextResponse.json({ 
        error: 'Video is not available or region-restricted. Please try another video or check if the URL is correct.',
        details: errorMessage 
      }, { status: 410 });
    }
    
    if (error instanceof Error && (error as any).statusCode === 403) {
      return NextResponse.json({ 
        error: 'Access denied. This video might be private or restricted.',
        details: errorMessage 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch video information. Please try again later.',
      details: errorMessage 
    }, { status: 500 });
  }
}