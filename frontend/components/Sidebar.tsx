// Sidebar — navigation + client list + new/edit client modals + mobile drawer support
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Calendar,
  Plus,
  MoreVertical,
  Settings,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { Client } from "@/lib/types";
import NewClientModal from "./NewClientModal";
import EditClientModal from "./EditClientModal";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const THEMES = [
  { key: "midnight", label: "Midnight" },
  { key: "daylight", label: "Daylight" },
  { key: "terracotta", label: "Terracotta" },
  { key: "sage", label: "Sage" },
  { key: "slate", label: "Slate" },
];

function ThemeDot({ themeKey }: { themeKey: string }) {
  const accents: Record<string, string> = {
    midnight: "#B5502F",
    daylight: "#A6532C",
    terracotta: "#E07040",
    sage: "#6A8C5C",
    slate: "#5B6FA8",
  };
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-white/20"
      style={{ backgroundColor: accents[themeKey] ?? "#888" }}
    />
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { clients, loading, refetch } = useClients();
  const [showNewClient, setShowNewClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showTheme, setShowTheme] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function setTheme(key: string) {
    document.documentElement.setAttribute("data-theme", key);
    setShowTheme(false);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      {/* Wordmark */}
      <div className="px-5 pt-5 pb-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1
            className="text-xl font-semibold leading-none"
            style={{
              fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
              color: "var(--text)",
            }}
          >
            Task
            <span style={{ color: "var(--accent)" }}>Flow</span>
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
            Interior Design
          </p>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg md:hidden hover:bg-white/10"
          style={{ color: "var(--muted)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="px-3 pt-3 pb-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors"
              style={{
                backgroundColor: active ? "rgba(181,80,47,0.14)" : "transparent",
                color: active ? "var(--accent)" : "var(--muted)",
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-1 border-t" style={{ borderColor: "var(--border)" }} />

      {/* Clients section */}
      <div className="flex items-center justify-between px-4 py-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Clients
        </span>
        <button
          id="sidebar-new-client-btn"
          onClick={() => setShowNewClient(true)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: "var(--muted)" }}
          title="New client"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-3">
            <Loader2 size={13} className="animate-spin" style={{ color: "var(--muted)" }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>Loading…</span>
          </div>
        ) : clients.length === 0 ? (
          <p className="text-xs px-3 py-2 italic" style={{ color: "var(--muted)" }}>
            No clients yet.
          </p>
        ) : (
          clients.map((client) => {
            const active = pathname === `/clients/${client.id}`;
            return (
              <div
                key={client.id}
                className="relative flex items-center group rounded-lg mb-0.5 transition-colors"
                style={{
                  backgroundColor: active ? "rgba(181,80,47,0.1)" : "transparent",
                }}
              >
                <Link
                  href={`/clients/${client.id}`}
                  id={`sidebar-client-${client.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 px-3 py-2 text-sm"
                  style={{ color: active ? "var(--text)" : "var(--muted)" }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: client.color }}
                  />
                  <span className="truncate text-sm">{client.name}</span>
                </Link>

                {/* ⋮ menu */}
                <button
                  id={`sidebar-client-menu-${client.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === client.id ? null : client.id);
                  }}
                  className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                  style={{ color: "var(--muted)" }}
                >
                  <MoreVertical size={12} />
                </button>

                {openMenuId === client.id && (
                  <div
                    className="absolute right-0 top-full z-50 w-32 rounded-lg shadow-xl border overflow-hidden"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/10"
                      style={{ color: "var(--text)" }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom: Theme + Settings */}
      <div className="border-t px-3 py-3 relative" style={{ borderColor: "var(--border)" }}>
        <button
          id="theme-toggle-btn"
          onClick={() => setShowTheme((x) => !x)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors"
          style={{ color: "var(--muted)" }}
        >
          <Settings size={13} />
          Theme
        </button>

        {showTheme && (
          <div
            className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border shadow-2xl p-3 z-50"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--muted)" }}
            >
              Theme
            </p>
            {THEMES.map((t) => (
              <button
                key={t.key}
                id={`theme-option-${t.key}`}
                onClick={() => setTheme(t.key)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/10"
                style={{ color: "var(--text)" }}
              >
                <ThemeDot themeKey={t.key} />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 border-b fixed top-0 left-0 right-0 z-30 shrink-0"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10"
            style={{ color: "var(--text)" }}
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
          <h1
            className="text-lg font-semibold leading-none"
            style={{
              fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
              color: "var(--text)",
            }}
          >
            Task<span style={{ color: "var(--accent)" }}>Flow</span>
          </h1>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col h-full shrink-0 border-r"
        style={{
          width: "15rem",
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative w-64 h-full z-10 border-r flex flex-col"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Modals */}
      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreated={() => { refetch(); }}
        />
      )}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          taskCount={0}
          onClose={() => setEditingClient(null)}
          onUpdated={() => { refetch(); }}
          onDeleted={() => { refetch(); }}
        />
      )}

      {/* Close menus on outside click */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </>
  );
}
