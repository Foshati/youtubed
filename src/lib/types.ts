// src/lib/types.ts
export interface VideoInfo {
    title: string;
    thumbnail: string;
    duration: string;
    author: string;
    viewCount: string;
    formats: VideoFormat[];
}

export interface VideoFormat {
    itag: number;
    quality: string;
    format: string;
    size?: string;
    hasAudio: boolean;
    hasVideo: boolean;
    container: string;
    url?: string; // Added for direct stream URL
}