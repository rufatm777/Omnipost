import "./globals.css";
export const metadata = { title: "OmniPost — AI Social Media Manager", description: "AI content + OAuth sign-in + direct posting. Self-owned." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
