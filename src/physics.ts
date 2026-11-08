// SI internally. Silicon, 300 K; ni and epsilon_r follow Neamen 4e Ex. 7.1–7.5.
export const q=1.602176634e-19, k=1.380649e-23, T=300, eps=11.7*8.8541878128e-12, ni=1.5e16;
export type Input={na:number;nd:number;va:number}; // concentrations m^-3, voltage V
export function solve({na,nd,va}:Input){
 if(![na,nd,va].every(Number.isFinite)||na<1e20||na>1e23||nd<1e20||nd>1e23||va < -5 || va>0.4) throw new Error('Outside teaching range: doping 10¹⁴–10¹⁷ cm⁻³; bias −5 to +0.4 V.');
 const vt=k*T/q,vbi=vt*Math.log(na*nd/ni**2),barrier=vbi-va;
 if(barrier<=0) throw new Error('Nonpositive barrier: depletion approximation is invalid.');
 const w=Math.sqrt(2*eps*barrier/q*(1/na+1/nd)),xp=w*nd/(na+nd),xn=w*na/(na+nd),peak=-2*barrier/w,cap=eps/w;
 const injection=Math.max(ni**2/na**2,ni**2/nd**2)*Math.exp(va/vt);
 return {na,nd,va,vt,vbi,barrier,w,xp,xn,peak,cap,injection};
}
export type Solution=ReturnType<typeof solve>;
export function at(s:Solution,x:number){
 let field=0,potential=0,rho=0;
 if(x>=s.xn) potential=s.barrier;
 else if(x>= -s.xp && x<0){rho=-q*s.na;field=-q*s.na/eps*(x+s.xp);potential=q*s.na/(2*eps)*(x+s.xp)**2;}
 else if(x>=0){rho=q*s.nd;field=-q*s.nd/eps*(s.xn-x);potential=s.barrier-q*s.nd/(2*eps)*(s.xn-x)**2;}
 return {x,field,potential,rho,energy:-q*potential};
}
export function sample(s:Solution){
 const xs=Array.from({length:401},(_,i)=>-s.xp-.2*s.w+i*1.4*s.w/400);
 xs.push(-s.xp,0,s.xn); return [...new Set(xs)].sort((a,b)=>a-b).map(x=>at(s,x));
}
export function csv(s:Solution){return `# Silicon 300 K; depletion approximation; NA_m^-3=${s.na}; ND_m^-3=${s.nd}; Va_V=${s.va}\n`+'x_m,rho_C_m^-3,field_V_m^-1,potential_V,electron_energy_J\n'+sample(s).map(p=>[p.x,p.rho,p.field,p.potential,p.energy].join(',')).join('\n');}
