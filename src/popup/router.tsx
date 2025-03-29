import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import React from 'react';

import CustomDelayView from './views/CustomDelayView';
import MainView from './views/MainView';
import ManageTabsView from './views/ManageTabsView';
import NotFoundView from './views/NotFoundView';
import RecurringDelayView from './views/RecurringDelayView';
import SettingsView from './views/SettingsView';

const rootRoute = createRootRoute({
  notFoundComponent: NotFoundView,
});

const mainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MainView,
});

const customDelayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/custom-delay',
  component: CustomDelayView,
});

const recurringDelayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recurring-delay',
  component: RecurringDelayView,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsView,
});

const manageTabsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/manage-tabs',
  component: ManageTabsView,
});

const routeTree = rootRoute.addChildren([
  mainRoute,
  customDelayRoute,
  recurringDelayRoute,
  settingsRoute,
  manageTabsRoute,
]);

const memoryHistory = createMemoryHistory({
  initialEntries: ['/'],
});

const router = createRouter({
  routeTree,
  history: memoryHistory,
  defaultPreload: 'render',
  defaultViewTransition: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function Router() {
  return <RouterProvider router={router} />;
}
