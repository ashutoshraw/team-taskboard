import { Link } from "react-router-dom";
import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  onClick,
  disabled,
  type = "button",
  style,
}: ButtonProps) {
  const className = [
    variant === "primary" ? styles.btnPrimary : styles.btnGhost,
    size === "lg" ? styles.lg : "",
  ].join(" ");

  if (to) {
    return <Link to={to} className={className} style={style}>{children}</Link>;
  }

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}