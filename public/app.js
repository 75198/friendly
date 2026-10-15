const $=s=>document.querySelector(s),A=document.getElementById('app');let me=null,tab='chats',sock,onlineSet=new Set(),cur=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(u,o={}){const r=await fetch(u,{credentials:'same-origin',...o,headers:o.body instanceof FormData?{}:{'Content-Type':'application/json'},body:o.body&&!(o.body instanceof FormData)?JSON.stringify(o.body):o.body});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw j.error||'Error '+r.status;return j}
const cols=['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#06b6d4','#ef4444','#22c55e'];
const av=(u,sz=44)=>{u=u||{};const c=cols[[...(u.username||'x')].reduce((a,c)=>a+c.charCodeAt(0),0)%8];const i=(u.name||u.username||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return `<div class="av ${onlineSet.has(u.id)?'on':''}" style="width:${sz}px;height:${sz}px;font-size:${sz*.38}px;background-color:${c};${u.avatar?`background-image:url(${u.avatar})`:''}">${u.avatar?'':esc(i)}</div>`};
const tm=t=>{const d=new Date(t),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString([],{month:'short',day:'numeric'})};
const ago=t=>{const s=(Date.now()-t)/1e3;return s<60?'now':s<3600?Math.floor(s/60)+'m':s<86400?Math.floor(s/3600)+'h':Math.floor(s/86400)+'d'};
const I={chat:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
 home:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
 people:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5"/></svg>',
 me:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>',
 send:'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 20.5l18-8.5L3 3.5l2.5 8.5zm2.5-8.5H13"/></svg>',
 mic:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
 img:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
 phone:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/></svg>',
 video:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="M16 10l6-3v10l-6-3z"/></svg>',
 back:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
 plus:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 search:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
 heart:'<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/></svg>',
 cmt:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>'};
const L='<span class="logo">●</span> ';
function shell(title,body,right=''){A.innerHTML=`<div class="top"><h1>${title}</h1>${right}</div><div class="main" id="main">${body}</div><div class="tabs">${[['feed','home','Home'],['chats','chat','Chats'],['people','people','People'],['me','me','Profile']].map(([k,i,l])=>`<button class="${tab===k?'on':''}" onclick="go('${k}')">${I[i]}<span>${l}</span></button>`).join('')}</div>`}
function go(t){tab=t;cur=null;history.replaceState(0,'','#'+t);({feed,chats,people,me:profile})[t]()}
// AUTH
function authView(reg){A.innerHTML=`<div class="auth"><div class="brand"><div class="blob">${I.chat}</div><h1>Friendly</h1><p>Chat, voice notes & moments with your people.</p></div>
<form class="col card" id="af">${reg?'<input name="name" placeholder="Display name" required><input name="email" type="email" placeholder="Email (optional)">':''}
<input name="username" placeholder="${reg?'Username':'Username or email'}" autocapitalize="none" autocomplete="username" required><input name="password" type="password" placeholder="Password" autocomplete="${reg?'new':'current'}-password" required>
<div class="err" id="er"></div><button class="btn">${reg?'Create account':'Sign in'}</button>
<p class="mut c">${reg?'Have an account?':'New here?'} <a href="#" id="sw">${reg?'Sign in':'Create an account'}</a></p>${reg?'':'<p class="mut c">Demo: demo1 / Demo1234!</p>'}</form></div>`;
 $('#sw').onclick=e=>{e.preventDefault();authView(!reg)};
 $('#af').onsubmit=async e=>{e.preventDefault();try{me=await api(reg?'/api/register':'/api/login',{method:'POST',body:Object.fromEntries(new FormData(e.target))});start()}catch(x){$('#er').textContent=x}}}
// CHATS
async function chats(q=''){if(!$('#cs')){shell(L+'Chats','<div class="sbar">'+I.search+'<input id="cs" placeholder="Search chats & messages"></div><div id="cl"></div>',`<button class="ib round" onclick="newGroup()" title="New group">${I.plus}</button>`);
  let t;$('#cs').oninput=e=>{clearTimeout(t);t=setTimeout(()=>chats(e.target.value),250)}}
 const cs=await api('/api/chats?q='+encodeURIComponent(q));if(tab!=='chats'||cur)return;
 $('#cl').innerHTML=cs.length?cs.map(c=>`<div class="row tap" onclick="openChat('${c.id}')">${c.group?`<div class="av grp">${esc((c.name||'G')[0])}</div>`:av(c.other)}<div class="grow"><div class="flex"><span class="nm ell">${esc(c.name)}</span><span class="mut">${c.last?tm(c.last.ts):''}</span></div>
 <div class="flex"><span class="mut ell">${c.last?(c.last.from===me.id?'You: ':'')+(c.last.type==='voice'?'🎤 Voice note':c.last.type==='image'?'📷 Photo':esc(c.last.text)):'No messages yet'}</span>${c.unread?`<span class="badge">${c.unread}</span>`:''}</div></div></div>`).join(''):`<div class="empty">${I.chat}<p>No chats yet.<br>Find people in the <b>People</b> tab.</p></div>`}
async function newGroup(){const f=await api('/api/friends');const all=f.friends.length?f.friends:(await api('/api/users'));cur=null;
 A.innerHTML=`<div class="top"><button class="ib" onclick="go('chats')">${I.back}</button><h1>New group</h1></div><div class="main pad col"><input id="gn" placeholder="Group name"><div class="mut">Add members</div>
 ${all.map(u=>`<label class="sel">${av(u,36)}<span class="grow">${esc(u.name)} <span class="mut">@${esc(u.username)}</span></span><input type="checkbox" value="${u.id}"></label>`).join('')}<button class="btn" id="gc">Create group</button></div>`;
 $('#gc').onclick=async()=>{const m=[...document.querySelectorAll('.sel input:checked')].map(i=>i.value);const c=await api('/api/chats/group',{method:'POST',body:{name:$('#gn').value||'Group',members:m}});openChat(c.id)}}
async function dm(uid){const c=await api('/api/chats/dm/'+uid,{method:'POST'});openChat(c.id)}
async function openChat(id){const d=await api('/api/chats/'+id);cur=d.chat;const c=cur;
 A.innerHTML=`<div class="top"><button class="ib" onclick="go('chats')">${I.back}</button>${c.group?`<div class="av grp" style="width:38px;height:38px">${esc(c.name[0])}</div>`:av(c.other,38)}
 <h1 class="ct" onclick="${c.group?'groupInfo()':`viewUser('${c.other.id}')`}">${esc(c.name)}<small id="sub" class="mut">${c.group?c.members.length+' members':onlineSet.has(c.other.id)?'online':'@'+esc(c.other.username)}</small></h1>
 ${c.group?'':`<button class="ib" onclick="startCall(false)">${I.phone}</button><button class="ib" onclick="startCall(true)">${I.video}</button>`}</div>
 <div class="main" id="main"><div class="msgs" id="ms"></div></div>
 <div class="composer" id="cmp"><label class="ib">${I.img}<input type="file" accept="image/*" hidden id="pf"></label><textarea id="tx" rows="1" placeholder="Message"></textarea><button class="ib accent" id="sb">${I.mic}</button></div>`;
 d.messages.forEach(addM);scrollB();const tx=$('#tx'),sb=$('#sb');
 tx.oninput=()=>{tx.style.height='auto';tx.style.height=tx.scrollHeight+'px';sb.innerHTML=tx.value.trim()?I.send:I.mic;sock.emit('typing',c.id)};
 tx.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!/iPhone|Android/.test(navigator.userAgent)){e.preventDefault();sb.click()}};
 sb.onclick=async()=>{const t=tx.value.trim();if(t){tx.value='';tx.oninput();await api(`/api/chats/${c.id}/messages`,{method:'POST',body:{text:t}})}else record()};
 $('#pf').onchange=async e=>{const fd=new FormData();fd.append('file',e.target.files[0]);await api(`/api/chats/${c.id}/media`,{method:'POST',body:fd})}}
