// Rain & Wind engine — copied from the designer's Rain & Wind Animation Editor, unchanged
function rainEngineFactory(){
  const R=Math.PI/180, TAU=Math.PI*2;
  const VIEW={x:0,y:215,w:393,h:340};
  const BLUE="#3E7FBF", BLACK="#000000";
  const EA=22.87*R, ec=Math.cos(EA), es=Math.sin(EA);
  const ell=(x,y,w,h)=>({cx:x+ec*w/2-es*h/2, cy:y+es*w/2+ec*h/2, rx:w/2, ry:h/2, rot:22.87});
  const back=[ell(178.79,261.21,57,56),ell(241.44,287.64,58,56),ell(305.02,314.46,57,56),ell(280.14,373.43,57,58),ell(216.57,346.61,58,58)];
  const front=[ell(153.91,320.18,57,58),ell(128.65,380.07,57,57),ell(191.30,406.50,58,57),ell(254.88,435.00,57,57)];
  const circles=[...back,...front].map((c,i)=>({...c,i,ph:i*2.399,ps:i*1.713+0.9}));
  const line=(x,y,deg,len)=>{const a=deg*R,ux=Math.cos(a),uy=Math.sin(a);return {mx:x+ux*len/2,my:y+uy*len/2,ux,uy,nx:-uy,ny:ux,len,rot:deg};};
  const G1=[[121.34,433.42],[110.84,458.30],[100.35,484.86],[89.47,510.66]].map(p=>line(p[0],p[1],22.87,54));
  const G2=[[79.13,350.71],[104.68,351.43],[132.66,353.18],[159.08,354.50],[185.84,355.74],[212.60,356.98]].map(p=>line(p[0],p[1],-86.47,54.24));
  const center=a=>({x:a.reduce((s,l)=>s+l.mx,0)/a.length,y:a.reduce((s,l)=>s+l.my,0)/a.length});
  const groups=[
    {lines:G2,c:center(G2),out:{x:G2[0].ux,y:G2[0].uy},sign:-1,k0:0},
    {lines:G1,c:center(G1),out:{x:-G1[0].ux,y:-G1[0].uy},sign:1,k0:G2.length}
  ];
  const all=[...circles.map(c=>({x:c.cx,y:c.cy})),...G1.map(l=>({x:l.mx,y:l.my})),...G2.map(l=>({x:l.mx,y:l.my}))];
  const C={x:all.reduce((s,p)=>s+p.x,0)/all.length,y:all.reduce((s,p)=>s+p.y,0)/all.length};
  groups.forEach(g=>{const dx=g.c.x-C.x,dy=g.c.y-C.y,d=Math.hypot(dx,dy)||1;g.rad={x:dx/d,y:dy/d};});
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const pulse=p=>(1-Math.cos(p))/2;
  const hold=p=>smooth(Math.min(1,pulse(p)*1.35));

  function scene(t,P){
    const I=P.intensity, f=(((P.speed*t/P.duration)%1)+1)%1;
    const ph=(k,maxK,scale=1)=>{let d=P.stagger*scale*P.speed/P.duration;if(maxK*d>0.7)d=0.7/maxK;const u=(f-k*d)/(1-maxK*d);return (u<=0||u>=1)?0:TAU*u;};
    const drift=(q,o)=>pulse(q)*Math.sin(q+o), driftc=(q,o)=>pulse(q)*Math.cos(q+o);
    const items={back:[],front:[],g1:[],g2:[],top:[]}, gDisp=[];
    const NK=G1.length+G2.length-1;
    groups.forEach((g,gi)=>{
      const n=g.lines.length, M=P.stripesOn?P.stripesMove*I:0, RT=P.stripesOn?P.stripesRot*I:0;
      const gq=ph(g.k0+(n-1)/2,NK);
      let gtx=0,gty=0,gang=0,sx=0,sy=0; const out=[];
      if(P.style==="emerge"){gang=RT*g.sign*smooth(pulse(gq));}
      if(P.style==="float"){gang=RT*0.8*drift(gq,gi*1.9);gtx=M*0.3*drift(gq,gi*2.3);gty=M*0.3*driftc(gq,gi*2.3);}
      if(P.style==="deconstruct"){const a=hold(gq);gang=RT*g.sign*a;gtx=g.rad.x*M*0.55*a;gty=g.rad.y*M*0.55*a;}
      if(P.stripeMode==="cycle"){
        const SF=P.spacing, l0=g.lines[0], L=l0.len;
        const cx=g.c.x+gtx, cy=g.c.y+gty, ga=gang*R, ca=Math.cos(ga), sa=Math.sin(ga);
        const xf=(x,y)=>{x+=gtx;y+=gty;const dx=x-cx,dy=y-cy;return [cx+dx*ca-dy*sa,cy+dx*sa+dy*ca];};
        const flow=gi===0?P.g2Flow:P.g1Flow, dir=gi===0?P.g2Dir:P.g1Dir;
        const steps=P.stripesOn?P.cycleSpeed:0, phi0=(((steps*t/P.duration))%1+1)%1;
        if(flow==="along"){
          const outS=Math.sign((g.c.x-C.x)*l0.ux+(g.c.y-C.y)*l0.uy)||1, dirA=outS*dir;
          const gap=16*SF, Pd=L+gap, hw=7, hp=Pd/2, h=L/(2*Pd);
          g.lines.forEach((l,k)=>{
            const clip=[...xf(l.mx-l.ux*hp-l.nx*hw,l.my-l.uy*hp-l.ny*hw),...xf(l.mx+l.ux*hp-l.nx*hw,l.my+l.uy*hp-l.ny*hw),
                        ...xf(l.mx+l.ux*hp+l.nx*hw,l.my+l.uy*hp+l.ny*hw),...xf(l.mx-l.ux*hp+l.nx*hw,l.my-l.uy*hp+l.ny*hw)];
            [0,1].forEach(j=>{
              const off=dirA*phi0*Pd-j*dirA*Pd, u=off/Pd, e=Math.min(u+0.5,0.5-u);
              const op=P.fade>0?smooth((e+h)/(h+0.5*P.fade)):1;
              const [x,y]=xf(l.mx+l.ux*off,l.my+l.uy*off);
              out.push({t:"l",x,y,rot:l.rot+gang,w:L,h:12,fill:BLACK,op,clip,gid:"g"+gi+"s"+k});
            });
          });
          gDisp.push({x:0,y:0,c:g.c}); (gi===0?items.g2:items.g1).push(...out); return;
        }
        const mids=g.lines.map(l=>({x:l.mx,y:l.my}));
        const lerp=u=>{let a,b,fr;if(u<=0){a=mids[0];b=mids[1];fr=u;}else if(u>=n-1){a=mids[n-2];b=mids[n-1];fr=u-(n-2);}else{const i=Math.floor(u);a=mids[i];b=mids[i+1];fr=u-i;}
          return {x:g.c.x+(a.x+(b.x-a.x)*fr-g.c.x)*SF,y:g.c.y+(a.y+(b.y-a.y)*fr-g.c.y)*SF};};
        const dEnd=i=>Math.hypot(mids[i].x-C.x,mids[i].y-C.y), outU=dEnd(n-1)>dEnd(0)?1:-1;
        const phi=((phi0*outU*dir)%1+1)%1;
        const e0=lerp(-0.5), e1=lerp(n-0.5), hl=L/2+1;
        const clip=[...xf(e0.x-l0.ux*hl,e0.y-l0.uy*hl),...xf(e0.x+l0.ux*hl,e0.y+l0.uy*hl),...xf(e1.x+l0.ux*hl,e1.y+l0.uy*hl),...xf(e1.x-l0.ux*hl,e1.y-l0.uy*hl)];
        for(let k=-1;k<n;k++){
          const u=k+phi, m=lerp(u), e=Math.min(u+0.5,(n-0.5)-u);
          const op=P.fade>0?smooth((e+0.25)/(0.25+0.5*P.fade)):1;
          const [x,y]=xf(m.x,m.y);
          out.push({t:"l",x,y,rot:l0.rot+gang,w:L,h:12,fill:BLACK,op,clip,gid:gi});
        }
        gDisp.push({x:0,y:0,c:g.c});
        (gi===0?items.g2:items.g1).push(...out);
        return;
      }
      g.lines.forEach((l,k)=>{
        const q=ph(g.k0+k,NK); let slide=0,perp=0;
        if(P.style==="emerge"){slide=M*smooth(pulse(q));}
        if(P.style==="float"){slide=M*0.9*drift(q,0.6);perp=M*0.25*driftc(q,0.6);}
        if(P.style==="deconstruct"){const a=hold(q);slide=M*0.35*a;perp=(k-(n-1)/2)*M*0.14*a;}
        let x=l.mx+g.out.x*slide+l.nx*perp+gtx, y=l.my+g.out.y*slide+l.ny*perp+gty;
        sx+=x-l.mx; sy+=y-l.my;
        const cx=g.c.x+gtx, cy=g.c.y+gty, a=gang*R, ca=Math.cos(a), sa=Math.sin(a), dx=x-cx, dy=y-cy;
        x=cx+dx*ca-dy*sa; y=cy+dx*sa+dy*ca;
        out.push({t:"l",x,y,rot:l.rot+gang,w:l.len,h:12,fill:BLACK});
      });
      gDisp.push({x:sx/n,y:sy/n,c:g.c});
      (gi===0?items.g2:items.g1).push(...out);
    });
    const NC=circles.length-1;
    circles.forEach((c,i)=>{
      let ox=0,oy=0,s=1;
      if(P.circlesOn){
        const Mc=P.circlesMove*I, Sc=P.circlesScale*I, q=ph(i,NC,0.5);
        if(P.style==="emerge"){
          ox=Mc*0.5*drift(q,c.ph); oy=Mc*0.5*driftc(q,c.ph);
          gDisp.forEach(g=>{const d=Math.hypot(c.cx-g.c.x,c.cy-g.c.y),w=Math.exp(-d*d/(2*75*75))*(Mc/10);ox+=g.x*w*0.6;oy+=g.y*w*0.6;});
          s=1+Sc*0.6*smooth(pulse(q));
        }
        if(P.style==="float"){ox=Mc*drift(q,c.ph);oy=Mc*driftc(q,c.ps);s=1+Sc*0.8*drift(q,c.ps);}
        if(P.style==="deconstruct"){
          const a=hold(q), dx=c.cx-C.x, dy=c.cy-C.y, d=Math.hypot(dx,dy)||1;
          ox=dx/d*Mc*a+(-dy/d)*Mc*0.25*a; oy=dy/d*Mc*a+(dx/d)*Mc*0.25*a;
          s=1+Sc*a*(i%2?0.7:-0.5);
        }
      }
      const it={t:"c",x:c.cx+ox,y:c.cy+oy,rot:c.rot,rx:c.rx,ry:c.ry,s:Math.max(0.3,s),fill:BLUE};
      if(i===back.length&&P.centerTop) items.top.push(it);
      else (i<back.length?items.back:items.front).push(it);
    });
    return P.topBehind ? [...items.back,...items.g1,...items.g2,...items.front,...items.top]
                       : [...items.back,...items.g1,...items.front,...items.g2,...items.top];
  }
  return {scene,VIEW};
}

