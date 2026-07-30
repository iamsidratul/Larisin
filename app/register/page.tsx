import { AuthVisual } from "@/components/auth/AuthVisual";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <AuthVisual />
        <div className="auth-form">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
