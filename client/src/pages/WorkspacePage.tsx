import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { useAuthStore } from "../store/auth.store";
import { useTheme } from "../hooks/useTheme";
import Button from "../components/Button";
import styles from "./Workspace.module.css";

interface Board {
  id: number;
  name: string;
  workspace_id: number;
  created_at: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  joined_at: string;
}

const AVATAR_COLORS = ["#6c63ff", "#4caf82", "#f59e0b", "#ff5c5c", "#a78bfa", "#06b6d4"];

function BoardCard({
  board,
  isAdmin,
  onEdit,
  onDelete,
  delay,
}: {
  board: Board;
  isAdmin: boolean;
  onEdit: (b: Board) => void;
  onDelete: (b: Board) => void;
  delay: number;
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

  return (
    <div className={styles.boardCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.boardCardHeader}>
        <div className={styles.boardIcon}>📋</div>
        {isAdmin && (
          <div className={styles.menuWrapper} ref={menuRef}>
            <button
              className={styles.boardMenuBtn}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={(e) => { e.preventDefault(); setMenuOpen(false); onEdit(board); }}>
                  ✏️ Rename
                </button>
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete(board); }}>
                  🗑️ Delete board
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Link to={`/board/${board.id}`} style={{ textDecoration: "none" }}>
        <div className={styles.boardName}>{board.name}</div>
        <div className={styles.boardMeta}>
          Created {new Date(board.created_at).toLocaleDateString()}
        </div>
      </Link>
    </div>
  );
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<{ id: number; name: string } | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create board modal
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);

  // Edit board modal
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editBoardName, setEditBoardName] = useState("");
  const [editingBoardLoading, setEditingBoardLoading] = useState(false);

  // Delete board modal
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
  const [deletingBoardLoading, setDeletingBoardLoading] = useState(false);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Leave workspace
  const [showLeave, setShowLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  // Remove member
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [removingLoading, setRemovingLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [wsRes, boardsRes, membersRes] = await Promise.all([
          api.get(`/workspaces/${id}`),
          api.get(`/boards/workspace/${id}`),
          api.get(`/workspaces/${id}/members`),
        ]);
        setWorkspace(wsRes.data);
        setBoards(boardsRes.data);
        setMembers(membersRes.data);
        const me = membersRes.data.find((m: Member) => m.id === user?.id);
        setIsAdmin(me?.role === "admin");
      } catch {
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    setCreatingBoard(true);
    try {
      const res = await api.post("/boards", { name: newBoardName.trim(), workspace_id: Number(id) });
      setBoards((prev) => [res.data, ...prev]);
      setNewBoardName("");
      setShowCreateBoard(false);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleEditBoard = async () => {
    if (!editingBoard || !editBoardName.trim()) return;
    setEditingBoardLoading(true);
    try {
      await api.put(`/boards/${editingBoard.id}`, { name: editBoardName.trim() });
      setBoards((prev) => prev.map((b) => b.id === editingBoard.id ? { ...b, name: editBoardName.trim() } : b));
      setEditingBoard(null);
    } finally {
      setEditingBoardLoading(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return;
    setDeletingBoardLoading(true);
    try {
      await api.delete(`/boards/${deletingBoard.id}`);
      setBoards((prev) => prev.filter((b) => b.id !== deletingBoard.id));
      setDeletingBoard(null);
    } finally {
      setDeletingBoardLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      await api.post(`/workspaces/${id}/invite`, { email: inviteEmail.trim(), role: inviteRole });
      const membersRes = await api.get(`/workspaces/${id}/members`);
      setMembers(membersRes.data);
      setInviteEmail("");
      setShowInvite(false);
    } catch (err: any) {
      setInviteError(err.response?.data?.error || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setRemovingLoading(true);
    try {
      await api.delete(`/workspaces/${id}/members/${removingMember.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== removingMember.id));
      setRemovingMember(null);
    } finally {
      setRemovingLoading(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    setLeaveError("");
    try {
      await api.post(`/workspaces/${id}/leave`);
      clearAuth();
      navigate("/dashboard");
    } catch (err: any) {
      setLeaveError(err.response?.data?.error || "Failed to leave workspace");
    } finally {
      setLeaving(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const memberInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link to="/dashboard" className={styles.backBtn}>← Back</Link>
          <div className={styles.topbarLogo}>TaskBoard</div>
          <span className={styles.divider}>/</span>
          <span className={styles.workspaceName}>{workspace?.name || "..."}</span>
        </div>
        <div className={styles.topbarRight}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div className={styles.userBadge}>
            <div className={styles.userAvatar}>{initials}</div>
            {user?.name || "User"}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.mainHeader}>
            <div>
              <h1 className={styles.mainTitle}>Boards</h1>
              <p className={styles.mainSubtitle}>
                {boards.length} {boards.length === 1 ? "board" : "boards"} in this workspace
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreateBoard(true)}>+ New board</Button>
            )}
          </div>

          {loading ? (
            <div className={styles.boardGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : (
            <div className={styles.boardGrid}>
              {boards.map((board, i) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  isAdmin={isAdmin}
                  onEdit={(b) => { setEditingBoard(b); setEditBoardName(b.name); }}
                  onDelete={(b) => setDeletingBoard(b)}
                  delay={i * 80}
                />
              ))}
              {isAdmin && (
                <div className={styles.createBoardCard} onClick={() => setShowCreateBoard(true)}>
                  <div className={styles.createBoardIcon}>+</div>
                  <span>New board</span>
                </div>
              )}
              {boards.length === 0 && !isAdmin && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <h3>No boards yet</h3>
                  <p>Ask an admin to create a board for this workspace.</p>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarTitle}>Members ({members.length})</div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2].map((i) => (
                  <div key={i} className={`${styles.skeleton} ${styles.skeletonMember}`} />
                ))}
              </div>
            ) : (
              <div className={styles.memberList}>
                {members.map((m, i) => (
                  <div key={m.id} className={styles.memberItem}>
                    <div
                      className={styles.memberAvatar}
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {memberInitials(m.name)}
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>{m.name}</div>
                      <div className={styles.memberEmail}>{m.email}</div>
                    </div>
                    <span className={`${styles.memberRole} ${m.role === "admin" ? styles.roleAdmin : styles.roleMember}`}>
                      {m.role}
                    </span>
                    {isAdmin && m.id !== user?.id && (
                      <button
                        className={styles.removeMemberBtn}
                        onClick={() => setRemovingMember(m)}
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <button className={styles.inviteBtn} onClick={() => setShowInvite(true)}>
                    + Invite member
                  </button>
                )}
                {!isAdmin && (
                  <button
                    className={styles.inviteBtn}
                    onClick={() => setShowLeave(true)}
                    style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                  >
                    Leave workspace
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Create board modal */}
      {showCreateBoard && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateBoard(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>New board</h2>
            <p>Give your board a name. You can add columns and cards after.</p>
            <input
              className={styles.modalInput}
              placeholder="e.g. Sprint 1, Product Roadmap"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreateBoard(false)}>Cancel</button>
              <Button onClick={handleCreateBoard} disabled={creatingBoard || !newBoardName.trim()}>
                {creatingBoard ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit board modal */}
      {editingBoard && (
        <div className={styles.modalOverlay} onClick={() => setEditingBoard(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Rename board</h2>
            <p>Enter a new name for "{editingBoard.name}".</p>
            <input
              className={styles.modalInput}
              value={editBoardName}
              onChange={(e) => setEditBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditBoard()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingBoard(null)}>Cancel</button>
              <Button onClick={handleEditBoard} disabled={editingBoardLoading || !editBoardName.trim()}>
                {editingBoardLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete board modal */}
      {deletingBoard && (
        <div className={styles.modalOverlay} onClick={() => setDeletingBoard(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Delete board</h2>
            <p>Are you sure you want to delete <strong>"{deletingBoard.name}"</strong>? All columns and cards will be permanently deleted.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeletingBoard(null)}>Cancel</button>
              <button className={styles.deleteBtn} onClick={handleDeleteBoard} disabled={deletingBoardLoading}>
                {deletingBoardLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className={styles.modalOverlay} onClick={() => { setShowInvite(false); setInviteError(""); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Invite member</h2>
            <p>Enter the email address of the person you want to invite. They must already have an account.</p>
            {inviteError && <div className={styles.modalError}>{inviteError}</div>}
            <input
              className={styles.modalInput}
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              autoFocus
            />
            <select
              className={styles.roleSelect}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
            >
              <option value="member">Member — can view and edit boards</option>
              <option value="admin">Admin — can manage members and settings</option>
            </select>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowInvite(false); setInviteError(""); }}>Cancel</button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? "Inviting..." : "Send invite"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove member modal */}
      {removingMember && (
        <div className={styles.modalOverlay} onClick={() => setRemovingMember(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Remove member</h2>
            <p>Are you sure you want to remove <strong>{removingMember.name}</strong> from this workspace? They will lose access to all boards.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setRemovingMember(null)}>Cancel</button>
              <button className={styles.deleteBtn} onClick={handleRemoveMember} disabled={removingLoading}>
                {removingLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave workspace modal */}
      {showLeave && (
        <div className={styles.modalOverlay} onClick={() => { setShowLeave(false); setLeaveError(""); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Leave workspace</h2>
            <p>Are you sure you want to leave <strong>"{workspace?.name}"</strong>? You will lose access to all its boards.</p>
            {leaveError && <div className={styles.modalError}>{leaveError}</div>}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowLeave(false); setLeaveError(""); }}>Cancel</button>
              <button className={styles.deleteBtn} onClick={handleLeave} disabled={leaving}>
                {leaving ? "Leaving..." : "Leave workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}