function rainRenderer(svg,engine){
  const NS="http://www.w3.org/2000/svg", V=engine.VIEW; let nodes=[], key="", clipEls={};
  function render(t,P){
    const list=engine.scene(t,P);
    const k=list.map(it=>it.t+(it.clip?it.gid:"")).join("");
    if(k!==key){
      key=k; svg.innerHTML=""; clipEls={};
      const defs=document.createElementNS(NS,"defs"); svg.appendChild(defs);
      list.forEach(it=>{if(it.clip&&!clipEls[it.gid]){const cp=document.createElementNS(NS,"clipPath");cp.setAttribute("id","rwclip"+it.gid);
        const pg=document.createElementNS(NS,"polygon");cp.appendChild(pg);defs.appendChild(cp);clipEls[it.gid]=pg;}});
      nodes=list.map(it=>{const g=document.createElementNS(NS,"g");let el;
        if(it.clip) g.setAttribute("clip-path","url(#rwclip"+it.gid+")");
        if(it.t==="c"){el=document.createElementNS(NS,"ellipse");el.setAttribute("rx",it.rx);el.setAttribute("ry",it.ry);}
        else{el=document.createElementNS(NS,"rect");el.setAttribute("x",-it.w/2);el.setAttribute("y",-it.h/2);el.setAttribute("width",it.w);el.setAttribute("height",it.h);}
        el.setAttribute("fill",it.fill);g.appendChild(el);svg.appendChild(g);return {g,el};});
    }
    const done={};
    list.forEach((it,i)=>{
      if(it.clip&&!done[it.gid]){done[it.gid]=1;const c=it.clip,pts=[];for(let j=0;j<c.length;j+=2)pts.push((c[j]-V.x).toFixed(2)+","+(c[j+1]-V.y).toFixed(2));clipEls[it.gid].setAttribute("points",pts.join(" "));}
      nodes[i].el.setAttribute("transform","translate("+(it.x-V.x).toFixed(3)+" "+(it.y-V.y).toFixed(3)+") rotate("+it.rot.toFixed(3)+")"+(it.s&&it.s!==1?" scale("+it.s.toFixed(4)+")":""));
      nodes[i].g.setAttribute("opacity",it.op===undefined?1:it.op.toFixed(3));
    });
  }
  return {render,reset(){key="";svg.innerHTML="";}};
}

