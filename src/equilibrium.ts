/** SI calculation layer: energies J, concentrations m^-3, mobility m²/(V s). */
export const Q=1.602176634e-19, KB=1.380649e-23;
export const materials={
 Si:{name:'Silicon',gap:1.12*Q,nc300:2.8e25,nv300:1.04e25,donor:'Phosphorus',acceptor:'Boron',donorBinding:.045*Q,acceptorBinding:.045*Q,muN:.135,muP:.048},
 GaAs:{name:'Gallium arsenide',gap:1.42*Q,nc300:4.7e23,nv300:7e24,donor:'Tellurium',acceptor:'Zinc',donorBinding:.0058*Q,acceptorBinding:.0307*Q,muN:.85,muP:.04}
}as const;
export type EquilibriumInput={material:keyof typeof materials;temperature:number;donors:number;acceptors:number;statistics:'MB'|'FD'};
export function occupation(z:number){return z>0?Math.exp(-z)/(1+Math.exp(-z)):1/(1+Math.exp(z))}
/** Normalized F_(1/2)(eta); epsilon=u² removes the endpoint sqrt singularity.
 * Composite Simpson quadrature; upper epsilon=max(eta,0)+48, negligible tail.
 */
export function fermiHalf(eta:number,steps=128){if(!Number.isFinite(eta)||steps<16||steps%2)throw new Error('Invalid integral input');const limit=Math.sqrt(Math.max(eta,0)+48),h=limit/steps;let sum=0;for(let i=0;i<=steps;i++){const u=i*h;sum+=(i===0||i===steps?1:i%2?4:2)*u*u*occupation(u*u-eta)}return 4/Math.sqrt(Math.PI)*h/3*sum}
export function conditions(input:EquilibriumInput){const{temperature:T,donors:ND,acceptors:NA}=input;if(!materials[input.material]||!['MB','FD'].includes(input.statistics)||!Number.isFinite(T)||T<40||T>800||[ND,NA].some(n=>!Number.isFinite(n)||n<0||n>1e24))throw new Error('Supported domain: 40–800 K; each dopant 0–10¹⁸ cm⁻³.');const mat=materials[input.material],kt=KB*T,nc=mat.nc300*(T/300)**1.5,nv=mat.nv300*(T/300)**1.5;return{mat,kt,nc,nv,ec:mat.gap,ev:0,ed:mat.gap-mat.donorBinding,ea:mat.acceptorBinding}}
export function populations(ef:number,input:EquilibriumInput,steps=128,fullIonization=false){const c=conditions(input),factor=(eta:number)=>input.statistics==='MB'?Math.exp(eta):fermiHalf(eta,steps);const n=c.nc*factor((ef-c.ec)/c.kt),p=c.nv*factor(-ef/c.kt);const nd=fullIonization?input.donors:input.donors*occupation((ef-c.ed)/c.kt+Math.log(2)),na=fullIonization?input.acceptors:input.acceptors*occupation((c.ea-ef)/c.kt+Math.log(4));const donorNeutral=fullIonization?0:input.donors*occupation((c.ed-ef)/c.kt-Math.log(2)),acceptorNeutral=fullIonization?0:input.acceptors*occupation((ef-c.ea)/c.kt-Math.log(4));
 // Keep the tiny neutral fractions explicit: ND+=ND minus ND0 rounds to ND
 // in deep compensation, but ND0 can still determine the Fermi energy.
 return{n,p,nd,na,residual:(p-n)+(input.donors-input.acceptors)+(acceptorNeutral-donorNeutral)}}
function root(input:EquilibriumInput,steps:number,fullIonization:boolean){const c=conditions(input);let lo=-c.ec,hi=2*c.ec,iterations=0;
 if(populations(lo,input,steps,fullIonization).residual<=0||populations(hi,input,steps,fullIonization).residual>=0)throw new Error('Charge-neutrality root is not bracketed.');
 for(;iterations<180;iterations++){const mid=(lo+hi)/2,r=populations(mid,input,steps,fullIonization);if(r.residual>0)lo=mid;else hi=mid;if(hi-lo<1e-12*Q)break;}
 const ef=(lo+hi)/2,r=populations(ef,input,steps,fullIonization),relative=Math.abs(r.residual)/Math.max(r.n+r.na,r.p+r.nd,Number.MIN_VALUE);
 if(iterations>=180||!Number.isFinite(relative)||relative>1e-8)throw new Error(`Charge-neutrality convergence failure (relative residual ${relative}).`);
 return{ef,...r,relative,iterations:iterations+1};
}
export function solveEquilibrium(input:EquilibriumInput,steps=128,fullIonization=false){const c=conditions(input),r=root(input,steps,fullIonization),intrinsic=root({...input,donors:0,acceptors:0},steps,false),niMB=Math.sqrt(c.nc*c.nv)*Math.exp(-c.ec/(2*c.kt));const etaN=(r.ef-c.ec)/c.kt,etaP=-r.ef/c.kt;return{...input,...c,...r,ei:intrinsic.ef,ni:intrinsic.n,niMB,etaN,etaP,boltzmannValid:Math.max(etaN,etaP)<=-3,sigma:Q*(r.n*c.mat.muN+r.p*c.mat.muP),massAction:r.n*r.p/(niMB*niMB)}}
export type EquilibriumResult=ReturnType<typeof solveEquilibrium>;
export function energyDistributions(s:EquilibriumResult,count=361){const low=-10*s.kt,high=s.ec+10*s.kt;return Array.from({length:count},(_,i)=>{const energy=low+(high-low)*i/(count-1),f=occupation((energy-s.ef)/s.kt),hole=occupation((s.ef-energy)/s.kt),gc=energy>s.ec?2*s.nc/Math.sqrt(Math.PI)/s.kt**1.5*Math.sqrt(energy-s.ec):0,gv=energy<0?2*s.nv/Math.sqrt(Math.PI)/s.kt**1.5*Math.sqrt(-energy):0;return{energy,f,hole,gc,gv,electrons:gc*(s.statistics==='FD'?f:Math.exp((s.ef-energy)/s.kt)),holes:gv*(s.statistics==='FD'?hole:Math.exp((energy-s.ef)/s.kt))}})}
export function equilibriumCsv(s:EquilibriumResult){const header='energy_J,dos_c_per_J_m3,dos_v_per_J_m3,f_FD,hole_FD,electrons_per_J_m3,holes_per_J_m3,material,statistics,T_K,ND_per_m3,NA_per_m3,EF_J,n_per_m3,p_per_m3,NDplus_per_m3,NAminus_per_m3,conductivity_S_per_m';return[header,...energyDistributions(s).map(r=>[r.energy,r.gc,r.gv,r.f,r.hole,r.electrons,r.holes,s.material,s.statistics,s.temperature,s.donors,s.acceptors,s.ef,s.n,s.p,s.nd,s.na,s.sigma].join(','))].join('\n')}
