/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/VideoDownloader.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Play, Clock, Eye, User, Loader2 } from "lucide-react";
import { VideoFormat, VideoInfo } from "@/lib/types";

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  const fetchVideoInfo = async (): Promise<void> => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setVideoInfo(null);

    try {
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video information");
      }

      setVideoInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (format: VideoFormat): Promise<void> => {
    setDownloading(format.itag);

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&itag=${
        format.itag
      }`;

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${videoInfo?.title || "video"}.${format.container}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (size: string): string => {
    if (size === "Unknown") return size;
    return size;
  };

  const getQualityBadgeColor = (quality: string): string => {
    if (quality.includes("1080p") || quality.includes("4K"))
      return "bg-green-100 text-green-800";
    if (quality.includes("720p")) return "bg-blue-100 text-blue-800";
    if (quality.includes("480p")) return "bg-yellow-100 text-yellow-800";
    if (quality.includes("kbps")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            YouTube Video Downloader
          </h1>
          <p className="text-gray-600 text-lg">
            Download YouTube videos in multiple formats and qualities
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Enter YouTube URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && fetchVideoInfo()}
              />
              <Button
                onClick={fetchVideoInfo}
                disabled={loading}
                className="px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Get Video Info"
                )}
              </Button>
            </div>
            {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
          </CardContent>
        </Card>

        {videoInfo && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full rounded-lg shadow-md"
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {videoInfo.title}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{videoInfo.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{videoInfo.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{videoInfo.viewCount} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {videoInfo && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Available Download Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {videoInfo.formats.map((format) => (
                  <div
                    key={format.itag}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(
                            format.quality
                          )}`}
                        >
                          {format.quality}
                        </span>
                        <span className="text-sm text-gray-600">
                          {format.format}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{format.size}</span>
                        <div className="flex gap-2">
                          {format.hasVideo && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              Video
                            </span>
                          )}
                          {format.hasAudio && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                              Audio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadVideo(format)}
                      disabled={downloading === format.itag}
                      variant="outline"
                      size="sm"
                    >
                      {downloading === format.itag ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoDownloader;
