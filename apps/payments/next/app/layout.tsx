import { Header } from '@fxa/payments/next-ui';
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
          <Header />
          <div className="mt-16 main-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
