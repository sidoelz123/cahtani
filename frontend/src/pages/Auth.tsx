import React from "react";
import { AuthModal } from "../components/AuthModal";
import { User } from "../types";

export interface AuthPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: "login" | "signup" | "forgot_password";
  onLoginSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthPageProps> = ({
  isOpen = true,
  onClose = () => {},
  initialMode = "login",
  onLoginSuccess,
}) => {
  return (
    <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center p-4">
      <AuthModal
        isOpen={isOpen}
        onClose={onClose}
        initialMode={initialMode}
        onLoginSuccess={onLoginSuccess}
      />
    </div>
  );
};
