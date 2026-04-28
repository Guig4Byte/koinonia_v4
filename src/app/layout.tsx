import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koinonia Lite",
  description: "Radar pastoral simples para células, eventos e presença.",
};

const themeScript = `
(function () {
  try {
    var themes = ['light', 'parchment', 'dark'];
    var stored = localStorage.getItem('koinonia-theme');
    var theme = themes.indexOf(stored) >= 0 ? stored : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
