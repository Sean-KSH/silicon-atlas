import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MODULES, moduleFromHash } from './modules';
// Stylesheets are loaded eagerly, in the same order as before code splitting, so a module's
// appearance never depends on which other modules were visited first.
import './junction.css';
import './bench.css';
import './photonics.css';
import './mos.css';
import './diode.css';
import './fabrication.css';
import './transport.css';
import './equilibrium.css';
import './atomic.css';
import './growth.css';
import './product.css';
import './style.css';

// Each module is a separate chunk, so the first page load only downloads the module in view.
const views: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  wafer: lazy(() => import('./Wafer')),
  atomic: lazy(() => import('./AtomicLab')),
  equilibrium: lazy(() => import('./EquilibriumLab')),
  transport: lazy(() => import('./TransportLab')),
  fabrication: lazy(() => import('./FabricationLab')),
  junction: lazy(() => import('./JunctionLab')),
  diode: lazy(() => import('./DiodeLab')),
  mos: lazy(() => import('./MosLab')),
  photonics: lazy(() => import('./PhotonicsLab')),
  bench: lazy(() => import('./BenchLab')),
};

function Modules() {
  const [module, setModule] = useState(() => moduleFromHash(location.hash));
  useEffect(() => {
    const update = () => setModule(moduleFromHash(location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  // Keep the current module visible in the phone-width scrolling navigation.
  useEffect(() => {
    document
      .querySelector('.module-nav a[aria-current]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [module]);
  const View = views[module];
  return (
    <>
      <nav className="module-nav" aria-label="Modules">
        {MODULES.map((m) => (
          <a
            key={m.id}
            href={`#${m.id}`}
            title={m.summary}
            aria-current={module === m.id ? 'page' : undefined}
          >
            {m.number} / {m.label}
          </a>
        ))}
      </nav>
      <Suspense
        fallback={
          <p className="module-loading" role="status">
            Loading module…
          </p>
        }
      >
        <View />
      </Suspense>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Modules />);
