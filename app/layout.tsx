export const metadata = {
  title: "Gen Studio ? Image Generator",
  description: "Generate images with top AI models on the web"
};

import "./globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          {children}
          <div className="footer">
            Built for the web. Models powered via Replicate.
          </div>
        </div>
      </body>
    </html>
  );
}

