import React, { useEffect } from "react";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { ShopPage } from "./pages/Shop";
import { NotFound } from "./pages/NotFound";
import { User } from "./types";

export interface AppRouterContext {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  handleOpenAuthModal: (mode?: "login" | "signup") => void;
  handleLogout: () => void;
}

// Root Route
const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      window.scrollTo(0, 0);
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  return <Outlet />;
}

// Home Route ("/")
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexComponent,
});

function IndexComponent() {
  const context = rootRoute.useRouteContext();

  return (
    <Landing
      currentUser={context.currentUser}
      selectedCrop={context.selectedCrop}
      setSelectedCrop={context.setSelectedCrop}
      setIsChatOpen={context.setIsChatOpen}
      handleOpenAuthModal={context.handleOpenAuthModal}
      handleLogout={context.handleLogout}
    />
  );
}

// Dashboard Route ("/dashboard") - Protected Route for logged-in members only
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: ({ context }) => {
    if (!context.currentUser) {
      context.handleOpenAuthModal("login");
      throw redirect({
        to: "/",
      });
    }
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();
  const context = rootRoute.useRouteContext();

  useEffect(() => {
    document.title = "Dashboard Petani & Kalender Tanam Sawah — CahTani AI";
  }, []);

  useEffect(() => {
    if (!context.currentUser) {
      context.handleOpenAuthModal("login");
      navigate({ to: "/" });
    }
  }, [context.currentUser, navigate]);

  if (!context.currentUser) {
    return null;
  }

  return (
    <Dashboard
      currentUser={context.currentUser}
      onNavigateHome={() => navigate({ to: "/" })}
      onNavigateShop={() => navigate({ to: "/shop" })}
      onOpenChat={() => context.setIsChatOpen(true)}
      onOpenAuthModal={context.handleOpenAuthModal}
      onLogout={context.handleLogout}
    />
  );
}

// Shop Route ("/shop")
const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop",
  component: ShopComponent,
});

function ShopComponent() {
  const navigate = useNavigate();
  const context = rootRoute.useRouteContext();

  useEffect(() => {
    document.title = "Katalog Rekomendasi Pupuk, Obat & Alat Tani Presisi — CahTani AI";
    window.scrollTo(0, 0);
  }, []);

  return (
    <ShopPage
      currentUser={context.currentUser}
      onNavigateHome={() => navigate({ to: "/" })}
      onNavigateDashboard={() => navigate({ to: "/dashboard" })}
      onOpenChat={() => context.setIsChatOpen(true)}
      onOpenAuthModal={context.handleOpenAuthModal}
      onLogout={context.handleLogout}
    />
  );
}

const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute, shopRoute]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
  context: {
    currentUser: null,
    setCurrentUser: () => {},
    selectedCrop: "padi",
    setSelectedCrop: () => {},
    isChatOpen: false,
    setIsChatOpen: () => {},
    handleOpenAuthModal: () => {},
    handleLogout: () => {},
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
