import { AuthVisual } from "@/components/auth/AuthVisual";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <AuthVisual />
        <div className="auth-form">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
