const CATS=['Crops','Soil','Water','Pests','Technology','Market'];
const enc=new TextEncoder(),dec=new TextDecoder();
class V extends Error{constructor(m,c=400){super(m);this.c=c}}
const J=(o,c=200,ck=[])=>{const h=new Headers({'content-type':'application/json','cache-control':'no-store'});ck.forEach(x=>h.append('set-cookie',x));return new Response(JSON.stringify(o),{status:c,headers:h})};
const go=(l,ck=[])=>{const h=new Headers({location:l});ck.forEach(x=>h.append('set-cookie',x));return new Response(null,{status:302,headers:h})};
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const rnd=()=>b64(crypto.getRandomValues(new Uint8Array(24)));
const hex=()=>[...crypto.getRandomValues(new Uint8Array(2))].map(x=>x.toString(16).padStart(2,'0')).join('');
const hk=env=>crypto.subtle.importKey('raw',enc.encode(env.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const sign=async(env,o)=>{const p=b64(enc.encode(JSON.stringify(o)));return p+'.'+b64(await crypto.subtle.sign('HMAC',await hk(env),enc.encode(p)))};
const unsign=async(env,t)=>{try{const[p,s]=t.split('.');if(!await crypto.subtle.verify('HMAC',await hk(env),unb64(s),enc.encode(p)))return null;const o=JSON.parse(dec.decode(unb64(p)));return o.exp>Date.now()?o:null}catch{return null}};
const cookies=r=>Object.fromEntries((r.headers.get('cookie')||'').split(/;\s*/).filter(Boolean).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1)]}));
const now=()=>new Date().toISOString().replace('T',' ').slice(0,19);
const nid=a=>a.reduce((m,x)=>Math.max(m,x.id),0)+1;
const str=(v,min,max,n)=>{v=String(v??'').trim();if(v.length<min||v.length>max)throw new V(`${n} must be ${min} to ${max} characters.`);return v};

const RL=new Map();
const lim=(k,max,secs)=>{const n=Date.now(),r=RL.get(k);if(!r||n-r.t>secs*1000){if(RL.size>5000)RL.clear();RL.set(k,{n:1,t:n});return}if(r.n>=max)throw new V('Too many attempts. Please wait a few minutes.',429);r.n++};
// ---- GitHub storage: every collection is one JSON file in a private GitHub repo ----
const cache=new Map();
const gh=env=>({authorization:'Bearer '+env.GITHUB_TOKEN,'user-agent':'dinesh-site',accept:'application/vnd.github+json'});
const api=(env,n)=>`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${n}.json`;
async function file(env,n,fresh){const c=cache.get(n);if(c&&!fresh&&Date.now()-c.t<15000)return c;
 const r=await fetch(`${api(env,n)}?ref=${env.GITHUB_BRANCH||'main'}`,{headers:gh(env)});
 if(r.status===404){const o={data:[],sha:null,t:Date.now()};cache.set(n,o);return o}
 if(!r.ok)throw new Error('GitHub read '+r.status);
 const j=await r.json(),o={data:JSON.parse(dec.decode(Uint8Array.from(atob(j.content.replace(/\s/g,'')),c=>c.charCodeAt(0)))),sha:j.sha,t:Date.now()};cache.set(n,o);return o}
const toB64=s=>{const b=enc.encode(s);let x='';for(let i=0;i<b.length;i+=8192)x+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(x)};
async function change(env,n,fn){for(let i=0;i<4;i++){const f=await file(env,n,i>0),d=structuredClone(f.data),res=fn(d);
 const r=await fetch(api(env,n),{method:'PUT',headers:gh(env),body:JSON.stringify({message:'update '+n,content:toB64(JSON.stringify(d)),sha:f.sha||undefined,branch:env.GITHUB_BRANCH||'main'})});
 if(r.ok){const j=await r.json();cache.set(n,{data:d,sha:j.content.sha,t:Date.now()});return res}
 if(r.status!==409&&r.status!==422)throw new Error('GitHub write '+r.status)}
 throw new V('Busy, please try again.',503)}
