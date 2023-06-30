import { NextApiRequest, NextApiResponse } from "next";
import process from "process";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method != "POST")
            res.status(405).json({ success: false, value: "Method not allowed" });
        else if (!req.body.query)
            res.status(400).json({ success: false, value: "Query missing" });
        else {
            let spotifyBearer = await (await fetch(`https://accounts.spotify.com/api/token?` + new URLSearchParams({
                "grant_type": "client_credentials",
                "client_id": process.env.CLIENT_ID as string,
                "client_secret": process.env.CLIENT_SECRET as string
            }), {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })).json();

            let spotifyData = await (await fetch("https://api.spotify.com/v1/search?" + new URLSearchParams({
                "q": req.body.query,
                "type": "track",
                "market": "US",
                "limit": "10",
                "offset": "0"
            }), {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Bearer " + spotifyBearer.access_token
                }
            })).json();

            res.status(200).json({ success: true, value: spotifyData.tracks.items });
        }
    }
    catch {
        res.status(500).json({ success: false, value: "Unknown error" });
    }
}