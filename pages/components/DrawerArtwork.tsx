import React from "react";

export default function DrawerArtwork(props: { src: string, onClick: (e: React.MouseEvent<HTMLAnchorElement>) => any }) {
    return (
        <a className="w-20 h-20 lg:w-32 lg:h-32 min-w-max min-h-max block rounded-xl overflow-hidden cursor-pointer" onClick={props.onClick}>
            <img className="h-full" src={props.src}/>
        </a>
    );
}