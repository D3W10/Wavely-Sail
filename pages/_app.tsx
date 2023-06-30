import "@/styles/globals.css"
import Head from "next/head";
import { Inter } from "next/font/google";
import type { AppProps } from "next/app";
import packageJson from "@/package.json";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
    return (
        <div className={inter.className}>
            <Head>
                <meta charSet="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
                <meta name="description" content={packageJson.description}/>
                <meta name="author" content={packageJson.author.name}/>
                <meta name="keywords" content={packageJson.displayName}/>
                <meta name="apple-mobile-web-app-title" content={packageJson.displayName}/>
                <link rel="apple-touch-icon" href="./logo.svg"/>
                <link rel="apple-touch-startup-image" href="./apple-touch-icon.png"/>
                <meta property="og:title" content={packageJson.displayName}/>
                <meta property="og:description" content={packageJson.description}/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content={packageJson.homepage}/>
                <meta name="theme-color" content="#e11d48"/>
                <meta name="twitter:card" content="summary_large_image"/>
                <title>{packageJson.displayName}</title>
            </Head>
            <Component {...pageProps} />
        </div>
    );
}