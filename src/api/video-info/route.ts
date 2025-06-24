// pages/api/video-info.ts
import { NextApiRequest, NextApiResponse } from "next";
import ytdl from "ytdl-core";

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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VideoInfo | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(url);
    const formats = info.formats
      .filter((format) => format.hasVideo || format.hasAudio)
      .map((format) => ({
        itag: format.itag,
        quality: format.qualityLabel || format.audioBitrate + "kbps",
        format: format.mimeType?.split(";")[0] || "unknown",
        size: format.contentLength
          ? Math.round(parseInt(format.contentLength) / (1024 * 1024)) + " MB"
          : "Unknown",
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

    res.status(200).json(videoInfo);
  } catch (error) {
    console.error("Error fetching video info:", error);
    res.status(500).json({ error: "Failed to fetch video information" });
  }
}
