let dvTab='articles';
const DN={articles:'Articles',courses:'Classes',lessons:'Lessons',topics:'Discussions',replies:'Replies'},
DS={articles:[['title','Title'],['category','Category'],['summary','Summary'],['body','Article text','t']],
courses:[['title','Title'],['description','Description','t'],['level','Level','s:Beginner,Intermediate,Advanced']],
lessons:[['title','Title'],['video_url','Video link (https://)'],['content','Notes','t'],['pos','Order','n']],
topics:[['title','Title'],['category','Category','s:'+cats],['body','Text','t'],['status','Status','s:visible,hidden,pending']],
replies:[['body','Text','t'],['status','Status','s:visible,hidden,pending']]};
const fld=(k,l,t,v)=>{const o=t&&t[0]==='s'?t.slice(2).split(','):0;return `<label>${l}${o?`<select name="${k}">${o.map(x=>`<option${x==v?' selected':''}>${esc(x)}</option>`).join('')}</select>`:t==='t'?`<textarea name="${k}" rows="6">${esc(v)}</textarea>`:`<input name="${k}"${t==='n'?' type="number"':''} value="${esc(v)}">`}</label>`};
const dvForm=(T,x={},extra='')=>`<form class="f" data-t="${T}"${x.id?` data-id="${x.id}"`:''}>${extra}${DS[T].map(([k,l,t])=>fld(k,l,t,x[k]??'')).join('')}<div class="row"><button class="btn sm">${x.id?'Save changes':'Create'}</button>${x.id?'<button type="button" class="btn sm alt" data-del>Delete</button>':''}</div></form>`;
async function devPage(t){
 if(t)dvTab=t;
 if(!isDev){app.innerHTML=wrap('<h1>Developer login</h1><form class="f" id="dl"><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button class="btn">Log in</button></form>');form('#dl',async d=>{await api('/dev/login','POST',d);await boot();return false},'Logged in');return}
 const o=await api('/dev/all'),T=dvTab,ct=Object.fromEntries(o.courses.map(c=>[c.id,c.title])),add=['articles','courses','lessons'].includes(T);
 app.innerHTML=wrap(`<h1>Developer studio <i class="dvdot"></i></h1><div class="row"><button class="btn sm alt" data-lo>Log out</button></div>
 <div class="dvtabs">${Object.keys(DN).map(k=>`<button class="btn sm ${k===T?'':'alt'}" data-tab="${k}">${DN[k]} (${o[k].length})</button>`).join('')}</div>
 ${add?`<details class="dvc"><summary><span>Add new</span></summary><div class="dvb">${dvForm(T,{},T==='lessons'?`<label>Class<select name="course_id">${o.courses.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>`:'')}</div></details>`:''}
 ${o[T].map(x=>`<details class="dvc"><summary><span>${esc(x.title||x.body.slice(0,70))}</span><small>${esc(T==='lessons'?ct[x.course_id]||'':x.status||x.level||x.category||'')}</small></summary><div class="dvb">${dvForm(T,x)}</div></details>`).join('')||empty('Nothing here yet.')}`);
 app.firstElementChild.classList.add('in');
 app.onclick=async e=>{const b=e.target.closest('[data-tab],[data-lo],[data-del]');if(!b)return;
  try{if(b.dataset.tab)return devPage(b.dataset.tab);if('lo'in b.dataset){await api('/dev/logout','POST');return boot()}
   if(!confirm('Delete permanently?'))return;const f=b.closest('form');await api(`/dev/${f.dataset.t}/${f.dataset.id}`,'DELETE');toast('Deleted');devPage()}catch(x){toast(x.message,true)}};
 app.onsubmit=async e=>{const f=e.target;if(!f.dataset.t)return;e.preventDefault();const d=Object.fromEntries(new FormData(f));
  try{f.dataset.id?await api(`/dev/${f.dataset.t}/${f.dataset.id}`,'PUT',d):await api(`/admin/${f.dataset.t}`,'POST',d);toast('Saved');devPage()}catch(x){toast(x.message,true)}}}
