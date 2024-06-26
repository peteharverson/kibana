/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KibanaRenderContextProvider } from '@kbn/react-kibana-context-render';
import { createBrowserHistory, History } from 'history';
import { AppMountParameters, CoreStart } from '@kbn/core/public';
import React from 'react';
import ReactDOM from 'react-dom';
import { RouteProps } from 'react-router-dom';
import { Router, Routes, Route } from '@kbn/shared-ux-router';

// This exists purely to facilitate legacy app/infra URL redirects.
// It will be removed in 8.0.0.
export async function renderApp(core: CoreStart, { element }: AppMountParameters) {
  const history = createBrowserHistory();

  ReactDOM.render(
    <KibanaRenderContextProvider {...core}>
      <LegacyApp history={history} />
    </KibanaRenderContextProvider>,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
}

const LegacyApp: React.FunctionComponent<{ history: History<unknown> }> = ({ history }) => {
  return (
    <Router history={history}>
      <Routes>
        <Route
          path={'/'}
          render={({ location }: RouteProps) => {
            if (!location) {
              return null;
            }

            let nextPath = '';
            let nextBasePath = '';
            let nextSearch;

            if (
              location.hash.indexOf('#infrastructure') > -1 ||
              location.hash.indexOf('#/infrastructure') > -1
            ) {
              nextPath = location.hash.replace(
                new RegExp(
                  '#infrastructure/|#/infrastructure/|#/infrastructure|#infrastructure',
                  'g'
                ),
                ''
              );
              nextBasePath = location.pathname.replace('app/infra', 'app/metrics');
            } else if (
              location.hash.indexOf('#logs') > -1 ||
              location.hash.indexOf('#/logs') > -1
            ) {
              nextPath = location.hash.replace(new RegExp('#logs/|#/logs/|#/logs|#logs', 'g'), '');
              nextBasePath = location.pathname.replace('app/infra', 'app/logs');
            } else {
              // This covers /app/infra and /app/infra/home (both of which used to render
              // the metrics inventory page)
              nextPath = 'inventory';
              nextBasePath = location.pathname.replace('app/infra', 'app/metrics');
              nextSearch = undefined;
            }

            // app/infra#infrastructure/metrics/:type/:node was changed to app/metrics/detail/:type/:node, this
            // accounts for that edge case
            nextPath = nextPath.replace('metrics/', 'detail/');

            // Query parameters (location.search) will arrive as part of location.hash and not location.search
            const nextPathParts = nextPath.split('?');
            nextPath = nextPathParts[0];
            nextSearch = nextPathParts[1] ? nextPathParts[1] : undefined;

            const builtPathname = `${nextBasePath}/${nextPath}`;
            const builtSearch = nextSearch ? `?${nextSearch}` : '';

            let nextUrl = `${builtPathname}${builtSearch}`;

            nextUrl = nextUrl.replace('//', '/');

            window.location.href = nextUrl;

            return null;
          }}
        />
      </Routes>
    </Router>
  );
};
