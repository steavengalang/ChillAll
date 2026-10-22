import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DocsLayout } from './docs/DocsLayout';
import { NotFound } from './docs/NotFound';
import { componentNav } from './docs/nav.generated';

// docs pages are code-split: the landing page never pays for the docs engine or the component bundle
const DocsHome = lazy(() => import('./docs/DocsHome').then((m) => ({ default: m.DocsHome })));
const ComponentPage = lazy(() => import('./docs/ComponentPage').then((m) => ({ default: m.ComponentPage })));
const GuidePage = lazy(() => import('./docs/GuidePage').then((m) => ({ default: m.GuidePage })));

const Fallback = () => <div className="dx-page"><div className="dx-loading" aria-busy="true">Loading…</div></div>;

/** Old URLs (/docs/chilltable, /docs/chillalert/toast ...) keep working. */
function ComponentRoute() {
  const { id = '' } = useParams();
  const bare = id.replace(/^chill/, '');
  if (id.startsWith('chill') && componentNav.some((n) => n.id === bare)) return <Navigate to={`/docs/${bare}`} replace />;
  return <ComponentPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<DocsHome />} />
            <Route path="guide/:id" element={<GuidePage />} />
            <Route path="installation" element={<Navigate to="/docs/guide/installation" replace />} />
            <Route path="chillalert/*" element={<Navigate to="/docs/alert" replace />} />
            <Route path=":id" element={<ComponentRoute />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