// Floating Stripes engine — copied from the designer's Floating Stripes Editor, unchanged
function pcEngineFactory(){
  const TAU=Math.PI*2, R=Math.PI/180;
  const VIEW={x:0,y:310,w:393,h:255};
  const BLUE="#3E7FBF", YELLOW="#F5C400";
  const STRIPES=[{name:"Line 17",x:32,y:347,len:217},{name:"Line 18",x:32,y:382,len:337},{name:"Line 20",x:32,y:418,len:162},
                 {name:"Line 19",x:108,y:455,len:187},{name:"Line 23",x:32,y:491,len:229},{name:"Line 24",x:124,y:529,len:217}];
  const YPATH="M41.1953 8.50992C52.5416 19.8562 52.5416 38.2522 41.1953 49.5985C29.849 60.9448 11.4531 60.9448 0.106778 49.5985C-0.000664117 27.1823 -0.0667254 27.0693 0.106778 8.50992C11.4531 -2.83637 29.849 -2.83637 41.1953 8.50992Z";
  const YPOS={x:315.438,y:430.034}, YPIV={x:20.65,y:29.05};
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const frac=x=>x-Math.floor(x);
  const WAVES={
    sine:p=>Math.sin(p),
    smooth:p=>{const u=frac(p/TAU+0.25);const v=u<0.5?smooth(u*2):smooth(2-u*2);return 2*v-1;},
    linear:p=>{const u=frac(p/TAU+0.25);const v=u<0.5?u*2:2-u*2;return 2*v-1;},
    pause:p=>{const u=frac(p/TAU+0.25);const tri=u<0.5?u*2:2-u*2;return 2*smooth((tri-0.15)/0.7)-1;}
  };
  const pulse=(p,ease)=>(1-WAVES[ease](p+Math.PI/2))/2;
  const DECON=[1,-0.6,0.8,-1,0.55,-0.85];
  function scene(t,P){
    const T=P.loop, I=P.intensity, out=[];
    const dirSign=i=>P.direction==="alternate"?(i%2?-1:1):P.direction==="reverse"?-1:1;
    STRIPES.forEach((s,i)=>{
      const o=P.stripes[i]; let dx=0, sx=1;
      if(P.stripesOn&&o.on){
        const cyc=Math.max(1,Math.round(P.stripeSpeed*o.speed));
        const delay=i*P.stagger+o.delay;
        const ph=TAU*cyc*(t-delay)/T;
        const A=P.stripeMove*(o.range/100)*I;
        if(P.style==="deconstruct") dx=A*DECON[i]*dirSign(i)*pulse(ph,P.stripeEase);
        else dx=A*dirSign(i)*WAVES[P.stripeEase](ph);
        if(P.stretchOn) sx=1+(P.stretch/100)*I*WAVES[P.stripeEase](ph+Math.PI/2);
      }
      out.push({t:"l",name:s.name,x:s.x+dx,y:s.y-10.5,w:s.len*sx,h:21,fill:BLUE});
      if(i===1) out.push(null);
    });
    let yx=0,yy=0,yr=0,ys=1;
    if(P.yellowOn){
      const ph=TAU*P.ySpeed*t/T, w=WAVES[P.yEase], sgn=P.style==="opposite"?-1:1;
      if(P.yX) yx=sgn*P.yMoveX*I*w(ph);
      if(P.yY) yy=P.yMoveY*I*w(ph+Math.PI/2);
      if(P.yR) yr=P.yRot*I*w(ph+Math.PI/3);
      if(P.yS) ys=1+(P.yScale/100)*I*w(ph+Math.PI);
      if(P.style==="deconstruct"&&P.yX) yx=-P.yMoveX*I*pulse(TAU*P.ySpeed*(t-2*P.stagger)/T,P.yEase);
    }
    const yi={t:"y",x:YPOS.x+yx,y:YPOS.y+yy,px:YPIV.x,py:YPIV.y,rot:yr,s:ys,fill:YELLOW,d:YPATH};
    const k=out.indexOf(null); out[k]=yi;
    return out;
  }
  return {scene,VIEW,STRIPES};
}
function pcRenderer(svg,engine){
  const NS="http://www.w3.org/2000/svg", V=engine.VIEW; let nodes=null;
  function build(list){svg.innerHTML="";nodes=list.map(it=>{let el;
    if(it.t==="y"){el=document.createElementNS(NS,"path");el.setAttribute("d",it.d);}
    else{el=document.createElementNS(NS,"rect");}
    el.setAttribute("fill",it.fill);svg.appendChild(el);return el;});}
  function render(t,P){
    const list=engine.scene(t,P); if(!nodes||nodes.length!==list.length) build(list);
    list.forEach((it,i)=>{const el=nodes[i];
      if(it.t==="l"){el.setAttribute("x",(it.x-V.x).toFixed(3));el.setAttribute("y",(it.y-V.y).toFixed(3));el.setAttribute("width",it.w.toFixed(3));el.setAttribute("height",it.h);}
      else{const cx=it.x-V.x+it.px, cy=it.y-V.y+it.py;
        el.setAttribute("transform","translate("+cx.toFixed(3)+" "+cy.toFixed(3)+") rotate("+it.rot.toFixed(3)+") scale("+it.s.toFixed(4)+") translate("+(-it.px)+" "+(-it.py)+")");}});
  }
  return {render};
}


