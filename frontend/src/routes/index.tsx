import {
  createRoute,
  createRootRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "../app/App";
import LoginPage from "../pages/auth/LoginPage";
import RegistrationPage from "../pages/auth/RegistrationPage";
import ProfilePage from "../pages/profile/ProfilePage";
import LogoutPage from "../pages/auth/LogoutPage";
import ErrorPage from "../pages/auth/ErrorPage";
import { IndexRedirect } from "./IndexRedirect";
import { isAuthenticated } from "../utils/auth.utils";

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRedirect,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "login",
  component: LoginPage,
  beforeLoad: async () => {
    // Nếu user đã đăng nhập trong store, redirect ngay
    if (isAuthenticated()) {
      throw redirect({
        to: "/",
      });
    }
    // Nếu store chưa có session, check từ API
    const { checkSessionFromAPI } = await import("../utils/auth.utils");
    const isAuth = await checkSessionFromAPI();
    if (isAuth) {
      throw redirect({
        to: "/",
      });
    }
  },
});

const registrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "registration",
  component: RegistrationPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      flow: (search.flow as string) || undefined,
    };
  },
  beforeLoad: async () => {
    // Nếu user đã đăng nhập trong store, redirect ngay
    if (isAuthenticated()) {
      throw redirect({
        to: "/",
      });
    }
    // Nếu store chưa có session, check từ API
    const { checkSessionFromAPI } = await import("../utils/auth.utils");
    const isAuth = await checkSessionFromAPI();
    if (isAuth) {
      throw redirect({
        to: "/",
      });
    }
  },
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "me",
  component: ProfilePage,
});

const logoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "logout",
  component: LogoutPage,
});

const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "error",
  component: ErrorPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: (search.id as string) || undefined,
    };
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registrationRoute,
  profileRoute,
  logoutRoute,
  errorRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
