/**
 * Root Layout
 *
 * Wraps the entire app with AuthProvider and Sidebar
 */

import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "AI Face Recognition CRM",
  description: "AI-powered Face Recognition Customer Relationship Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Sidebar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