function groupInfo(){alert('Members:\n'+cur.members.map(m=>m.name+' (@'+m.username+')').join('\n'))}
const scrollB=()=>{const m=$('#main');m&&(m.scrollTop=1e9)};
function addM(m){const ms=$('#ms');if(!ms||document.getElementById('m'+m.id))return;const mine=m.from===me.id;const sender=cur.members.find(u=>u.id===m.from)||{};
 const read=mine&&(m.readBy||[]).length?'<span class="rd">✓✓</span>':mine?'✓':'';
 ms.insertAdjacentHTML('beforeend',`<div class="m ${mine?'me':''}" id="m${m.id}">${cur.group&&!mine?`<div class="who">${esc(sender.name)}</div>`:''}${m.type==='text'?esc(m.text):m.type==='image'?`<img src="${m.url}" onload="scrollB()">`:`<audio controls preload="metadata" src="${m.url}"></audio>`}<div class="t">${tm(m.ts)} ${read}</div></div>`)}
// voice notes
let rec;async function record(){if(rec)return;let st;try{st=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return alert('Microphone permission needed for voice notes.')}
 const mt=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t))||'';
 rec=new MediaRecorder(st,mt?{mimeType:mt}:{});const ch=[],t0=Date.now();let cancel=false;rec.ondataavailable=e=>ch.push(e.data);
 const cmp=$('#cmp'),old=cmp.innerHTML;cmp.innerHTML=`<button class="ib" id="rc">✕</button><div class="rec"><span class="dot"></span> Recording <span id="rt">0:00</span></div><button class="ib accent" id="rs">${I.send}</button>`;
 const iv=setInterval(()=>{const s=Math.floor((Date.now()-t0)/1e3);$('#rt')&&($('#rt').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))},500);
 rec.onstop=async()=>{clearInterval(iv);st.getTracks().forEach(t=>t.stop());const id=cur.id;rec=null;openChat(id);if(cancel)return;
  const b=new Blob(ch,{type:ch[0]?.type||mt||'audio/webm'});const fd=new FormData();fd.append('file',b,'voice.'+(b.type.includes('mp4')?'m4a':'webm'));fd.append('dur',(Date.now()-t0)/1e3);await api(`/api/chats/${id}/media`,{method:'POST',body:fd})};
 $('#rc').onclick=()=>{cancel=true;rec.stop()};$('#rs').onclick=()=>rec.stop();rec.start()}
