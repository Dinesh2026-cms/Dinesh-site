(()=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const A=document.getElementById('app'),D=document;
const bar=D.createElement('div');bar.id='mgbar';D.body.append(bar);
addEventListener('scroll',()=>{const h=D.documentElement;bar.style.transform=`scaleX(${scrollY/((h.scrollHeight-innerHeight)||1)})`},{passive:true});
const c=D.createElement('canvas');c.id='mg';D.body.prepend(c);const x=c.getContext('2d');let W,H,P,mx=-999,my=-999;
const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight;P=Array.from({length:Math.min(46,W/22|0)},()=>({x:Math.random()*W,y:Math.random()*H,r:2+Math.random()*4,s:.15+Math.random()*.4,a:Math.random()*6.28,v:.005+Math.random()*.02}))};rs();addEventListener('resize',rs);
(function f(){x.clearRect(0,0,W,H);for(const p of P){p.a+=p.v;p.y-=p.s;p.x+=Math.sin(p.a)*.6;const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy)||1;if(d<110){p.x+=dx/d*2.2;p.y+=dy/d*2.2}if(p.y<-10){p.y=H+10;p.x=Math.random()*W}
x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle='rgba(31,122,58,.22)';x.beginPath();x.ellipse(0,0,p.r*1.8,p.r*.8,0,0,6.28);x.fill();x.restore()}requestAnimationFrame(f)})();
D.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(e.pointerType==='touch')return;const t=e.target.closest?.('.card');if(t){const r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5,s=t.style;
s.setProperty('--rx',-py*8+'deg');s.setProperty('--ry',px*8+'deg');s.setProperty('--gx',(px+.5)*100+'%');s.setProperty('--gy',(py+.5)*100+'%')}
const b=e.target.closest?.('.btn');if(b){const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.15}px,${(e.clientY-r.top-r.height/2)*.25}px)`}},{passive:true});
D.addEventListener('pointerout',e=>{const t=e.target.closest?.('.card'),b=e.target.closest?.('.btn');if(t){t.style.removeProperty('--rx');t.style.removeProperty('--ry')}if(b)b.style.transform=''});
new MutationObserver(()=>{A.querySelectorAll('.card,.tw,.f,.dvc').forEach((k,i)=>k.style.setProperty('--i',Math.min(i,12)));
const h=A.querySelector('.hero h1:not([data-s])');if(h){h.dataset.s=1;h.innerHTML=h.textContent.split(' ').map((w,i)=>`<span class="w" style="--i:${i}">${w}</span>`).join(' ')}}).observe(A,{childList:true})})();
