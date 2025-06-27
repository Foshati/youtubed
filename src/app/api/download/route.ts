// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const itag = searchParams.get("itag");

    if (!url || !ytdl.validateURL(url)) {
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

    const info = await ytdl.getInfo(url);
    const format = info.formats.find((f) => f.itag === parseInt(itag));

    if (!format) {
      return NextResponse.json({ error: "Format not found" }, { status: 404 });
    }

    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
    const filename = `${title}.${format.container}`;

    // Create a readable stream
    const stream = ytdl(url, { format });

    // Convert the stream to a Response
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });

        stream.on("end", () => {
          controller.close();
        });

        stream.on("error", (error) => {
          console.error("Stream error:", error);
          controller.error(error);
        });
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": format.mimeType || "video/mp4",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
