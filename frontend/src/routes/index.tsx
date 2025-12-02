import {
  createRoute,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { AppLayout } from '../app/App';
import LoginPage from '../pages/auth/LoginPage';
import RegistrationPage from '../pages/auth/RegistrationPage';
import ProfilePage from '../pages/profile/ProfilePage';
import LogoutPage from '../pages/auth/LogoutPage';
import { IndexRedirect } from './IndexRedirect';

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginPage,
});

const registrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'registration',
  component: RegistrationPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'me',
  component: ProfilePage,
});

const logoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'logout',
  component: LogoutPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registrationRoute,
  profileRoute,
  logoutRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
