import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,100..900;1,100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Style+Script&display=swap" rel="stylesheet" />
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 12v10H4V12'%3E%3C/path%3E%3Cpath d='M2 7h20v5H2z'%3E%3C/path%3E%3Cpath d='M12 22V7'%3E%3C/path%3E%3Cpath d='M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z'%3E%3C/path%3E%3Cpath d='M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'%3E%3C/path%3E%3C/svg%3E"
        />
        <meta
          name="description"
          content="A gift list application where you can share your wishlist with friends and family."
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
