import {useRef} from 'react';
import {STEM_RADIUS} from './draft.js';

function PositionPad({stem,onChange}){
  const pad=useRef(null);
  const move=event=>{
    const rect=pad.current?.getBoundingClientRect();
    if(!rect)return;
    let x=(event.clientX-rect.left-66)/54,z=(event.clientY-rect.top-66)/54;
    const distance=Math.hypot(x,z);
    if(distance>1){x/=distance;z/=distance;}
    onChange({x:x*STEM_RADIUS,z:z*STEM_RADIUS});
  };
  const nudge=event=>{
    const step=.05,keys={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
    const delta=keys[event.key];
    if(!delta)return;
    event.preventDefault();
    onChange({x:stem.x+delta[0],z:stem.z+delta[1]});
  };
  return <div ref={pad} className="position-pad" role="group" aria-label="Position" tabIndex={0} onKeyDown={nudge} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);move(event);}} onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))move(event);}}>
    <span className="position-handle" style={{left:66+stem.x/STEM_RADIUS*54,top:66+stem.z/STEM_RADIUS*54}}/>
  </div>;
}

export default function FlowerControls({stem,onChange,onRemove,onClose,className=''}){
  return <aside className={'flower-controls '+className} aria-label="Adjust this flower">
    <button className="flower-controls-close" aria-label="Close flower controls" onClick={onClose}>×</button>
    <div className="row-between flower-height-row"><span>Flower height</span><span className="control-value">{stem.height.toFixed(2)}</span></div>
    <input type="range" aria-label="Flower height" min={-.5} max={1.5} step={.05} value={stem.height} onChange={event=>onChange({height:parseFloat(event.target.value)})}/>
    <span className="control-label">Position</span>
    <PositionPad stem={stem} onChange={onChange}/>
    <div className="row-between"><span>Rotation</span><span className="control-value">{Math.round(stem.spin)}°</span></div>
    <input type="range" aria-label="Rotation" min={0} max={360} step={1} value={stem.spin} onChange={event=>onChange({spin:parseFloat(event.target.value)})}/>
    <button className="remove-flower" onClick={onRemove}>Remove this flower</button>
  </aside>;
}
