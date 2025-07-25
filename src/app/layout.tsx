import "@/css/satoshi.css";
import "@/css/style.css";
import "antd/dist/reset.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Providers } from "./providers";
import ConditionalLayout from "@/components/Layouts/ConditionalLayout";
import NextTopLoader from "nextjs-toploader";
import SessionManager from "@/components/SessionManager";

export const metadata: Metadata = {
  title: {
    template: "%s | NextAdmin - Next.js Dashboard Kit",
    default: "NextAdmin - Next.js Dashboard Kit",
  },
  description:
    "Next.js admin dashboard toolkit with 200+ templates, UI components, and integrations for fast dashboard development.",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions); // ✅ obteniendo sesión vía JWT

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers session={session}>
          <SessionManager />
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
