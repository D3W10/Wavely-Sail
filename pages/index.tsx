import { MutableRefObject, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { FFmpeg, createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import NodeID3 from "node-id3";

import Icon, { Icons } from "./components/Icons";
import DrawerArtwork from "./components/DrawerArtwork";

export default function Home() {
    const ffmpeg: MutableRefObject<FFmpeg> = useRef() as MutableRefObject<FFmpeg>;
    const artworkCooldown: MutableRefObject<NodeJS.Timeout | undefined> = useRef();
    const lyricsCooldown: MutableRefObject<NodeJS.Timeout | undefined> = useRef();
    const artworkRoot: MutableRefObject<ReactDOM.Root | undefined> = useRef();
    const artworkObjURLs: MutableRefObject<string[]> = useRef([]);

    const [ytUrl, setYtUrl] = useState("");
    const [getEndSubText, setEndSubText] = useState("Obtaining Song");
    const [getEndSubTextPerc, setEndSubTextPerc] = useState("");

    useEffect(() => {
        (async () => {
            ffmpeg.current = createFFmpeg({
                corePath: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
            });

            ffmpeg.current.setProgress(({ ratio }) => {
                setEndSubTextPerc(" " + Math.round(ratio * 100) + "%");
            });

            await ffmpeg.current.load();
        })();

        (document.getElementById("setupScreen") as HTMLDivElement).classList.add("opacity-100");
    }, []);

    //#region Common

    const [isNotiHidden, setNotiHidden] = useState(true);
    const [isNotiInvisible, setNotiInvisible] = useState(true);
    const [getNotiTitle, setNotiTitle] = useState("Title");
    const [getNotiBody, setNotiBody] = useState("Body");

    async function pageSwitch(from: string, to: string) {
        (document.getElementById(from) as HTMLDivElement).classList.remove("opacity-100");
        await sleep(300);
        (document.getElementById(from) as HTMLDivElement).classList.remove("flex");
        (document.getElementById(from) as HTMLDivElement).classList.add("hidden");
        (document.getElementById(to) as HTMLDivElement).classList.remove("hidden");
        (document.getElementById(to) as HTMLDivElement).classList.add("flex");
        await sleep(50);
        (document.getElementById(to) as HTMLDivElement).classList.add("opacity-100");
    }

    async function notificationOpen(title: string, text: string) {
        if (!isNotiHidden)
            await notificationClose();

        setNotiHidden(false);
        await sleep(50);
        setNotiInvisible(false);
        setNotiTitle(title);
        setNotiBody(text);
    }

    async function notificationClose() {
        setNotiInvisible(true);
        await sleep(300);
        setNotiHidden(true);
    }

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //#endregion

    //#region Setup

    const [isSubmitDisabled, setSubmitDisabled] = useState(true);
    const [getUrlInputValue, setUrlInputValue] = useState("");

    function onLinkInput(event: React.FormEvent<HTMLInputElement>) {
        setSubmitDisabled(event.currentTarget.value == "");
    }

    async function onYouTubeLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!/^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/g.test(getUrlInputValue))
            notificationOpen("Invalid URL", "The inserted URL is not a YouTube link.");
        else {
            await pageSwitch("setupScreen", "loadScreen");

            let urlCheck = await (await fetch("./api/get?" + new URLSearchParams({
                "url": getUrlInputValue
            }), {
                method: "GET"
            })).json();

            if (!urlCheck.success) {
                await pageSwitch("loadScreen", "setupScreen");
                notificationOpen("Download error", "Unable to get the music from that YouTube video");

                return;
            }

            setYtUrl(getUrlInputValue);
            await pageSwitch("loadScreen", "editorScreen");

            setUrlInputValue("");
            setSubmitDisabled(true);
        }
    }

    //#endregion

    //#region Editor

    const [getSongTitleValue, setSongTitleValue] = useState("");
    const [getSongArtistValue, setSongArtistValue] = useState("");
    const [getSongAlbumValue, setSongAlbumValue] = useState("");
    const [getSongArtworkValue, setSongArtworkValue] = useState("");
    const [getSongArtworkSrc, setSongArtworkSrc] = useState("");
    const [isSongArtworkDisplayHidden, setSongArtworkDisplayHidden] = useState(true);
    const [isSongArtworkDrawerHidden, setSongArtworkDrawerHidden] = useState(true);
    const [isSongArtworkDrawerInvisible, setSongArtworkDrawerInvisible] = useState(true);
    const [getSongLyricsSearchValue, setSongLyricsSearchValue] = useState("");
    const [isSongLyricsLoadHidden, setSongLyricsLoadHidden] = useState(true);
    const [getSongLyricsValue, setSongLyricsValue] = useState("");
    const [isSongLyricsModified, setSongLyricsModified] = useState(false);

    const openArtworkDrawer = async () => {
        setSongArtworkDrawerHidden(false);
        await sleep(50);
        setSongArtworkDrawerInvisible(false);
    }

    const closeArtworkDrawer = async () => {
        setSongArtworkDrawerInvisible(true);
        await sleep(300);
        setSongArtworkDrawerHidden(true);
    }

    async function onMetadataSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        await pageSwitch("editorScreen", "endScreen");

        try {
            let songBlob = await (await fetch("./api/download", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: ytUrl
                })
            })).blob();
    
            setEndSubText("Converting Song");

            ffmpeg.current.FS("writeFile", "song.webm", await fetchFile(songBlob));
            await ffmpeg.current.run("-i", "song.webm", "-y", "song.mp3");

            setEndSubTextPerc("");
            setEndSubText("Applying Metadata");

            const data = ffmpeg.current.FS("readFile", "song.mp3");

            const metadataTags: NodeID3.Tags = {
                title: getSongTitleValue,
                artist: getSongArtistValue,
                performerInfo: getSongArtistValue,
                album: getSongAlbumValue,
                image: getSongArtworkSrc != "" ? {
                    mime: "image/jpeg",
                    type: {
                        id: NodeID3.TagConstants.AttachedPicture.PictureType.FRONT_COVER
                    },
                    description: "",
                    imageBuffer: Buffer.from(await (await fetch(getSongArtworkSrc)).arrayBuffer())
                } : undefined,
                unsynchronisedLyrics: getSongLyricsValue != "" ? {
                    language: "eng",
                    text: getSongLyricsValue.replace(/\n/g, "\r")
                } : undefined
            }

            const encodedSong = await NodeID3.Promise.write(metadataTags, Buffer.from(data));

            setEndSubText("Downloading Song");

            const objectURL = URL.createObjectURL(
                new Blob([(await fetchFile(encodedSong)).buffer], { type: "audio/mpeg" })
            );

            let dlLink = document.createElement("a");
            dlLink.href = objectURL;
            dlLink.download = getSongTitleValue + ".mp3";
            dlLink.click();

            cleanEditorFields();

            await sleep(5000);
            await pageSwitch("endScreen", "setupScreen");
        }
        catch (error) {
            console.error(error);

            await pageSwitch("endScreen", "editorScreen");
        }

        setEndSubText("Obtaining Song");
        setEndSubTextPerc("");
    }

    function scrollDrawer(event: React.WheelEvent<HTMLDivElement>) {
        event.currentTarget.scroll({
            left: event.currentTarget.scrollLeft + event.deltaY * 2,
            behavior: "smooth"
        });
    }

    function searchArtwork(quick: boolean) {
        if (!artworkRoot.current)
            artworkRoot.current = ReactDOM.createRoot(document.getElementById("artworkDrawer")!);

        let searchStr = getSongArtworkValue != "" ? getSongArtworkValue : getSongTitleValue + " " + getSongArtistValue;
        if (searchStr.trim() == "")
            return;

        clearTimeout(artworkCooldown.current);
        artworkCooldown.current = setTimeout(async () => {
            let artworkData = await (await fetch("./api/artworks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: searchStr
                })
            })).json();

            if (artworkData.success && document.activeElement == document.getElementById("songArtwork")) {
                artworkObjURLs.current.map((url) => URL.revokeObjectURL(url));
                artworkObjURLs.current = await Promise.all(artworkData.value.map(async (item: any) => URL.createObjectURL(await (await fetch(item.album.images[0].url)).blob())));
                
                artworkRoot.current!.render(
                    <>
                        {
                            artworkObjURLs.current.map((item: any, index: number) => (
                                <DrawerArtwork key={index} src={item} onClick={artworkSelect} />
                            ))
                        }
                    </>
                );
    
                openArtworkDrawer();
            }
        }, !quick ? 800 : 0);
    }

    async function artworkSelect(event: React.MouseEvent<HTMLAnchorElement>) {
        if (getSongArtworkSrc != "")
            URL.revokeObjectURL(getSongArtworkSrc);

        setSongArtworkValue("");
        setSongArtworkSrc(URL.createObjectURL(await ((await fetch((event.currentTarget.children[0] as HTMLImageElement).src)).blob())));
        setSongArtworkDisplayHidden(false);

        artworkObjURLs.current.map((url) => URL.revokeObjectURL(url));
        artworkObjURLs.current = [];

        artworkRoot.current?.render(<></>);
    }

    async function searchLyrics(quick: boolean) {
        let searchStr = getSongLyricsSearchValue != "" ? getSongLyricsSearchValue : getSongArtistValue + " " + getSongTitleValue;
        if (searchStr.trim() == "" || (isSongLyricsModified && quick))
            return;

        setSongLyricsLoadHidden(false);
        clearTimeout(lyricsCooldown.current);
        lyricsCooldown.current = setTimeout(async () => {
            let lyricsData = await (await fetch("./api/lyrics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: searchStr
                })
            })).json();

            setSongLyricsLoadHidden(true);
            setSongLyricsValue(lyricsData.success ? lyricsData.value: "");
            setSongLyricsModified(false);
        }, !quick ? 800 : 0);
    }

    async function discardEditor() {
        await pageSwitch("editorScreen", "setupScreen");
        cleanEditorFields();
    }

    function cleanEditorFields() {
        setSongTitleValue("");
        setSongArtistValue("");
        setSongAlbumValue("");
        setSongArtworkValue("");
        setSongArtworkSrc("");
        setSongArtworkDisplayHidden(true);
        setSongArtworkDrawerHidden(true);
        setSongArtworkDrawerInvisible(true);
        setSongLyricsSearchValue("");
        setSongLyricsLoadHidden(true);
        setSongLyricsValue("");
        setSongLyricsModified(false);
    }

    //#endregion

    return (
        <main className="min-h-screen flex flex-col justify-center items-center p-6">
            <div id="notification" className={"absolute top-5 left-5 md:left-auto right-5 p-4 rounded-md bg-white dark:bg-black shadow-lg ring-1 ring-black/5 dark:ring-white/20 transition-opacity duration-300" + (isNotiHidden ? " hidden" : " flex") + (isNotiInvisible ? " opacity-0" : " opacity-100")}>
                <div>
                    <Icon name={Icons.error} className="w-6 h-6 stroke-red-500 fill-none" />
                </div>
                <div className="w-full ml-3">
                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{getNotiTitle}</p>
                    <p className="mt-1 text-sm text-neutral-500">{getNotiBody}</p>
                </div>
                <div className="ml-4">
                    <button type="button" className="text-neutral-400 hover:text-neutral-500 transition-colors" onClick={notificationClose}>
                        <Icon name={Icons.close} className="w-5 h-5 fill-current" />
                    </button>
                </div>
            </div>
            <div id="setupScreen" className="min-w-full min-h-full flex flex-1 flex-col justify-center opacity-0 px-4 py-12 lg:px-8 transition-opacity duration-300">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img className="w-12 h-12 ml-auto mr-auto" src="./logo.svg"/>
                    <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-neutral-100">Wavely Sail</h1>
                    <h2 className="text-center text-lg font-medium leading-9 tracking-tight text-neutral-900 dark:text-neutral-100">Downloader</h2>
                </div>
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={onYouTubeLinkSubmit}>
                        <div className="mt-2">
                            <input
                                id="urlInput"
                                name="url"
                                className="block w-full rounded-md border-0 py-1.5 text-neutral-900 dark:text-neutral-100 text-center bg-white dark:bg-black shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-rose-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                                type="url"
                                autoComplete="url"
                                placeholder="Paste your YouTube link here"
                                title="YouTube link"
                                required
                                value={getUrlInputValue}
                                onInput={onLinkInput}
                                onChange={(e) => setUrlInputValue(e.target.value)}
                            />
                        </div>
                        <div>
                            <button
                                id="submitButton"
                                type="submit"
                                className="w-full rounded-md px-3 py-1.5 text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-400 disabled:dark:bg-neutral-700 font-semibold shadow-sm leading-6 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                                disabled={isSubmitDisabled}
                            >
                                Download
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="loadScreen" className="min-w-full min-h-full hidden flex-1 flex-col justify-center items-center opacity-0 px-4 py-12 lg:px-8 transition-opacity duration-300">
                <Icon name={Icons.load} className="animate-spin w-16 h-16 text-rose-500 fill-none"/>
                <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-neutral-100">Loading editor</h1>
                <h2 className="mt-2 text-center text-neutral-600 dark:text-neutral-400">Good things await those who wait</h2>
            </div>
            <div id="editorScreen" className="min-w-full min-h-full hidden flex-1 flex-col justify-center items-center opacity-0 px-4 py-12 lg:px-8 transition-opacity duration-300">
                <form className="w-full md:w-160" autoComplete="off" onSubmit={onMetadataSubmit}>
                    <div className="border-b pb-8 border-neutral-900/10 dark:border-neutral-100/10">
                        <h1 className="text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-neutral-100">Song Details</h1>
                        <h2 className="mt-2 text-neutral-600 dark:text-neutral-400">Use the following fields to fill the song's metadata</h2>
                        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label htmlFor="title" className="block text-sm font-medium leading-6 text-neutral-900 dark:text-neutral-100">
                                    Title
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="songTitle"
                                        name="title"
                                        type="text"
                                        className="block w-full rounded-md border-0 py-1.5 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-black shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-rose-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                                        placeholder="Song Title"
                                        title="Song Title"
                                        required
                                        value={getSongTitleValue}
                                        onChange={(e) => setSongTitleValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="artist" className="block text-sm font-medium leading-6 text-neutral-900 dark:text-neutral-100">
                                    Artist
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="songArtist"
                                        name="artist"
                                        type="text"
                                        className="block w-full rounded-md border-0 py-1.5 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-black shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-rose-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                                        placeholder="Song Artist"
                                        title="Song Artist"
                                        required
                                        value={getSongArtistValue}
                                        onChange={(e) => setSongArtistValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="artist" className="block text-sm font-medium leading-6 text-neutral-900 dark:text-neutral-100">
                                    Album
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="songAlbum"
                                        name="album"
                                        type="text"
                                        className="block w-full rounded-md border-0 py-1.5 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-black shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus:ring-rose-600 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                                        placeholder="Song Album"
                                        title="Song Album"
                                        required
                                        value={getSongAlbumValue}
                                        onChange={(e) => setSongAlbumValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-6 relative">
                                <label htmlFor="artwork" className="block text-sm font-medium leading-6 text-neutral-900 dark:text-neutral-100">
                                    Artwork
                                </label>
                                <div className="mt-2">
                                    <div className="flex w-full rounded-md shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus-within:ring-rose-600 focus-within:ring-2 focus-within:ring-inset">
                                        <input
                                            id="songArtwork"
                                            type="search"
                                            className="block w-full border-0 py-1.5 text-neutral-900 dark:text-neutral-100 bg-transparent placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-0 sm:text-sm sm:leading-6"
                                            placeholder="Search for an Artwork"
                                            title="Song Artwork"
                                            value={getSongArtworkValue}
                                            onInput={() => searchArtwork(false)}
                                            onFocus={() => searchArtwork(true)}
                                            onBlur={() => closeArtworkDrawer()}
                                            onChange={(e) => setSongArtworkValue(e.target.value)}
                                        />
                                        <img className={"w-7 h-7 m-1 rounded" + (isSongArtworkDisplayHidden ? " hidden" : " block")} src={getSongArtworkSrc}/>
                                    </div>
                                    <input
                                        id="songArtworkHide"
                                        name="artwork"
                                        type="hidden"
                                        value={getSongArtworkSrc}
                                    />
                                </div>
                                <div
                                    id="artworkDrawer"
                                    className={"absolute w-full mt-4 p-4" + (isSongArtworkDrawerHidden ? " hidden" : " flex") + " space-x-2 lg:space-x-4 overflow-x-scroll" + (isSongArtworkDrawerInvisible ? " opacity-0" : " opacity-100") + " bg-neutral-200/50 dark:bg-neutral-800/50 z-10 backdrop-blur rounded-3xl transition-opacity"}
                                    onWheel={scrollDrawer}
                                ></div>
                            </div>
                            <div className="sm:col-span-6 relative">
                                <label htmlFor="lyrics" className="block text-sm font-medium leading-6 text-neutral-900 dark:text-neutral-100">
                                    Lyrics
                                </label>
                                <div className="mt-2">
                                    <div className="flex flex-col w-full rounded-md shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 focus-within:ring-rose-600 focus-within:ring-2 focus-within:ring-inset">
                                        <div className="flex w-full">
                                            <input
                                                id="songLyrics"
                                                type="search"
                                                className="block w-full border-0 ring-0 py-1.5 pr-1 text-neutral-900 bg-transparent dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-0 sm:text-sm sm:leading-6"
                                                placeholder="Search for Lyrics"
                                                title="Song Lyrics"
                                                value={getSongLyricsSearchValue}
                                                onInput={() => searchLyrics(false)}
                                                onFocus={() => searchLyrics(true)}
                                                onChange={(e) => setSongLyricsSearchValue(e.target.value)}
                                            />
                                            <Icon name={Icons.load} className={"animate-spin w-9 h-9 p-2 text-rose-500 fill-none" + (isSongLyricsLoadHidden ? " hidden" : " block")}/>
                                        </div>
                                        <hr className="w-full m-auto border-neutral-200 dark:border-neutral-800 -z-10" />
                                        <textarea
                                            id="songLyricsEdit"
                                            className="block border-0 ml-3 mr-1.5 my-1.5 p-0 bg-transparent text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-0 sm:text-sm sm:leading-6"
                                            rows={5}
                                            placeholder="Edit the Lyrics"
                                            value={getSongLyricsValue}
                                            onInput={() => setSongLyricsModified(true)}
                                            onChange={(e) => setSongLyricsValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-x-3">
                        <button
                            type="button"
                            className="rounded-md px-3 py-1.5 text-sm text-black dark:text-white disabled:text-neutral-600 disabled:dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:hover:bg-neutral-200 disabled:dark:hover:bg-neutral-800 font-semibold shadow-sm leading-6 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-200 dark:focus-visible:outline-neutral-800 disabled:focus-visible:outline-none"
                            onClick={discardEditor}
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="rounded-md px-3 py-1.5 text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-400 disabled:dark:bg-neutral-700 font-semibold shadow-sm leading-6 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                        >
                            Apply
                        </button>
                    </div>
                </form>
            </div>
            <div id="endScreen" className="min-w-full min-h-full hidden flex-1 flex-col justify-center items-center opacity-0 px-4 py-12 lg:px-8 transition-opacity duration-300">
                <Icon name={Icons.load} className="animate-spin w-16 h-16 text-rose-500 fill-none"/>
                <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-neutral-100">Nearly there!</h1>
                <h2 className="mt-2 text-center text-neutral-600 dark:text-neutral-400">{getEndSubText + getEndSubTextPerc}</h2>
            </div>
        </main>
    );
}