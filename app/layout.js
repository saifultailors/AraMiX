import './globals.css';

export const metadata = {
  title: 'আমাদের কালেকশন',
  description: 'পোশাকের কালেকশন',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
