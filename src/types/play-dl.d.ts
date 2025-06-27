// src/types/play-dl.d.ts
declare module 'play-dl' {
    export interface VideoDetails {
        title?: string;
        thumbnails?: Array<{
            url: string;
            width?: number;
            height?: number;
        }>;
        durationInSec?: number;
        channel?: {
            name?: string;
            id?: string;
        };
        viewCount?: number;
    }

    export interface InfoData {
        video_details?: VideoDetails;
    }

    export interface StreamFormat {
        url: string;
        quality?: string;
        qualityLabel?: string;
        contentLength?: string;
        mimeType?: string;
    }

    export interface Stream {
        url?: string;
        format?: StreamFormat[];
    }

    export function yt_validate(url: string): boolean;
    export function video_info(url: string): Promise<InfoData | null>;
    export function stream(url: string): Promise<Stream>;
}