export default{async fetch(req,env){try{return await handle(req,env)}catch(e){if(e instanceof V)return J({error:e.message},e.c);console.error(e);return J({error:'Something went wrong on our side.'},500)}}};
async function handle(req,env){
 const url=new URL(req.url),p=url.pathname,M=req.method,ip=req.headers.get('cf-connecting-ip')||'x';
 if(p==='/robots.txt')return new Response(`User-agent: *\nDisallow: /admin\nDisallow: /dashboard\nSitemap: ${url.origin}/sitemap.xml\n`,{headers:{'content-type':'text/plain'}});
 if(!(p.startsWith('/api/')||p.startsWith('/auth/')||p==='/sitemap.xml'))return env.ASSETS.fetch(req);
 if(!env.SESSION_SECRET)throw new V('SESSION_SECRET is not set.',500);
 if(!env.GITHUB_TOKEN||!env.GITHUB_REPO)throw new V('GitHub storage is not set up.',500);
 const R=async n=>(await file(env,n)).data,W=(n,fn)=>change(env,n,fn);
 if(p==='/sitemap.xml'){const u=['/','/learn','/discussions','/classes','/about','/contact','/privacy','/terms',...(await R('articles')).map(a=>'/learn/'+a.slug),...(await R('courses')).map(c=>'/classes/'+c.id)];
  return new Response(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map(x=>`<url><loc>${url.origin}${x}</loc></url>`).join('')}</urlset>`,{headers:{'content-type':'application/xml'}})}
 const jar=cookies(req),out=[],EXP=()=>Date.now()+6048e5;let s=jar.sid?await unsign(env,jar.sid):null;
 const setS=async o=>{s=o;out.push(`sid=${await sign(env,o)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`)};
 let u=s?.uid?(await R('users')).find(x=>x.id===s.uid)||null:null;if(u?.banned)u=null;
 const isAdmin=!!(s?.admin&&s.aexp>Date.now());
 if(p==='/auth/google'){const st=rnd();return go('https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:url.origin+'/auth/google/callback',response_type:'code',scope:'openid email profile',state:st,prompt:'select_account'}),[`oas=${st}; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`])}
 if(p==='/auth/google/callback'){try{const c=url.searchParams.get('code');if(!c||url.searchParams.get('state')!==jar.oas)throw 0;
  const t=await(await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code:c,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:url.origin+'/auth/google/callback',grant_type:'authorization_code'})})).json();
  const id=JSON.parse(dec.decode(unb64(t.id_token.split('.')[1])));if(id.aud!==env.GOOGLE_CLIENT_ID||!id.email_verified)throw 0;
  let row;await W('users',a=>{row=a.find(x=>x.google_id===id.sub);if(row)row.email=id.email;else{row={id:nid(a),google_id:id.sub,email:id.email,name:id.name||'',phone:'',banned:0,created:now()};a.push(row)}});
  if(row.banned)throw 0;await setS({...(s||{}),uid:row.id,csrf:rnd(),exp:EXP()});return go('/dashboard',out)}catch{return go('/?login=failed')}}
 if(p.startsWith('/auth/')&&p!=='/auth/logout')throw new V('Not found.',404);
 const Wr=M!=='GET'&&M!=='HEAD';
 if(Wr&&(!s||s.csrf!==req.headers.get('x-csrf-token')))throw new V('Session expired. Refresh the page.',403);
 if(+req.headers.get('content-length')>50000)throw new V('Request too large.',413);
 const body=Wr?await req.json().catch(()=>({})):{};
 if(p==='/auth/logout')return J({ok:1},200,['sid=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax']);
 const need=()=>{if(!u)throw new V('Please sign in with Google first.',401)},
 done=()=>{need();if(!u.name||!u.phone)throw new V('Add your name and contact number in your dashboard first.')},
 adm=()=>{if(!isAdmin)throw new V('Admins only.',403)};
 let m;const is=(me,re)=>M===me&&(m=p.match(re));
 if(Wr&&!p.startsWith('/api/admin/'))lim('w:'+ip,60,900);
 const st=env.MODERATE_FIRST==='1'?'pending':'visible';
 const names=async()=>Object.fromEntries((await R('users')).map(x=>[x.id,x.name||'Member']));
 if(is('GET',/^\/api\/me$/)){if(!s)await setS({csrf:rnd(),exp:EXP()});return J({csrf:s.csrf,cats:CATS,admin:isAdmin,user:u?{id:u.id,name:u.name,email:u.email,phone:u.phone}:null},200,out)}
 if(is('GET',/^\/api\/articles$/))return J((await R('articles')).map(({slug,title,summary,category,created})=>({slug,title,summary,category,created})).reverse());
 if(is('GET',/^\/api\/articles\/([\w-]+)$/)){const a=(await R('articles')).find(x=>x.slug===m[1]);if(!a)throw new V('Article not found.',404);return J(a)}
 if(is('GET',/^\/api\/courses$/)){const l=await R('lessons');return J((await R('courses')).map(c=>({...c,lessons:l.filter(x=>x.course_id===c.id).length})).reverse())}
 if(is('GET',/^\/api\/courses\/(\d+)$/)){const c=(await R('courses')).find(x=>x.id===+m[1]);if(!c)throw new V('Class not found.',404);
  const en=isAdmin||(u&&(await R('enrollments')).some(e=>e.user_id===u.id&&e.course_id===c.id));
  let l=(await R('lessons')).filter(x=>x.course_id===c.id).sort((a,b)=>a.pos-b.pos||a.id-b.id).map(({id,title,video_url,content})=>({id,title,video_url,content}));
  if(!en)l=l.map(x=>({id:x.id,title:x.title}));return J({...c,enrolled:!!en,lessons:l})}
 if(is('POST',/^\/api\/courses\/(\d+)\/enroll$/)){need();const id=+m[1];if(!(await R('courses')).some(c=>c.id===id))throw new V('Class not found.',404);
  await W('enrollments',a=>{if(!a.some(e=>e.user_id===u.id&&e.course_id===id))a.push({user_id:u.id,course_id:id,created:now()})});return J({ok:1})}
 if(is('GET',/^\/api\/topics$/)){const c=url.searchParams.get('category'),n=await names(),r=await R('replies');
  return J((await R('topics')).filter(t=>t.status==='visible'&&(!CATS.includes(c)||t.category===c)).reverse().slice(0,60).map(t=>({id:t.id,title:t.title,category:t.category,created:t.created,author:n[t.user_id],replies:r.filter(x=>x.topic_id===t.id&&x.status==='visible').length})))}
 if(is('GET',/^\/api\/topics\/(\d+)$/)){const t=(await R('topics')).find(x=>x.id===+m[1]&&x.status==='visible');if(!t)throw new V('Discussion not found.',404);const n=await names();
  return J({id:t.id,title:t.title,body:t.body,category:t.category,created:t.created,author:n[t.user_id],replies:(await R('replies')).filter(x=>x.topic_id===t.id&&x.status==='visible').map(x=>({id:x.id,body:x.body,created:x.created,author:n[x.user_id]}))})}
 if(is('POST',/^\/api\/topics$/)){done();const c=body.category;if(!CATS.includes(c))throw new V('Choose a category.');const t=str(body.title,5,150,'Title'),b=str(body.body,10,5000,'Question');
  const id=await W('topics',a=>{const i=nid(a);a.push({id:i,user_id:u.id,category:c,title:t,body:b,status:st,created:now()});return i});return J({id,pending:st==='pending'})}
 if(is('POST',/^\/api\/topics\/(\d+)\/replies$/)){done();const tid=+m[1];if(!(await R('topics')).some(t=>t.id===tid&&t.status==='visible'))throw new V('Discussion not found.',404);const b=str(body.body,2,3000,'Reply');
  await W('replies',a=>{a.push({id:nid(a),topic_id:tid,user_id:u.id,body:b,status:st,created:now()})});return J({pending:st==='pending'})}
 if(is('PUT',/^\/api\/me$/)){need();const ph=String(body.phone||'').trim();if(!/^[+\d][\d\s-]{6,18}$/.test(ph))throw new V('Enter a valid phone number.');const nm=str(body.name,2,80,'Name');
  await W('users',a=>{const x=a.find(y=>y.id===u.id);x.name=nm;x.phone=ph});return J({ok:1})}
 if(is('GET',/^\/api\/me\/dashboard$/)){need();const c=await R('courses');
  return J({topics:(await R('topics')).filter(t=>t.user_id===u.id).reverse().map(({id,title,status,created})=>({id,title,status,created})),classes:(await R('enrollments')).filter(e=>e.user_id===u.id).map(e=>c.find(x=>x.id===e.course_id)).filter(Boolean).map(({id,title,level})=>({id,title,level}))})}
 if(is('POST',/^\/api\/contact$/)){lim('c:'+ip,5,3600);const e=str(body.email,5,120,'Email');if(!/^\S+@\S+\.\S+$/.test(e))throw new V('Enter a valid email.');const nm=str(body.name,2,80,'Name'),ms=str(body.message,10,3000,'Message');
  await W('messages',a=>{a.push({id:nid(a),name:nm,email:e,message:ms,created:now()});if(a.length>500)a.shift()});return J({ok:1})}
 if(is('POST',/^\/api\/admin\/login$/)){lim('a:'+ip,5,900);if(!env.ADMIN_PASSWORD)throw new V('Admin password is not set.',500);
  const h=async x=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(String(x??''))));
  if(!crypto.subtle.timingSafeEqual(await h(body.password),await h(env.ADMIN_PASSWORD)))throw new V('Wrong password.',401);
  await setS({...s,admin:1,aexp:Date.now()+432e5,csrf:rnd()});return J({ok:1},200,out)}
 if(p.startsWith('/api/admin/'))adm();
 if(is('POST',/^\/api\/admin\/logout$/)){await setS({...s,admin:0,csrf:rnd()});return J({ok:1},200,out)}
 if(is('GET',/^\/api\/admin\/overview$/)){const n=await names();return J({users:(await R('users')).slice().reverse().slice(0,200).map(({id,name,email,banned,created})=>({id,name,email,banned,created})),
  topics:(await R('topics')).slice().reverse().slice(0,60).map(t=>({id:t.id,title:t.title,status:t.status,author:n[t.user_id]})),
  replies:(await R('replies')).slice().reverse().slice(0,60).map(x=>({id:x.id,body:x.body.slice(0,120),status:x.status,author:n[x.user_id]})),
  articles:(await R('articles')).map(({id,title})=>({id,title})).reverse(),courses:(await R('courses')).map(({id,title})=>({id,title})).reverse(),messages:(await R('messages')).slice().reverse().slice(0,50)})}
 if(is('PATCH',/^\/api\/admin\/users\/(\d+)$/)){await W('users',a=>{const x=a.find(y=>y.id===+m[1]);if(x)x.banned=body.banned?1:0});return J({ok:1})}
 if(is('PATCH',/^\/api\/admin\/(topics|replies)\/(\d+)$/)){if(!['visible','hidden','pending'].includes(body.status))throw new V('Invalid status.');
  await W(m[1],a=>{const x=a.find(y=>y.id===+m[2]);if(x)x.status=body.status});return J({ok:1})}
 if(is('POST',/^\/api\/admin\/articles$/)){const t=str(body.title,3,150,'Title'),sm=str(body.summary,5,300,'Summary'),b=str(body.body,20,20000,'Article text'),c=str(body.category,2,40,'Category');
  await W('articles',a=>{a.push({id:nid(a),slug:t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)+'-'+hex(),title:t,summary:sm,body:b,category:c,created:now()})});return J({ok:1})}
 if(is('POST',/^\/api\/admin\/courses$/)){if(!['Beginner','Intermediate','Advanced'].includes(body.level))throw new V('Choose a level.');const t=str(body.title,3,150,'Title'),d=str(body.description,5,2000,'Description');
  await W('courses',a=>{a.push({id:nid(a),title:t,description:d,level:body.level,created:now()})});return J({ok:1})}
 if(is('POST',/^\/api\/admin\/lessons$/)){const v=String(body.video_url||'').trim();if(v&&!/^https:\/\/\S+$/.test(v))throw new V('Video link must start with https://');
  const cid=+body.course_id;if(!(await R('courses')).some(c=>c.id===cid))throw new V('Choose a class.');const t=str(body.title,3,150,'Title'),c=str(body.content,0,10000,'Notes');
  await W('lessons',a=>{a.push({id:nid(a),course_id:cid,title:t,video_url:v,content:c,pos:parseInt(body.pos)||0})});return J({ok:1})}
 if(is('DELETE',/^\/api\/admin\/(articles|courses)\/(\d+)$/)){const id=+m[2];await W(m[1],a=>{const i=a.findIndex(x=>x.id===id);if(i>=0)a.splice(i,1)});
  if(m[1]==='courses'){await W('lessons',a=>{for(let i=a.length-1;i>=0;i--)if(a[i].course_id===id)a.splice(i,1)});await W('enrollments',a=>{for(let i=a.length-1;i>=0;i--)if(a[i].course_id===id)a.splice(i,1)})}
  return J({ok:1})}
 throw new V('Not found.',404);
}
