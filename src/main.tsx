import BenchLab from './BenchLab';
import PhotonicsLab from './PhotonicsLab';
import MosLab from './MosLab';
import DiodeLab from './DiodeLab';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import JunctionLab from './JunctionLab';
import FabricationLab from './FabricationLab';
import TransportLab from './TransportLab';
import EquilibriumLab from './EquilibriumLab';
import AtomicLab from './AtomicLab';
import Wafer from './Wafer';
import './style.css';
function Modules() {
  const [module, setModule] = useState(
    location.hash === '#bench'
      ? 'bench'
      : location.hash === '#photonics'
        ? 'photonics'
        : location.hash === '#mos'
          ? 'mos'
          : location.hash === '#diode'
            ? 'diode'
            : location.hash === '#fabrication'
              ? 'fabrication'
              : location.hash === '#transport'
                ? 'transport'
                : location.hash === '#equilibrium'
                  ? 'equilibrium'
                  : location.hash.startsWith('#atomic')
                    ? 'atomic'
                    : location.hash === '#junction'
                      ? 'junction'
                      : 'wafer',
  );
  React.useEffect(() => {
    const update = () =>
      setModule(
        location.hash === '#bench'
          ? 'bench'
          : location.hash === '#photonics'
            ? 'photonics'
            : location.hash === '#mos'
              ? 'mos'
              : location.hash === '#diode'
                ? 'diode'
                : location.hash === '#fabrication'
                  ? 'fabrication'
                  : location.hash === '#transport'
                    ? 'transport'
                    : location.hash === '#equilibrium'
                      ? 'equilibrium'
                      : location.hash.startsWith('#atomic')
                        ? 'atomic'
                        : location.hash === '#junction'
                          ? 'junction'
                          : 'wafer',
      );
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return (
    <>
      <nav className="module-nav">
        <a href="#wafer" aria-current={module === 'wafer' ? 'page' : undefined}>
          01 / Silica to wafer
        </a>
        <a href="#junction" aria-current={module === 'junction' ? 'page' : undefined}>
          02 / P–n junction
        </a>
        <a href="#atomic" aria-current={module === 'atomic' ? 'page' : undefined}>
          03 / Atoms to bands
        </a>
        <a href="#equilibrium" aria-current={module === 'equilibrium' ? 'page' : undefined}>
          04 / Equilibrium
        </a>
        <a href="#transport" aria-current={module === 'transport' ? 'page' : undefined}>
          05 / Transport & lifetime
        </a>
        <a href="#fabrication" aria-current={module === 'fabrication' ? 'page' : undefined}>
          06 / Fabricate a MOSFET
        </a>
        <a href="#diode" aria-current={module === 'diode' ? 'page' : undefined}>
          07 / PN diode
        </a>
        <a href="#mos" aria-current={module === 'mos' ? 'page' : undefined}>
          08 / Gate control
        </a>
        <a href="#photonics" aria-current={module === 'photonics' ? 'page' : undefined}>
          09 / Photonic devices
        </a>
        <a href="#bench" aria-current={module === 'bench' ? 'page' : undefined}>
          10 / Measurement bench
        </a>
      </nav>
      {module === 'bench' ? (
        <BenchLab />
      ) : module === 'photonics' ? (
        <PhotonicsLab />
      ) : module === 'mos' ? (
        <MosLab />
      ) : module === 'diode' ? (
        <DiodeLab />
      ) : module === 'fabrication' ? (
        <FabricationLab />
      ) : module === 'transport' ? (
        <TransportLab />
      ) : module === 'equilibrium' ? (
        <EquilibriumLab />
      ) : module === 'atomic' ? (
        <AtomicLab />
      ) : module === 'wafer' ? (
        <Wafer />
      ) : (
        <JunctionLab />
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Modules />);
