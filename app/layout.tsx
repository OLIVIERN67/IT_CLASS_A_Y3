import "./globals.css";

export const metadata = {
  title: "Class Members",
  description: "Secure class members directory"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
