import { NextApiRequest, NextApiResponse } from "next";
import ytdl from "ytdl-core";

function tryValidate(func: (url: string) => boolean, url: string) {
    try {
        return func(url);
    }
    catch {
        return false;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method != "GET")
            res.status(405).json({ success: false, value: "Method not allowed" });
        else if (!req.query.url)
            res.status(400).json({ success: false, value: "URL missing" });
        else
            res.status(200).json({ success: tryValidate(ytdl.validateURL, req.query.url as string) ? (await ytdl.getInfo(req.query.url as string)).videoDetails.title : null });
    }
    catch (error) {
        res.status(500).json({ success: false, value: "Unknown error" });
    }
}