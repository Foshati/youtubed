import { NextRequest, NextResponse } from "next/server";
import { stream, video_info, yt_validate } from 'play-dl';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const itag = searchParams.get("itag");

    if (!url || !yt_validate(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    if (!itag) {
      return NextResponse.json(
        { error: "Missing itag parameter" },
        { status: 400 }
      );
    }

    // Get video info for title
    const info = await video_info(url);
    if (!info || info.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoDetails = info[0];
    const title = videoDetails.video_details.title?.replace(/[^\w\s]/gi, "") || "video";

    // Get stream info
    const streamInfo = await stream(url);
    
    let streamUrl: string;
    let filename: string;
    let contentType: string;

    const itagNum = parseInt(itag);
    
    if (itagNum >= 2000) {
      // Audio only
      if (streamInfo.format.length === 0) {
        return NextResponse.json({ error: "No audio stream available" }, { status: 404 });
      }
      streamUrl = streamInfo.format[0].url;
      filename = `${title}.mp4`;
      contentType = "audio/mp4";
    } else {
      // Video format
      const formatIndex = itagNum - 1000;
      if (!streamInfo.format[formatIndex]) {
        return NextResponse.json({ error: "Format not found" }, { status: 404 });
      }
      streamUrl = streamInfo.format[formatIndex].url;
      filename = `${title}.mp4`;
      contentType = "video/mp4";
    }

    // Fetch the stream
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.status}`);
    }

    // Create headers for download
    const headers = new Headers({
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    });

    // Add content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(response.body, {
      headers
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ 
      error: "Download failed. Please try again later.",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}