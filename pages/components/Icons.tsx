import React from "react";

enum Icons {
    load,
    error,
    warning,
    check,
    close
}

type IconProps = {
    name: Icons,
    className: string
}

function icon(props: IconProps) {
    if (props.name == Icons.load)
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={props.className}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        );
    else if (props.name == Icons.error)
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={props.className} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    else if (props.name == Icons.warning)
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={props.className} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
        );
    else if (props.name == Icons.check)
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={props.className} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    else if (props.name == Icons.close)
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className={props.className} strokeWidth={1.5}>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path>
            </svg>
        );
}

const Icon = React.memo(icon);

export {
    Icon as default,
    Icons
}