/* ================= REFORM · the six approved weather visuals =================
   Every number below comes from approvedMotion.js (approved 16.11.2026).
   Each visual: build(group) → { draw(t) }   t = seconds since the visual started. */
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs = {}, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (parent) parent.appendChild(el); return el; };
function bezierEase(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return u => { if (u <= 0) return 0; if (u >= 1) return 1; let t = u; for (let i = 0; i < 8; i++) { const e = X(t) - u, d = dX(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; }
    if (Math.abs(X(t) - u) > 1e-3) { let lo = 0, hi = 1; t = u; for (let i = 0; i < 30; i++) { X(t) < u ? lo = t : hi = t; t = (lo + hi) / 2; } } return Y(t); };
}

const VISUALS = {
  /* ---------- SUNNY ---------- */
  sunny(root) {
    const g = mk('g', { transform: 'matrix(0.84224 0 0 0.84224 31 38.79)' }, root);
    const defs = mk('defs', {}, root);
    const lg = mk('linearGradient', { id: 'sunGrad', x1: 0, y1: 0, x2: 0, y2: 264, gradientUnits: 'userSpaceOnUse' }, defs);
    mk('stop', { offset: 0, 'stop-color': '#F5C400' }, lg); mk('stop', { offset: 1, 'stop-color': '#F1C100' }, lg);
    const S = M.sunny, LINES = [396, 440, 486, 530];
    const st = [0, 1, 2].map(() => mk('rect', { height: 21, width: 334, fill: '#3E7FBF' }, g));
    const sun = mk('path', { d: S.sunPath, fill: 'url(#sunGrad)', 'fill-rule': 'evenodd' }, g);
    st.push(mk('rect', { height: 21, width: 334, fill: '#3E7FBF' }, g));
    return { draw(t) {
      const T = S.loop;
      st.forEach((r, i) => { r.setAttribute('x', (29 + S.stripeMove * Math.sin(2 * Math.PI * S.stripeCycles * (t - i * S.stripeStagger) / T)).toFixed(2)); r.setAttribute('y', LINES[i] - 10.5); });
      const ang = S.sunRange * Math.sin(2 * Math.PI * S.sunSways * t / T);
      sun.setAttribute('transform', `translate(${61.1245 + 128.326} ${259 + 131.337}) rotate(${ang.toFixed(3)}) translate(-128.326 -131.337)`);
    } };
  },

  /* ---------- RAINY ---------- */
  rainy(root) {
    // 19.11: moved 15.5px right so the image sits centred between its margins
    const stage = mk('g', { transform: 'matrix(0.993118 -0.131583 0.131583 0.993118 -22.5 248.711)' }, root);
    const art = mk('g', {}, stage);
    const engine = rainEngineFactory(), ren = rainRenderer(art, engine);
    return { draw(t) { const P = M.rainy; ren.render(t % P.duration, P); } };
  },

  /* ---------- PARTLY CLOUDY ---------- */
  partly(root) {
    const stage = mk('g', { transform: 'matrix(0.858824 0 0 0.858824 27.75 312)' }, root);
    const art = mk('g', {}, stage);
    const engine = pcEngineFactory(), ren = pcRenderer(art, engine);
    return { draw(t) { const P = M.partly; ren.render(t % P.loop, P); } };
  },

  /* ---------- STORMY ---------- */
  stormy(root) {
    const G = M.stormy, L = 186, SW = 17;   // 19.11: the four black bars slightly thinner (was 20)
    const bars = {
      bar1: { from: [174.96, 272.96], dir: [0.704, 0.7102] }, bar2: { from: [147.99, 297.86], dir: [0.704, 0.7102] },
      bar3: { from: [130.81, 316.95], dir: [0.6325, 0.7746] }, bar4: { from: [93.95, 349.59], dir: [0.704, 0.7102] },
    };
    const node = {};
    const line = k => { const b = bars[k]; return mk('line', { x1: b.from[0], y1: b.from[1], x2: b.from[0] + b.dir[0] * L, y2: b.from[1] + b.dir[1] * L, stroke: '#000', 'stroke-width': SW }, root); };
    node.bar1 = line('bar1'); node.bar2 = line('bar2');
    mk('polygon', { points: '219.45,546.82 244.91,405.68 295.21,425.06', fill: '#3E7FBF' }, root);
    node.cloud = mk('ellipse', { cx: 150.5, cy: 415, rx: 73.5, ry: 74, fill: '#9E9E9E' }, root);
    node.bar4 = line('bar4'); node.bar3 = line('bar3');
    const order = ['bar1', 'bar2', 'bar3', 'bar4'];
    return { draw(t) {
      const c = 2 * Math.PI * t / G.cloudPeriod, sx = G.cloudMoveX * Math.sin(c), sc = 1 + G.cloudScale / 100 * Math.sin(c);
      node.cloud.setAttribute('transform', `translate(${(150.5 + sx).toFixed(2)} 415) scale(${sc.toFixed(4)}) translate(-150.5 -415)`);
      order.forEach((k, i) => { const b = bars[k], a = G.barsAlong * Math.sin(2 * Math.PI * (t - i * G.barsStagger) / G.barsPeriod);
        node[k].setAttribute('transform', `translate(${(b.dir[0] * a).toFixed(2)} ${(b.dir[1] * a).toFixed(2)})`); });
    } };
  },

  /* ---------- DUSTY ---------- */
  dusty(root) {
    const D = M.dusty, PX = 59.63, PY = 66.68, CX = 272.0, CY = 312.65;
    const box = mk('g', { transform: 'matrix(0.537594 0 0 0.537594 51 234)', fill: '#000' }, root);
    const gA = mk('g', {}, box), gB = mk('g', {}, box);
    const GRID = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) GRID.push([(c - 2) * PX, (r - 2) * PY]);
    GRID.forEach(([x, y]) => { mk('circle', { cx: CX + x, cy: CY + y, r: 15 }, gA); mk('circle', { cx: CX + x, cy: CY + y, r: 15 }, gB); });
    let ease = null, easeKey = '';
    const progress = t => {
      const key = D.ease.join(','); if (key !== easeKey) { ease = bezierEase(...D.ease); easeKey = key; }
      const T = D.holdApart + 2 * D.move + D.holdOther; let u = ((t % T) + T) % T;
      if (u < D.holdApart) return 0; u -= D.holdApart; if (u < D.move) return ease(u / D.move); u -= D.move; if (u < D.holdOther) return 1; u -= D.holdOther; return 1 - ease(u / D.move);
    };
    const steps = 2 / 2; // distance 2 steps × intensity 1 / 2
    const off = m => { const v = 1 - 2 * m, fx = steps * PX, sy = -steps * PY * v; return { a: [fx, sy], b: [-fx, -sy] }; };
    return { draw(t) {
      const oa = off(progress(t)).a, ob = off(progress(t - D.groupLag)).b;
      gA.setAttribute('transform', `translate(${oa[0].toFixed(2)} ${oa[1].toFixed(2)})`);
      gB.setAttribute('transform', `translate(${ob[0].toFixed(2)} ${ob[1].toFixed(2)})`);
    } };
  },

  /* ---------- HOT ---------- */
  hot(root) {
    const H = M.hot, C = { x: 208, y: 404 }, RO = 140, RI = 114.79, N = 24;
    const DOTS = []; [434, 463, 492, 521].forEach(y => [46, 75, 105, 134, 163].forEach(x => DOTS.push([x, y])));
    // 17.11: the whole HOT image was 80% of its first size; 19.11: 90% (it looked too small next to the others), centred on the screen
    const box = mk('g', { transform: 'translate(194 404) scale(0.9) translate(-200 -404)' }, root);
    const star = mk('path', { fill: '#CD5341' }, box);
    const dots = mk('g', { fill: '#000' }, box);
    DOTS.forEach(([x, y]) => mk('circle', { cx: x + 7.5, cy: y + 7.5, r: 7.5 }, dots));
    const easeOut = x => 1 - Math.pow(1 - x, 3), easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const shape = p => p < .4 ? easeOut(p / .4) : 1 - easeInOut((p - .4) / .6);
    let bursts = [], last = -1e9, next = 0;
    const spawn = t => {
      const n = Math.random() < .5 ? 1 : 2, busy = new Set(bursts.map(b => b.k)), pick = [];
      for (let tries = 0; pick.length < n && tries < 60; tries++) { const k = Math.floor(Math.random() * N);
        if (busy.has(k) || pick.some(q => Math.min(Math.abs(q - k), N - Math.abs(q - k)) < 3)) continue; pick.push(k); }
      pick.forEach(k => bursts.push({ k, t0: t, dur: H.spikeMs / 1000, amp: H.spikePx * (.75 + Math.random() * .5) }));
    };
    return { draw(t) {
      if (t < last) { bursts = []; last = -1e9; }
      if (t - last >= next) { spawn(t); last = t; next = (H.spikeEveryMs / 1000) * (.75 + Math.random() * .5); }
      bursts = bursts.filter(b => t - b.t0 < b.dur && t >= b.t0);
      const ext = new Float32Array(N); bursts.forEach(b => { ext[b.k] += b.amp * shape((t - b.t0) / b.dur); });
      let d = ''; for (let i = 0; i < N * 2; i++) { const a = (-90 + i * 7.5) * Math.PI / 180, r = i % 2 ? RI : RO + ext[i / 2]; d += (i ? 'L' : 'M') + (C.x + r * Math.cos(a)).toFixed(2) + ' ' + (C.y + r * Math.sin(a)).toFixed(2); }
      star.setAttribute('d', d + 'Z');
      const sc = 1 + H.pulsePct / 100 * (1 - Math.cos(2 * Math.PI * (t / H.pulsePeriod % 1))) / 2;
      star.setAttribute('transform', `translate(${C.x} ${C.y}) scale(${sc.toFixed(4)}) translate(${-C.x} ${-C.y})`);
      const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / H.floatPeriod);
      dots.setAttribute('transform', `translate(${(H.floatPx * w).toFixed(2)} 0)`);
    } };
  },
};
