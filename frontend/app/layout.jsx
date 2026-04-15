import './globals.css';

export const metadata = {
  title: 'Vehicle Management System',
  description: 'Professional vehicle and driver management platform',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
