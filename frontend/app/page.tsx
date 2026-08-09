// Home page "/" — landing screen, prompts user to select a client from the sidebar
"use client";

import { MousePointerClick, FolderPlus, Plus } from "lucide-react";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import Sidebar from "@/components/Sidebar";
import NewClientModal from "@/components/NewClientModal";

export default function HomePage() {
  const { clients, loading } = useClients();
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-0">
        {/* Page header */}
        <div
          className="shrink-0 px-6 pt-6 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h1
            className="text-2xl font-semibold mb-1"
            style={{
              fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif",
              color: "var(--text)",
            }}
          >
            Welcome to TaskFlow
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Select a client from the sidebar to view and manage their tasks
          </p>
        </div>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center p-6">
          {!loading && clients.length === 0 ? (
            // No clients yet — prompt to create one
            <div
              className="text-center flex flex-col items-center gap-5 border rounded-2xl px-10 py-14 max-w-sm w-full shadow-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <div
                className="p-4 rounded-full"
                style={{ backgroundColor: "rgba(181,80,47,0.12)", color: "var(--accent)" }}
              >
                <FolderPlus size={40} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}
                >
                  No Clients Yet
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  Create your first client to start organizing tasks and tracking project progress.
                </p>
              </div>
              <button
                id="home-create-first-client-btn"
                onClick={() => setShowNewClientModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <Plus size={16} />
                Create First Client
              </button>
            </div>
          ) : (
            // Clients exist — prompt to select one
            <div
              className="text-center flex flex-col items-center gap-5 border rounded-2xl px-10 py-14 max-w-sm w-full shadow-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <div
                className="p-4 rounded-full"
                style={{ backgroundColor: "rgba(181,80,47,0.10)", color: "var(--accent)" }}
              >
                <MousePointerClick size={40} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "Fraunces, var(--font-fraunces), Georgia, serif", color: "var(--text)" }}
                >
                  Select a Client
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  Click any client name in the sidebar to view and manage their tasks, track progress, and manage deadlines.
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                {clients.length} {clients.length === 1 ? "client" : "clients"} available
              </div>
            </div>
          )}
        </div>
      </main>

      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onCreated={() => setShowNewClientModal(false)}
        />
      )}
    </div>
  );
}
