import { NextApiRequest, NextApiResponse } from "next";
import ytdl from "ytdl-core";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method != "POST")
            res.status(405).json({ success: false, value: "Method not allowed" });
        else if (!req.body.url)
            res.status(400).json({ success: false, value: "URL missing" });
        else {
            res.status(200).send(await new Promise((resolve, reject) => {
                const audioStream = ytdl(req.body.url as string, { filter: "audioonly" });
                const chunks: Array<Buffer> = [];

                audioStream.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                audioStream.on("end", () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });

                audioStream.on("error", (err) => {
                    reject(err);
                });
            }));
        }
    }
    catch {
        res.status(500).json({ success: false, value: "Unknown error" });
    }
}