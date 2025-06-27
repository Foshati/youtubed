import { NextApiRequest, NextApiResponse } from "next";
import ytdl from "ytdl-core";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, itag } = req.query;

  if (!url || !ytdl.validateURL(url as string)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(url as string);
    const format = info.formats.find(
      (f) => f.itag === parseInt(itag as string)
    );

    if (!format) {
      return res.status(404).json({ error: "Format not found" });
    }

    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
    const filename = `${title}.${format.container}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", format.mimeType || "video/mp4");

    const stream = ytdl(url as string, { format });
    stream.pipe(res);

    stream.on("error", (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Download failed" });
    }
  }
}
