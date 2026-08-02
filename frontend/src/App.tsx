import React, { useState, useEffect } from "react";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { ChatDrawer } from "./components/ChatDrawer";
import { AuthModal } from "./components/AuthModal";
import { apiClient } from "./lib/api";
import { User } from "./types";
import { clearChatSessionData } from "./lib/session";

export const CURRENT_USER_QUERY_KEY = ["currentUser"];

function AppContent() {
  const queryClient = useQueryClient();
  const [selectedCrop, setSelectedCrop] = useState<string>("padi");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const getUserFromStorage = (): User | null => {
    try {
      const saved = localStorage.getItem("agribot_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading user from localStorage:", e);
    }
    return null;
  };

  // TanStack Query for Auth State
  const { data: currentUser = null } = useQuery<User | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getUserFromStorage,
    initialData: getUserFromStorage,
    staleTime: Infinity,
  });

  // Re-evaluate TanStack Router context whenever currentUser changes
  useEffect(() => {
    router.invalidate();
  }, [currentUser]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const handleOpenAuthModal = (mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSetCurrentUser = (user: User | null) => {
    if (user) {
      localStorage.setItem("agribot_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("agribot_user");
      clearChatSessionData();
    }
    // Update TanStack Query cache reactively
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    router.invalidate();
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      localStorage.removeItem("agribot_session_token");
      handleSetCurrentUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#14201A] text-[#14201A] font-sans selection:bg-[#15803D] selection:text-[#F7F9F4] flex justify-center">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full max-w-[1440px] mx-auto min-h-screen bg-[#F7F9F4] relative shadow-2xl bg-noise overflow-x-clip">
        {/* TanStack Router Provider */}
        <RouterProvider
          router={router}
          context={{
            currentUser,
            setCurrentUser: handleSetCurrentUser,
            selectedCrop,
            setSelectedCrop,
            isChatOpen,
            setIsChatOpen,
            handleOpenAuthModal,
            handleLogout,
          }}
        />

        {/* Global Floating Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          selectedCrop={selectedCrop}
          currentUser={currentUser}
        />

        {/* Global Signup & Login Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onLoginSuccess={(user) => {
            handleSetCurrentUser(user);
            router.navigate({ to: "/dashboard" });
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

