import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Login example",
  description: "Social Login example using @supabase-labs/nextjs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
