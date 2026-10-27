/* Original implementation of a document-scale, morphing navigation instrument. */
(() => {
  'use strict';
  const fine=matchMedia('(min-width: 1024px) and (pointer: fine) and (hover: hover)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
  const mix=(a,b,p)=>a+(b-a)*p;
  const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  const definitions=[['hello','EZN24'],['projects','PROJECTS'],['translations','LOCALIZATION'],['about','ABOUT'],['next','KEEP MAKING']];
  const root=document.createElement('aside');root.className='scroll-instrument';root.setAttribute('aria-label','Page navigation');
  root.innerHTML='<div class="instrument-frost"></div><div class="instrument-pool instrument-pool-top"></div><div class="instrument-pool instrument-pool-bottom"></div><div class="instrument-rail" role="scrollbar" tabindex="0" aria-controls="main" aria-label="Page position" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100"><div class="instrument-ticks" aria-hidden="true"></div><div class="instrument-viewport" aria-hidden="true"></div><div class="instrument-needle" aria-hidden="true"><span class="instrument-readout"></span></div><div class="instrument-ghost" aria-hidden="true"></div></div><nav class="instrument-sections" aria-label="Sections"></nav>';
  document.body.append(root);
  const rail=root.querySelector('.instrument-rail'),tickLayer=root.querySelector('.instrument-ticks'),needle=root.querySelector('.instrument-needle'),readout=root.querySelector('.instrument-readout'),ghost=root.querySelector('.instrument-ghost'),bracket=root.querySelector('.instrument-viewport'),sectionLayer=root.querySelector('.instrument-sections');
  const columns=Array.from({length:3},()=>{const viewport=document.createElement('span');viewport.className='instrument-digit-window';const column=document.createElement('span');column.className='instrument-digit-column';for(let i=0;i<10;i++){const n=document.createElement('span');n.textContent=i;column.append(n);}viewport.append(column);readout.append(viewport);return column;});
  readout.append(document.createTextNode('%'));
  const ticks=Array.from({length:101},(_,percent)=>{const tick=document.createElement('div');tick.className='instrument-tick';tick.innerHTML='<i></i>'+(percent%5===0?'<span>'+percent+'</span>':'');tickLayer.append(tick);return {percent,element:tick,line:tick.firstElementChild,label:tick.querySelector('span')};});
  const sections=definitions.map(([id,label],index)=>{
    const element=document.getElementById(id);if(!element)return null;
    const hit=document.createElement('a');hit.href='#'+id;hit.className='instrument-section-link';hit.setAttribute('aria-label','Jump to '+label);sectionLayer.append(hit);
    const letters=[...label].map(char=>{const el=document.createElement('span');el.className='instrument-letter';el.textContent=char===' '?'\u00a0':char;el.setAttribute('aria-hidden','true');sectionLayer.append(el);return el;});
    const section={id,label,index,element,hit,letters,widths:[],offsets:[],total:0,anchor:0,hover:false,flash:0};
    hit.addEventListener('click',event=>{event.preventDefault();section.flash=performance.now()+400;jumpTo(section.anchor-56);});
    hit.addEventListener('pointerenter',()=>{section.hover=true;wake();});hit.addEventListener('pointerleave',()=>{section.hover=false;wake();});
    hit.addEventListener('focus',()=>{section.hover=true;wake();});hit.addEventListener('blur',()=>{section.hover=false;wake();});return section;
  }).filter(Boolean);
  let height=innerHeight,width=innerWidth,docHeight=1,navHeight=56,zoom=0,zoomIntent=0,dragging=false,ghostY=null,raf=0,lastTime=0,lastScroll=scrollY,velocity=0,introStart=performance.now(),lastInput=0,snapArmed=false,tween=null,hoverTimer=0,prevDigits='',viewY=scrollY,dragStartY=0,dragMoved=0,isVisible=document.visibilityState==='visible';
  function geometry(){height=innerHeight;width=innerWidth;navHeight=document.querySelector('.nav')?.getBoundingClientRect().height||56;docHeight=document.documentElement.scrollHeight;sections.forEach(section=>{
    section.anchor=section.element.getBoundingClientRect().top+scrollY;section.total=0;section.widths=[];section.offsets=[];
    section.letters.forEach(letter=>{const advance=parseFloat(getComputedStyle(letter).width)||letter.offsetWidth;section.offsets.push(section.total);section.widths.push(advance);section.total+=advance;});
  });wake();}
  function map(){const base=navHeight+12,span=Math.max(1,height-base-12);return {base,span};}
  function jumpTo(y,duration){const target=clamp(y,0,Math.max(0,docHeight-height));if(reduced.matches){window.scrollTo({top:target,behavior:'instant'});return;}const distance=Math.abs(target-scrollY);tween={from:scrollY,to:target,start:performance.now(),duration:duration||1250*(.4+.6*Math.min(1,distance/(height*2.5)))};snapArmed=false;wake();}
  function aim(clientY,drag=false){const m=map();ghostY=clamp(clientY,m.base,m.base+m.span);if(drag){tween=null;window.scrollTo({top:(ghostY-m.base)/m.span*Math.max(0,docHeight-height),behavior:'instant'});}wake();}
  function wake(){if(!raf&&isVisible&&fine.matches)raf=requestAnimationFrame(frame);}
  function frame(time){
    raf=0;if(!fine.matches||!isVisible)return;
    const elapsed=time-lastTime;
    const dt=lastTime&&elapsed<100?Math.min(1/30,elapsed/1000):1/60;lastTime=time;
    if(tween){const p=clamp((time-tween.start)/tween.duration);window.scrollTo({top:mix(tween.from,tween.to,1-Math.pow(1-p,4)),behavior:'instant'});if(p===1)tween=null;}
    const scrollGoal=scrollY;
    viewY=reduced.matches?scrollGoal:mix(viewY,scrollGoal,1-Math.exp(-16*dt));
    if(Math.abs(viewY-scrollGoal)<.02)viewY=scrollGoal;
    const y=viewY,max=Math.max(1,docHeight-height),progress=clamp(y/max),m=map();
    const instantaneous=(y-lastScroll)/dt;velocity=mix(velocity,instantaneous,1-Math.exp(-6*dt));lastScroll=y;
    const zoomTarget=reduced.matches||dragging?1:zoomIntent;zoom=reduced.matches?zoomTarget:mix(zoom,zoomTarget,1-Math.exp(-10*dt));if(Math.abs(zoom-zoomTarget)<.0005)zoom=zoomTarget;
    const z=ease(zoom),drift=mix(m.base,-12,progress),needleY=m.base+progress*m.span;
    root.style.setProperty('--instrument-zoom',z);root.classList.toggle('instrument-overview',zoom>.5);
    needle.style.transform='translate3d(0,'+needleY+'px,0)';needle.style.opacity=clamp(progress/.03);readout.style.top=needleY>height-30?'-16px':'5px';rail.setAttribute('aria-valuenow',Math.round(progress*100));
    const digits=String(Math.round(progress*100)).padStart(3,'0');if(digits!==prevDigits){columns.forEach((column,i)=>column.style.transform='translateY(-'+Number(digits[i])+'em)');prevDigits=digits;}
    bracket.style.transform='translate3d(0,'+(m.base+y/docHeight*m.span)+'px,0)';bracket.style.height=height/docHeight*m.span+'px';bracket.style.opacity=z;
    ghost.style.transform='translate3d(0,'+(ghostY??0)+'px,0)';ghost.style.opacity=ghostY===null?0:.2+.8*z;
    const intro=reduced.matches?1:clamp((time-introStart-200)/1500);
    for(const tick of ticks){
      const docY=tick.percent/100*docHeight,normal=docY-y+drift,overview=m.base+tick.percent/100*m.span,tickY=mix(normal,overview,z);
      tick.element.style.transform='translate3d(0,'+tickY+'px,0)';tick.element.style.visibility=tickY<navHeight-10||tickY>height+10?'hidden':'visible';
      const near=clamp(1-Math.abs(docY-progress*docHeight)/180),speed=clamp(Math.abs(velocity)/3000)*near*near;
      const entrance=1-Math.pow(1-clamp(intro*1.55-tick.percent*.0055),3);
      tick.line.style.transform='scaleX('+(entrance*(1+.6*speed))+')';tick.line.style.opacity=(tick.percent%5===0?.8:.4)+.2*speed;
      if(tick.label)tick.label.style.opacity=.5;
    }
    const flipLine=Math.max(navHeight+40,height*.12),top=navHeight+28,bottom=height-36;
    const states=sections.map((section,i)=>{
      const rideY=section.anchor-y+drift,rideLength=section.total*(20/34),queueY=bottom-(sections.length-1-i)*20;
      const detach=i===0?1:clamp((queueY+320-rideY-rideLength)/320);
      const flip=i===0?1:clamp((flipLine+320-rideY)/320);
      return {section,rideY,rideLength,queueY,detach,flip};
    });
    let current=0;states.forEach((state,i)=>{if(state.flip>=1)current=i;});
    root.querySelector('.instrument-pool-top').style.opacity=states.some(state=>state.flip>0)?1:0;
    root.querySelector('.instrument-pool-bottom').style.opacity=states.some(state=>state.detach<1)?1:0;
    states.forEach((state,i)=>{
      const {section,rideY,rideLength,queueY,detach,flip}=state;
      // The incoming word grows during its flight; the outgoing word shrinks
      // continuously with the next word's phase, without an active-index jump.
      const nextFlip=flip>=1?(states[i+1]?.flip||0):0;
      const currentScale=mix(22/34,16/34,nextFlip),topY=top+i*20+18*(1-nextFlip),topAlpha=mix(1,.35,nextFlip);
      const horizontal=(j,lineY,scale,alpha)=>({x:width-60-(section.total-section.offsets[j]-section.widths[j]/2)*scale,y:lineY,r:0,s:scale,a:alpha});
      const vertical=j=>({x:width-30,y:rideY+(section.total-section.offsets[j]-section.widths[j]/2)*20/34,r:-90,s:20/34,a:.35});
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      section.letters.forEach((letter,j)=>{
        let from,to,phase;
        if(flip>0){from=vertical(j);to=horizontal(j,topY,currentScale,topAlpha);phase=flip;}
        else if(detach<1){from=horizontal(j,queueY,16/34,.35);to=vertical(j);phase=detach;}
        else{from=to=vertical(j);phase=1;}
        const order=section.letters.length-1-j,p=ease(clamp(phase*(1+(section.letters.length-1)*.055)-order*.055));
        const bow=4*p*(1-p)*-28;
        let x=mix(from.x,to.x,p)+bow,ly=mix(from.y,to.y,p),rotation=mix(from.r,to.r,p),scale=mix(from.s,to.s,p),alpha=mix(from.a,to.a,p);
        const mapped=horizontal(j,m.base+section.anchor/docHeight*m.span,16/34,.85);
        x=mix(x,mapped.x,z);ly=mix(ly,mapped.y,z);rotation=mix(rotation,0,z);scale=mix(scale,mapped.s,z);alpha=mix(alpha,mapped.a,z);
        if(section.hover)alpha=1;
        letter.style.transform=`translate3d(${x}px,${ly}px,0) translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`;
        letter.style.opacity=clamp(alpha)*clamp(intro*3);letter.style.color=section.flash>time?'var(--accent)':'var(--ink)';
        const w=(Math.abs(rotation)>45?34:section.widths[j])*scale/2+2,h=(Math.abs(rotation)>45?section.widths[j]:34)*scale/2+2;
        minX=Math.min(minX,x-w);maxX=Math.max(maxX,x+w);minY=Math.min(minY,ly-h);maxY=Math.max(maxY,ly+h);
      });
      section.hit.style.cssText=`left:${minX-3}px;top:${minY-3}px;width:${maxX-minX+6}px;height:${maxY-minY+6}px;`;
      section.hit.setAttribute('aria-current',i===current?'location':'false');
      // Tick labels yield when a section word rides through their lane.
      if(detach>.05&&flip<.95&&zoom<.8)for(const tick of ticks){if(!tick.label)continue;const tickY=mix(tick.percent/100*docHeight-y+drift,m.base+tick.percent/100*m.span,z);const distance=tickY<minY?minY-tickY:tickY>maxY?tickY-maxY:0;if(distance<24)tick.label.style.opacity=.5*(distance/24);}
    });
    // Resolve a half-finished letter flip after wheel input comes to rest.
    if(snapArmed&&!tween&&!dragging&&zoom<.05&&time-lastInput>400&&Math.abs(velocity)<30){
      const partial=states.find((state,i)=>i>0&&state.flip>.06&&state.flip<.94);
      snapArmed=false;if(partial){const target=partial.section.anchor+drift-flipLine-(partial.flip>=.5?-4:324);jumpTo(target,700);}
    }
    if(Math.abs(viewY-scrollY)>.02||tween||dragging||zoom!==zoomTarget||Math.abs(velocity)>1||intro<1||snapArmed||sections.some(section=>section.flash>time))wake();
  }
  function intent(on){clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{zoomIntent=on?1:0;if(!on&&!dragging)ghostY=null;wake();},150);}
  rail.addEventListener('pointerenter',()=>intent(true));rail.addEventListener('pointerleave',()=>intent(false));
  rail.addEventListener('pointermove',event=>{if(dragging)dragMoved=Math.max(dragMoved,Math.abs(event.clientY-dragStartY));aim(event.clientY,dragging&&dragMoved>4);});
  rail.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();dragging=true;dragStartY=event.clientY;dragMoved=0;zoomIntent=1;rail.setPointerCapture(event.pointerId);aim(event.clientY,false);});
  function release(event){if(!dragging)return;dragging=false;if(dragMoved<=4){const m=map();jumpTo(clamp((event.clientY-m.base)/m.span)*Math.max(0,docHeight-height));}if(rail.hasPointerCapture(event.pointerId))rail.releasePointerCapture(event.pointerId);if(event.clientX<width-60){intent(false);}wake();}
  rail.addEventListener('pointerup',release);rail.addEventListener('pointercancel',release);
  rail.addEventListener('keydown',event=>{const step=height*.65;let target;
    if(event.key==='ArrowDown'||event.key==='PageDown')target=scrollY+step;
    if(event.key==='ArrowUp'||event.key==='PageUp')target=scrollY-step;
    if(event.key==='Home')target=0;if(event.key==='End')target=docHeight-height;
    if(target!==undefined){event.preventDefault();jumpTo(target);}
    if(event.key==='Escape'){zoomIntent=0;ghostY=null;rail.blur();wake();}
  });
  rail.addEventListener('focus',()=>{zoomIntent=1;wake();});rail.addEventListener('blur',()=>{zoomIntent=0;wake();});
  addEventListener('scroll',wake,{passive:true});
  addEventListener('wheel',()=>{tween=null;lastInput=performance.now();snapArmed=!reduced.matches;wake();},{passive:true});
  addEventListener('touchstart',()=>{tween=null;snapArmed=false;},{passive:true});
  addEventListener('resize',geometry);document.fonts?.ready.then(geometry);
  new ResizeObserver(geometry).observe(document.querySelector('main'));
  document.addEventListener('visibilitychange',()=>{isVisible=!document.hidden;if(isVisible)wake();});
  function mode(){root.hidden=!fine.matches;document.documentElement.classList.toggle('has-scroll-instrument',fine.matches);geometry();}
  fine.addEventListener('change',mode);reduced.addEventListener('change',()=>{snapArmed=false;mode();});mode();
})();
