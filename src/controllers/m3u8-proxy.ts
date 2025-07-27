import axios from "axios";
import { Request, Response } from "express";
import { allowedExtensions, LineTransform } from "../utils/line-transform";

export const m3u8Proxy = async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json("url is required");

    const isStaticFiles = allowedExtensions.some(ext => url.endsWith(ext));
    const baseUrl = url.replace(/[^/]+$/, "");

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        Accept: "*/*",
        Referer: "https://megaplay.buzz/stream/s-2/steinsgate-3?ep=230/dub",
        Origin: "https://megaplay.buzz/stream/s-2/steinsgate-3?ep=230/dub"
      }
    });

    const headers = { ...response.headers };
    if (!isStaticFiles) delete headers['content-length'];

    res.cacheControl = { maxAge: headers['cache-control'] };
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Headers"] = "*";
    headers["Access-Control-Allow-Methods"] = "*"
    res.set(headers);

    if (isStaticFiles) {
      return response.data.pipe(res);
    }

    const transform = new LineTransform(baseUrl);
    response.data.pipe(transform).pipe(res);
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}