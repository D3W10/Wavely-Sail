import { NextApiRequest, NextApiResponse } from "next";
import { find_lyrics } from "@brandond/findthelyrics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method != "POST")
            res.status(405).json({ success: false, value: "Method not allowed" });
        else if (!req.body.query)
            res.status(400).json({ success: false, value: "Query missing" });
        else {
            const lyrics = await find_lyrics(req.body.query);

            res.status(200).json({ success: !(lyrics instanceof Error), value: lyrics });
        }
    }
    catch {
        res.status(500).json({ success: false, value: "Unknown error" });
    }
}