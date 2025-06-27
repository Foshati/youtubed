/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/VideoDownloader.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Play, Clock, Eye, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { VideoFormat, VideoInfo } from "@/lib/types";

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Function to clean and validate YouTube URL
  const cleanYouTubeUrl = (inputUrl: string): string => {
    try {
      inputUrl = inputUrl.trim();
      
      // Handle different YouTube URL formats
      if (inputUrl.includes('youtu.be/')) {
        const videoId = inputUrl.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
      
      if (inputUrl.includes('youtube.com/watch')) {
        const url = new URL(inputUrl);
        const videoId = url.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
      
      if (inputUrl.includes('youtube.com/') && !inputUrl.includes('watch?v=')) {
        // Handle other YouTube formats
        return inputUrl;
      }
      
      return inputUrl;
    } catch {
      return inputUrl;
    }
  };

  const fetchVideoInfo = async (): Promise<void> => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    const cleanedUrl = cleanYouTubeUrl(url.trim());
    setLoading(true);
    setError("");
    setSuccess("");
    setVideoInfo(null);

    try {
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: cleanedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video information");
      }

      setVideoInfo(data);
      setUrl(cleanedUrl);
      setSuccess("Video information loaded successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (format: VideoFormat): Promise<void> => {
    if (!videoInfo) return;
    
    setDownloading(format.itag);
    setError("");
    setSuccess("");

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&itag=${format.itag}`;

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${videoInfo.title.replace(/[^\w\s]/gi, "")}.${format.container}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Started downloading: ${format.quality}`);
      
      // Reset downloading state after a delay
      setTimeout(() => {
        setDownloading(null);
      }, 3000);
    } catch (err) {
      setError("Download failed. Please try again.");
      setDownloading(null);
      console.error('Download error:', err);
    }
  };

  const getQualityBadgeColor = (quality: string): string => {
    if (quality.includes("1080p") || quality.includes("4K"))
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (quality.includes("720p")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (quality.includes("480p")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    if (quality.includes("Audio")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            YouTube Video Downloader
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
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
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
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
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
                </div>
              </div>
            )}
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
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {videoInfo.title}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
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

        {videoInfo && videoInfo.formats.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Available Download Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {videoInfo.formats.map((format) => (
                  <div
                    key={format.itag}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {format.format}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{format.size || 'Unknown size'}</span>
                        <div className="flex gap-2">
                          {format.hasVideo && (
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs">
                              Video
                            </span>
                          )}
                          {format.hasAudio && (
                            <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs">
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