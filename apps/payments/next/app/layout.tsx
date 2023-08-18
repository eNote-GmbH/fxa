import Image from 'next/image';
import firefoxLogo from '../images/firefox-logo-combined.svg';
import './global.css';

export const metadata = {
  title: 'Firefox accounts',
  description: 'Fireffox accounts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="main">
          <header
            className="bg-white fixed flex justify-between items-center shadow h-16 left-0 top-0 mx-auto my-0 px-4 py-0 w-full z-10 tablet:h-20"
            role="banner"
            data-testid="header"
          >
            <Image
              src={firefoxLogo}
              alt="Firefox logo"
              className="object-contain"
              data-testid="branding"
              width={120}
              height={120}
            />
          </header>
          <div className="mt-16 main-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
