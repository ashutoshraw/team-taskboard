import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { useAuthStore } from "../store/auth.store";
import { useTheme } from "../hooks/useTheme";
import Button from "../components/Button";
import styles from "./Dashboard.module.css";

interface Workspace {
  id: number;
  name: string;
  created_at: string;
  member_count: number;
  board_count: number;
}

function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
  animationDelay,
}: {
  workspace: Workspace;
  onEdit: (ws: Workspace) => void;
  onDelete: (ws: Workspace) => void;
  animationDelay: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Placeholder progress: boards as proxy until we add card stats
  const progress = workspace.board_count > 0 ? Math.min(workspace.board_count * 20, 100) : 0;

  return (
    <div
      className={styles.workspaceCard}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={styles.workspaceCardHeader}>
        <div className={styles.workspaceIcon}>🗂️</div>
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  onEdit(workspace);
                }}
              >
                ✏️ Rename
              </button>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  onDelete(workspace);
                }}
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <Link to={`/workspace/${workspace.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div className={styles.workspaceName}>{workspace.name}</div>

        <div className={styles.workspaceStats}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>📋</span>
            {workspace.board_count} {workspace.board_count === 1 ? "board" : "boards"}
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>👥</span>
            {workspace.member_count} {workspace.member_count === 1 ? "member" : "members"}
          </div>
        </div>

        <div className={styles.progressWrapper}>
          <div className={styles.progressLabel}>
            <span>Activity</span>
            <span>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);

  // Delete confirm
  const [deletingWs, setDeletingWs] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get("/workspaces");
        setWorkspaces(res.data);
      } catch {
        clearAuth();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/workspaces", { name: newName.trim() });
      setWorkspaces((prev) => [res.data, ...prev]);
      setNewName("");
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editingWs || !editName.trim()) return;
    setEditing(true);
    try {
      await api.put(`/workspaces/${editingWs.id}`, { name: editName.trim() });
      setWorkspaces((prev) =>
        prev.map((w) => w.id === editingWs.id ? { ...w, name: editName.trim() } : w)
      );
      setEditingWs(null);
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWs) return;
    setDeleting(true);
    try {
      await api.delete(`/workspaces/${deletingWs.id}`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== deletingWs.id));
      setDeletingWs(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await api.post("/auth/logout");
    clearAuth();
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <div className={styles.topbarLogo}>TaskBoard</div>
        <div className={styles.topbarRight}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div className={styles.userBadge}>
            <div className={styles.userAvatar}>{initials}</div>
            {user?.name || "User"}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Your workspaces</h1>
            <p className={styles.pageSubtitle}>
              Select a workspace to view its boards
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + New workspace
          </Button>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No workspaces yet</h3>
            <p>Create your first workspace to start organizing your team's work.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create workspace
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {workspaces.map((ws, i) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                animationDelay={i * 80}
                onEdit={(ws) => { setEditingWs(ws); setEditName(ws.name); }}
                onDelete={(ws) => setDeletingWs(ws)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>New workspace</h2>
            <p>Give your workspace a name. You can invite teammates after.</p>
            <input
              className={styles.modalInput}
              placeholder="e.g. Design Team, Backend Squad"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingWs && (
        <div className={styles.modalOverlay} onClick={() => setEditingWs(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Rename workspace</h2>
            <p>Enter a new name for "{editingWs.name}".</p>
            <input
              className={styles.modalInput}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingWs(null)}>
                Cancel
              </button>
              <Button onClick={handleEdit} disabled={editing || !editName.trim()}>
                {editing ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingWs && (
        <div className={styles.modalOverlay} onClick={() => setDeletingWs(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Delete workspace</h2>
            <p>
              Are you sure you want to delete <strong>"{deletingWs.name}"</strong>?
              This will permanently delete all boards, columns and cards inside it.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeletingWs(null)}>
                Cancel
              </button>
              <button
                className={`${styles.cancelBtn}`}
                style={{ background: "var(--danger)", color: "white", border: "none" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}