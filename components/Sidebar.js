/**
 * Sidebar Navigation Component
 *
 * Replaces Streamlit's built-in sidebar navigation
 *
 * Streamlit auto-generates sidebar from pages/ folder:
 *   - dashboard, search_face, indexing (visible to all)
 *   - users, create_user, change_password (visible to all but restricted to admin in page)
 *   - setup_2fa is in utils/ folder, not pages/, so it's not in sidebar in Streamlit
 *     but we add it here for accessibility
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loggedIn, logout } = useAuth();

  if (!loggedIn) return null;

  const isAdmin = user?.role === "admin";

  const navItems = [
    {
      section: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/search-face", label: "Search Faces", icon: "🔍" },
        { href: "/indexing", label: "Index Images", icon: "📂" },
      ],
    },
    ...(isAdmin
      ? [
          {
            section: "Admin",
            items: [
              { href: "/users", label: "Users List", icon: "👥" },
              { href: "/create-user", label: "Create User", icon: "➕" },
              { href: "/change-password", label: "Change Password", icon: "🔑" },
            ],
          },
        ]
      : []),
    {
      section: "Tools",
      items: [
        { href: "/setup-2fa", label: "Setup 2FA", icon: "🛡️" },
      ],
    },
  ];

  return (
    <>
      <aside className="sidebar" id="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🧠</div>
          <span className="sidebar-brand-text">AI Face CRM</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="sidebar-user-name">{user.username}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
          )}

          <button
            className="btn btn-danger btn-full"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            id="logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
