import React from 'react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

import CustomDelayView from './views/CustomDelayView';
import MainView from './views/MainView';
import NotFoundView from './views/NotFoundView';
import RecurringDelayView from './views/RecurringDelayView';

// Define the root route
const rootRoute = createRootRoute({
  notFoundComponent: NotFoundView,
});

// Define the routes
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

// Create the route tree using the routes
const routeTree = rootRoute.addChildren([
  mainRoute,
  customDelayRoute,
  recurringDelayRoute,
]);

// Create a memory history instance for Chrome extension environment
const memoryHistory = createMemoryHistory({
  initialEntries: ['/'], // Start at the main view
});

// Create the router using the route tree and memory history
const router = createRouter({
  routeTree,
  history: memoryHistory,
  defaultPreload: 'render',
  defaultViewTransition: true,
});

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Create and export the router provider component
export default function Router() {
  return <RouterProvider router={router} />;
}
