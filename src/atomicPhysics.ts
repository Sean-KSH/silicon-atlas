// SI throughout: J, m, kg, s. Display conversions belong to the UI.
export const qe=1.602176634e-19, hbar=1.054571817e-34, m0=9.1093837015e-31;
function positive(...v:number[]){if(v.some(x=>!Number.isFinite(x)||x<=0))throw new Error('Expected finite positive physical inputs');}
export function wellEnergy(n:number,L:number,m:number){positive(n,L,m);if(!Number.isInteger(n))throw new Error('n must be a positive integer');return hbar*hbar*Math.PI**2*n*n/(2*m*L*L)}
export function wellPsi(n:number,L:number,x:number){positive(n,L);if(!Number.isInteger(n)||!Number.isFinite(x))throw new Error('Invalid wavefunction input');return x<=0||x>=L?0:Math.sqrt(2/L)*Math.sin(n*Math.PI*x/L)}
export function transmission(E:number,V:number,d:number,m:number){positive(E,m);if(!Number.isFinite(V)||!Number.isFinite(d)||V<0||d<0)throw new Error('Barrier height and width must be finite and nonnegative');if(V===0||d===0)return 1;
 const delta=V-E,z=d*Math.sqrt(2*m*Math.abs(delta))/hbar;
 // sinc/sinhc removes the removable singularity at E=V.
 const f=z<1e-5?1+(delta>=0?1:-1)*z*z/6:delta>0?Math.sinh(z)/z:Math.sin(z)/z;
 return 1/(1+m*V*V*d*d/(2*hbar*hbar*E)*f*f);
}
export function band(k:number,t:number,a:number){positive(a);if(!Number.isFinite(k)||!Number.isFinite(t)||t<0)throw new Error('Invalid band inputs');const curvature=2*t*a*a*Math.cos(k*a),velocity=2*t*a*Math.sin(k*a)/hbar;return {energy:-2*t*Math.cos(k*a),velocity,curvature,mass:Math.abs(Math.cos(k*a))<1e-12||t===0?null:hbar*hbar/curvature}}
export function chainLevels(N:number,t:number){if(!Number.isInteger(N)||N<2||!Number.isFinite(t)||t<0)throw new Error('Invalid chain');return Array.from({length:N},(_,j)=>-2*t*Math.cos((j+1)*Math.PI/(N+1)))}
export type Point3=[number,number,number];
export const diamondAtoms:(Point3 & {basis?:number})[]=[];
for(let x=0;x<=4;x++)for(let y=0;y<=4;y++)for(let z=0;z<=4;z++){
 const p:[number,number,number]=[x/4,y/4,z/4];
 if(x%2===0&&y%2===0&&z%2===0&&(x+y+z)%4===0)diamondAtoms.push(Object.assign(p,{basis:0}));
 else if(x%2===1&&y%2===1&&z%2===1&&(x+y+z-3)%4===0)diamondAtoms.push(Object.assign(p,{basis:1}));
}
export const diamondBonds=diamondAtoms.flatMap((p,i)=>diamondAtoms.flatMap((q,j)=>j>i&&Math.abs(p.reduce((s,v,k)=>s+(v-q[k])**2,0)-3/16)<1e-8?[[i,j]]:[]));
