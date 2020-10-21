import React, {
  useContext,
  useEffect,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  unstable_useTransition as useTransition,
  Suspense,
  useState,
} from 'react';
import LoadingSpinner from 'views/components/LoadingSpinner';
import ApiError from 'views/errors/ApiError';
import ErrorBoundary from 'views/errors/ErrorBoundary';
import RoutingContext, { RouteComponentProps } from './RoutingContext';

const SUSPENSE_CONFIG = { timeoutMs: 2000 };

/**
 * A component that accesses the current route entry from RoutingContext and renders
 * that entry.
 */
const RouterRenderer: React.FC = () => {
  // Access the router
  const router = useContext(RoutingContext);
  if (!router) {
    throw new Error('You should not use <RouterRenderer> outside a <RoutingContext>');
  }

  // Improve the route transition UX by delaying transitions: show the previous route entry
  // for a brief period while the next route is being prepared. See
  // https://reactjs.org/docs/concurrent-mode-patterns.html#transitions
  const [startTransition, isPending] = useTransition(SUSPENSE_CONFIG);

  // Store the active entry in state - this allows the renderer to use features like
  // useTransition to delay when state changes become visible to the user.
  const [routeEntry, setRouteEntry] = useState(router.get());

  // On mount subscribe for route changes
  useEffect(() => {
    // Check if the route has changed between the last render and commit:
    const currentEntry = router.get();
    if (currentEntry !== routeEntry) {
      // if there was a concurrent modification, rerender and exit
      setRouteEntry(currentEntry);
      return undefined;
    }

    // If there *wasn't* a concurrent change to the route, then the UI
    // is current: subscribe for subsequent route updates
    const dispose = router.subscribe((nextEntry) => {
      // startTransition() delays the effect of the setRouteEntry (setState) call
      // for a brief period, continuing to show the old state while the new
      // state (route) is prepared.
      startTransition(() => {
        setRouteEntry(nextEntry);
      });
    });
    return () => dispose();

    // Note: this hook updates routeEntry manually; we exclude that variable
    // from the hook deps to avoid recomputing the effect after each change
    // triggered by the effect itself.
    // eslint-disable-next-line
  }, [router, startTransition]);

  // The current route value is an array of matching entries - one entry per
  // level of routes (to allow nested routes). We have to map each one to a
  // RouteComponent to allow suspending, and also pass its children correctly.
  // Conceptually, we want this structure:
  // ```
  // <RouteComponent
  //   component={entry[0].component}
  //   prepared={entrry[0].prepared}>
  //   <RouteComponent
  //     component={entry[1].component}
  //     prepared={entry[1].prepared}>
  //       // continue for nested items...
  //   </RouteComponent>
  // </RouteComponent>
  // ```
  // To achieve this, we reverse the list so we can start at the bottom-most
  // component, and iteratively construct parent components w the previous
  // value as the child of the next one:
  const reversedItems = [...routeEntry.entries].reverse(); // reverse is in place so we make a copy
  const firstItem = reversedItems[0];
  // the bottom-most component is special since it will have no children
  // (though we could probably just pass null children to it)
  let routeComponent = (
    <RouteComponent
      component={firstItem.component}
      prepared={firstItem.prepared}
      routeData={firstItem.routeData}
    />
  );
  for (let ii = 1; ii < reversedItems.length; ii++) {
    const nextItem = reversedItems[ii];
    routeComponent = (
      <RouteComponent
        component={nextItem.component}
        prepared={nextItem.prepared}
        routeData={nextItem.routeData}
      >
        {routeComponent}
      </RouteComponent>
    );
  }

  // Routes can error so wrap in an <ErrorBoundary>
  // Routes can suspend, so wrap in <Suspense>
  return (
    <ErrorBoundary errorPage={() => <ApiError dataName="the page" />}>
      <Suspense fallback={<LoadingSpinner />}>
        {/* Indicate to the user that a transition is pending, even while showing the previous UI */}
        {isPending ? <div>Loading pending...</div> : null}
        {routeComponent}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * The `component` property from the route entry is a Resource, which may or may not be ready.
 * We use a helper child component to unwrap the resource with component.read(), and then
 * render it if its ready.
 *
 * NOTE: calling routeEntry.route.component.read() directly in RouteRenderer woldn't work the
 * way we'd expect. Because that method could throw - either suspending or on error - the error
 * would bubble up to the *caller* of RouteRenderer. We want the suspend/error to bubble up to
 * our ErrorBoundary/Suspense components, so we have to ensure that the suspend/error happens
 * in a child component.
 */
const RouteComponent: React.FC<RouteComponentProps<unknown, unknown>> = ({
  component,
  routeData,
  prepared,
  children,
}) => {
  const Component = component.read();
  return (
    <Component match={routeData} prepared={prepared}>
      {children}
    </Component>
  );
};

export default RouterRenderer;
