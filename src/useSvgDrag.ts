import {useRef,useState} from 'react';
import type {PointerEvent} from 'react';
/** Map screen pointers through the SVG transform, including responsive scaling. */
export function useSvgDrag(onMove:(dx:number,dy:number)=>void,onStart?:()=>void){
 const origin=useRef<{x:number;y:number;id:number}|null>(null);
 const[dragging,setDragging]=useState(false);
 const point=(e:PointerEvent<SVGGElement>)=>{const matrix=e.currentTarget.ownerSVGElement?.getScreenCTM();return matrix?new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()):null};
 const finish=(e:PointerEvent<SVGGElement>)=>{if(origin.current?.id!==e.pointerId)return;origin.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)};
 return {dragging,handlers:{onPointerDown:(e:PointerEvent<SVGGElement>)=>{if(e.button!==0||origin.current)return;const p=point(e);if(!p)return;e.preventDefault();origin.current={x:p.x,y:p.y,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);onStart?.()},onPointerMove:(e:PointerEvent<SVGGElement>)=>{const o=origin.current;if(!o||o.id!==e.pointerId)return;const p=point(e);if(p)onMove(p.x-o.x,p.y-o.y)},onPointerUp:finish,onPointerCancel:finish,onLostPointerCapture:()=>{origin.current=null;setDragging(false)}}};
}
