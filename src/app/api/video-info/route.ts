/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { video_info, stream, yt_validate } from 'play-dl';
import { VideoInfo, VideoFormat } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !yt_validate(url)) {
      return NextResponse.json(
        { error: 'Invalid or missing YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info
    const info = await video_info(url);
    
    if (!info) {
      return NextResponse.json(
        { error: 'Video not found or not available' },
        { status: 404 }
      );
    }

    // Get stream info for formats
    const streamInfo = await stream(url);
    
    const formats: VideoFormat[] = [];

    // Check if streamInfo has format property (for video formats)
    if ((streamInfo as any).format && Array.isArray((streamInfo as any).format)) {
      (streamInfo as any).format.forEach((format: any, index: number) => {
        if (format.url) {
          formats.push({
            itag: index + 1000, // Custom itag for video formats
            quality: format.quality || format.qualityLabel || 'Unknown',
            format: 'video/mp4',
            size: format.contentLength ? `${Math.round(parseInt(format.contentLength) / (1024 * 1024))} MB` : 'Unknown',
            hasAudio: true,
            hasVideo: true,
            container: 'mp4',
            url: format.url
          });
        }
      });
    }

    // Add audio format if available (streamInfo.url for audio stream)
    if ((streamInfo as any).url) {
      formats.push({
        itag: 2000, // Custom itag for audio only
        quality: 'Audio Only',
        format: 'audio/mp4',
        size: 'Unknown',
        hasAudio: true,
        hasVideo: false,
        container: 'mp4',
        url: (streamInfo as any).url
      });
    }

    // If no formats found, try alternative approach
    if (formats.length === 0) {
      // Add a basic audio format
      formats.push({
        itag: 2000,
        quality: 'Audio Only',
        format: 'audio/mp4',
        size: 'Unknown',
        hasAudio: true,
        hasVideo: false,
        container: 'mp4'
      });
    }

    const videoInfo: VideoInfo = {
      title: (info as any).video_details?.title || 'Unknown Title',
      thumbnail: (info as any).video_details?.thumbnails?.[0]?.url || '',
      duration: formatDuration((info as any).video_details?.durationInSec || 0),
      author: (info as any).video_details?.channel?.name || 'Unknown',
      viewCount: (info as any).video_details?.viewCount?.toLocaleString() || '0',
      formats: formats.slice(0, 10) // Limit to 10 formats
    };

    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error('Error fetching video info:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch video information. Please check the URL and try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}