// PEOPLE
async function people(q=''){if(!$('#ps')){shell(L+'People','<div class="sbar">'+I.search+'<input id="ps" placeholder="Search by name or @username" autocapitalize="none"></div><div id="rq"></div><div id="pl"></div>');let t;$('#ps').oninput=e=>{clearTimeout(t);t=setTimeout(()=>people(e.target.value),250)}}
 const [us,f]=await Promise.all([api('/api/users?q='+encodeURIComponent(q)),api('/api/friends')]);if(tab!=='people')return;
 $('#rq').innerHTML=f.requests.length?'<div class="sec">Friend requests</div>'+f.requests.map(u=>`<div class="row">${av(u)}<div class="grow nm">${esc(u.name)}</div><button class="btn sm" onclick="addF('${u.id}')">Accept</button></div>`).join(''):'';
 $('#pl').innerHTML='<div class="sec">'+(q?'Results':'Discover people')+'</div>'+(us.map(u=>`<div class="row">${'<span onclick="viewUser(\''+u.id+'\')">'+av(u)+'</span>'}<div class="grow" onclick="viewUser('${u.id}')"><div class="nm ell">${esc(u.name)}</div><div class="mut">@${esc(u.username)}</div></div>
 ${fb(u)}<button class="btn sm" onclick="dm('${u.id}')">Message</button></div>`).join('')||'<p class="pad mut">No one found.</p>')}
const fb=u=>u.friend==='friends'?'<span class="pill">Friends</span>':u.friend==='sent'?'<span class="pill">Requested</span>':`<button class="btn sm ghost" onclick="addF('${u.id}')">${u.friend==='received'?'Accept':'Add'}</button>`;
async function addF(id){await api('/api/friends/'+id,{method:'POST'});tab==='people'?people($('#ps')?.value||''):viewUser(id)}
async function viewUser(id){const u=await api('/api/users/'+id);cur=null;A.innerHTML=`<div class="top"><button class="ib" onclick="go(tab)">${I.back}</button><h1>@${esc(u.username)}</h1></div><div class="main">${profHead(u)}
 <div class="pad flex g">${fb(u)}<button class="btn sm" onclick="dm('${u.id}')">Message</button></div><div class="sec">Posts</div>${u.posts.map(postH).join('')||'<p class="pad mut">No posts yet.</p>'}</div>`}
