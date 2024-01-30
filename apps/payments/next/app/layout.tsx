import Image from 'next/image';
// TODO - Move shared SVGs to a shared library in fxa/libs/shared/*
import mozillaLogo from '../images/moz-logo-bw-rgb.svg';
import './styles/global.css';

// TODO - Replace these placeholders as part of FXA-8227
export const metadata = {
  title: 'Mozilla accounts',
  description: 'Mozilla accounts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header
          className="bg-white fixed flex justify-between items-center shadow h-16 left-0 top-0 mx-auto my-0 px-4 py-0 w-full z-10 tablet:h-20"
          role="banner"
          data-testid="header"
        >
          <Image
            src={mozillaLogo}
            alt="Mozilla logo"
            className="object-contain"
            data-testid="branding"
            width={120}
            height={120}
          />
        </header>
        <main className="mt-16 mx-7 min-h-[calc(100vh_-_4rem)] tablet:grid tablet:grid-cols-[minmax(min-content,500px)_minmax(20rem,1fr)] tablet:grid-rows-[min-content] tablet:gap-x-8 tablet:mt-20 tablet:mb-auto desktop:grid-cols-[600px_1fr]">
          {children}
        </main>
      </body>
    </html>
  );
}
