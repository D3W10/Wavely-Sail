import { NextApiRequest, NextApiResponse } from "next";
import NodeID3 from "node-id3";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method != "POST")
            res.status(405).json({ value: "Method not allowed" });
        else if (!req.body.title)
            res.status(400).json({ value: "Title missing" });
        else if (!req.body.artist)
            res.status(400).json({ value: "Artist missing" });
        else if (!req.body.album)
            res.status(400).json({ value: "Album missing" });
        else {
            let tags: NodeID3.Tags = {
                title: req.body.title,
                artist: req.body.artist,
                album: req.body.album,
                performerInfo: req.body.artist,
                unsynchronisedLyrics: {
                    language: "eng",
                    text: req.body.lyrics
                }
            }

            if (req.body.artwork) {
                tags.image = {
                    mime: "image/jpeg",
                    type: {
                        id: 0,
                        name: "other"
                    },
                    description: "",
                    imageBuffer: Buffer.from(await (await (await fetch(req.body.artwork as string)).blob()).arrayBuffer())
                }
            }

            res.status(200).send(/*await NodeID3.Promise.write(tags, audioBuffer)*/0);
        }
    }
    catch {
        res.status(500).json({ value: "Unknown error" });
    }
}