const profHead=u=>`<div class="ph"><div class="cover"></div>${av(u,92)}<h2>${esc(u.name)}</h2><div class="mut">@${esc(u.username)}</div><p>${esc(u.bio)}</p></div>`;
// FEED
const postH=p=>`<div class="post" id="p${p.id}"><div class="flex g">${av(p.author,40)}<div class="grow"><div class="nm">${esc(p.author.name)}</div><div class="mut">@${esc(p.author.username)} · ${ago(p.ts)}</div></div></div>
 ${p.text?`<div class="ptx">${esc(p.text)}</div>`:''}${p.image?`<img src="${p.image}">`:''}<div class="acts"><button class="${p.liked?'liked':''}" onclick="like('${p.id}')">${I.heart} ${p.likes}</button><button onclick="this.closest('.post').querySelector('.cmts').classList.toggle('hidden')">${I.cmt} ${p.comments.length}</button></div>
 <div class="cmts ${p.comments.length?'':'hidden'}">${p.comments.map(c=>`<div class="cm"><b>${esc(c.author.name)}</b> ${esc(c.text)}</div>`).join('')}<form onsubmit="cmt(event,'${p.id}')"><input placeholder="Add a comment…" name="t"></form></div></div>`;
async function feed(){shell(L+'Friendly',`<div class="compose card"><div class="flex g">${av(me,40)}<textarea id="pt" rows="2" placeholder="What's happening, ${esc(me.name.split(' ')[0])}?"></textarea></div><div class="flex"><label class="ib">${I.img}<input type="file" accept="image/*" hidden id="pi"></label><span class="mut grow" id="pin"></span><button class="btn sm" id="pp">Post</button></div></div><div id="fd"></div>`);
 $('#pi').onchange=e=>$('#pin').textContent=e.target.files[0]?.name||'';
 $('#pp').onclick=async()=>{const fd=new FormData();fd.append('text',$('#pt').value);if($('#pi').files[0])fd.append('image',$('#pi').files[0]);try{await api('/api/posts',{method:'POST',body:fd});feed()}catch(e){}};
 const ps=await api('/api/feed');$('#fd')&&($('#fd').innerHTML=ps.map(postH).join('')||'<p class="pad mut">No posts yet — say hi!</p>')}
async function like(id){const p=await api(`/api/posts/${id}/like`,{method:'POST'});document.getElementById('p'+id).outerHTML=postH(p)}
async function cmt(e,id){e.preventDefault();const t=e.target.t.value;if(!t)return;const p=await api(`/api/posts/${id}/comment`,{method:'POST',body:{text:t}});document.getElementById('p'+id).outerHTML=postH(p)}
// PROFILE / SETTINGS
function profile(){shell('Profile',`${profHead(me)}<form class="pad col card" id="pf"><div class="sec0">Edit profile</div><label class="mut">Display name</label><input name="name" value="${esc(me.name)}"><label class="mut">Bio</label><textarea name="bio" rows="3">${esc(me.bio)}</textarea>
 <label class="mut">Avatar photo</label><input type="file" name="avatar" accept="image/*"><button class="btn">Save changes</button><div class="mut" id="sv"></div></form><div class="pad"><button class="btn ghost w" onclick="logout()">Log out</button></div>`);
 $('#pf').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);if(!e.target.avatar.files[0])fd.delete('avatar');me=await api('/api/me',{method:'POST',body:fd});profile();$('#sv').textContent='Saved ✓'}}
async function logout(){await api('/api/logout',{method:'POST'});sock&&sock.disconnect();me=null;authView()}
// CALLS (WebRTC, signaling over socket.io)
let pc,ls,peer;const ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
function callUI(txt,inc){$('#call').classList.remove('hidden');$('#callInfo').textContent=txt;$('#acceptBtn').classList.toggle('hidden',!inc)}
function endCall(send=true){if(send&&peer)sock.emit('call',{to:peer,kind:'end'});pc&&pc.close();pc=null;ls&&ls.getTracks().forEach(t=>t.stop());ls=null;peer=null;$('#call').classList.add('hidden');$('#rv').srcObject=null}
function mkPC(){pc=new RTCPeerConnection(ICE);pc.onicecandidate=e=>e.candidate&&sock.emit('call',{to:peer,kind:'ice',c:e.candidate});pc.ontrack=e=>{$('#rv').srcObject=e.streams[0];$('#callInfo').textContent=''};
 pc.onconnectionstatechange=()=>['failed','disconnected'].includes(pc?.connectionState)&&($('#callInfo').textContent='Connection lost');ls.getTracks().forEach(t=>pc.addTrack(t,ls))}
async function startCall(video){if(!window.RTCPeerConnection)return alert('Calls not supported on this browser');peer=cur.other.id;callUI('Calling '+cur.other.name+'…');
 try{ls=await navigator.mediaDevices.getUserMedia({audio:true,video});$('#lv').srcObject=ls;mkPC();const o=await pc.createOffer();await pc.setLocalDescription(o);sock.emit('call',{to:peer,kind:'offer',sdp:o,video})}catch(e){alert('Could not start call: '+e.message);endCall()}}
let pendingOffer;function onCall(d){if(d.kind==='offer'){if(peer)return sock.emit('call',{to:d.from,kind:'end'});peer=d.from;pendingOffer=d;callUI(d.fromName+(d.video?' is video calling…':' is calling…'),true)}
 else if(d.from!==peer)return;else if(d.kind==='answer')pc.setRemoteDescription(d.sdp);else if(d.kind==='ice'&&pc)pc.addIceCandidate(d.c).catch(()=>{});else if(d.kind==='end')endCall(false)}
$('#acceptBtn').onclick=async()=>{const d=pendingOffer;$('#acceptBtn').classList.add('hidden');$('#callInfo').textContent='Connecting…';try{ls=await navigator.mediaDevices.getUserMedia({audio:true,video:!!d.video});$('#lv').srcObject=ls;mkPC();
 await pc.setRemoteDescription(d.sdp);const a=await pc.createAnswer();await pc.setLocalDescription(a);sock.emit('call',{to:peer,kind:'answer',sdp:a})}catch(e){alert(e.message);endCall()}};
$('#hangBtn').onclick=()=>endCall();
// START
function start(){sock=io();sock.on('message',m=>{if(cur&&m.chat===cur.id){addM(m);scrollB();if(m.from!==me.id)api(`/api/chats/${cur.id}/read`,{method:'POST'})}else if(tab==='chats'&&!cur)chats($('#cs')?.value||'')});
 sock.on('read',d=>{if(cur&&d.chat===cur.id)document.querySelectorAll('.m.me .t').forEach(t=>t.innerHTML=t.innerHTML.replace(/✓(?!✓)$|✓$/,'<span class="rd">✓✓</span>'))});
 sock.on('typing',d=>{if(cur&&d.chat===cur.id&&$('#sub')){const s=$('#sub'),o=s.dataset.o||s.textContent;s.dataset.o=o;s.textContent=(cur.group?d.name+' is ':'')+'typing…';clearTimeout(s._t);s._t=setTimeout(()=>s.textContent=o,2000)}});
 sock.on('presence',p=>{p.on?onlineSet.add(p.id):onlineSet.delete(p.id)});sock.on('refresh',()=>{if(!cur&&tab!=='me')go(tab)});sock.on('call',onCall);
 sock.on('connect',()=>api('/api/users').then(us=>sock.emit('online?',us.map(u=>u.id),ids=>{ids.forEach(i=>onlineSet.add(i));if(!cur)go(tab)})));
 go((location.hash||'#chats').slice(1).replace(/[^a-z]/g,'')||'chats')}
if(!['feed','chats','people','me'].includes(location.hash.slice(1)))location.hash='';
api('/api/me').then(u=>{me=u;tab=location.hash.slice(1)||'chats';start()}).catch(()=>authView());
