const express=require('express'),http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const bcrypt=require('bcryptjs'),multer=require('multer'),cookieParser=require('cookie-parser');
const app=express(),server=http.createServer(app),io=require('socket.io')(server,{maxHttpBufferSize:1e7});
const DATA_DIR=process.env.DATA_DIR||__dirname,UPL=path.join(DATA_DIR,'uploads');fs.mkdirSync(UPL,{recursive:true});
const DBF=path.join(DATA_DIR,'data.json');
let db=fs.existsSync(DBF)?JSON.parse(fs.readFileSync(DBF)):{users:[],sessions:{},chats:[],messages:[],posts:[],friends:[]};
let saveT;const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>fs.writeFileSync(DBF,JSON.stringify(db)),200)};
const id=()=>crypto.randomBytes(8).toString('hex');
if(!db.users.length){const now=Date.now(),mk=(u,n,b)=>({id:id(),username:u,email:'',name:n,bio:b,avatar:'',pw:bcrypt.hashSync('Demo1234!',10),created:now});
  const a=mk('demo1','Demo One','First test account'),b=mk('demo2','Demo Two','Second test account');db.users.push(a,b);db.friends.push({from:a.id,to:b.id,accepted:true});
  const c={id:id(),group:false,members:[a.id,b.id]};db.chats.push(c);db.messages.push({id:id(),chat:c.id,from:b.id,ts:now,readBy:[],type:'text',text:'Hey! Welcome to Friendly 👋'});
  db.posts.push({id:id(),author:a.id,text:'Hello from Lagos! First post on Friendly 🎉',image:'',ts:now,likes:[b.id],comments:[]});fs.writeFileSync(DBF,JSON.stringify(db));console.log('Seeded demo accounts');}
const pub=u=>u&&({id:u.id,username:u.username,name:u.name,bio:u.bio||'',avatar:u.avatar||''});
const up=multer({storage:multer.diskStorage({destination:UPL,filename:(r,f,cb)=>cb(null,id()+path.extname(f.originalname||'').slice(0,6))}),limits:{fileSize:15e6}});
app.use(express.json());app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));app.use('/uploads',express.static(UPL));
const userBy=t=>{const uid=db.sessions[t];return db.users.find(u=>u.id===uid)};
const auth=(q,r,n)=>{q.user=userBy(q.cookies.sid);q.user?n():r.status(401).json({error:'Not signed in'})};
function register(username,password,name,email){
  username=String(username||'').trim().toLowerCase();
  if(!/^[a-z0-9_.]{3,20}$/.test(username))throw 'Username: 3-20 letters/numbers/_ .';
  if(String(password||'').length<6)throw 'Password must be 6+ characters';
  if(db.users.some(u=>u.username===username||(email&&u.email===email)))throw 'Username or email taken';
  const u={id:id(),username,email:email||'',name:name||username,bio:'',avatar:'',pw:bcrypt.hashSync(password,10),created:Date.now()};
  db.users.push(u);save();return u;}
const login=(r,u)=>{const t=id()+id();db.sessions[t]=u.id;save();r.cookie('sid',t,{httpOnly:true,sameSite:'lax',maxAge:90*864e5});r.json(pub(u))};
app.post('/api/register',(q,r)=>{try{login(r,register(q.body.username,q.body.password,q.body.name,(q.body.email||'').toLowerCase()))}catch(e){r.status(400).json({error:String(e)})}});
app.post('/api/login',(q,r)=>{const k=String(q.body.username||'').trim().toLowerCase();const u=db.users.find(u=>u.username===k||(u.email&&u.email===k));
  if(!u||!bcrypt.compareSync(q.body.password||'',u.pw))return r.status(400).json({error:'Wrong username or password'});login(r,u)});
app.post('/api/logout',(q,r)=>{delete db.sessions[q.cookies.sid];save();r.clearCookie('sid');r.json({ok:1})});
app.get('/api/me',auth,(q,r)=>r.json(pub(q.user)));
app.post('/api/me',auth,up.single('avatar'),(q,r)=>{const u=q.user;if(q.body.name)u.name=q.body.name.slice(0,40);if(q.body.bio!==undefined)u.bio=q.body.bio.slice(0,200);if(q.file)u.avatar='/uploads/'+q.file.filename;save();r.json(pub(u))});
app.get('/api/users',auth,(q,r)=>{const s=String(q.query.q||'').toLowerCase();r.json(db.users.filter(u=>u.id!==q.user.id&&(!s||u.username.includes(s)||u.name.toLowerCase().includes(s))).slice(0,30).map(u=>({...pub(u),friend:fstate(q.user.id,u.id)})))});
app.get('/api/users/:id',auth,(q,r)=>{const u=db.users.find(u=>u.id===q.params.id);if(!u)return r.sendStatus(404);r.json({...pub(u),friend:fstate(q.user.id,u.id),posts:db.posts.filter(p=>p.author===u.id).reverse().map(P(q.user.id))})});
// friends
function fstate(a,b){const f=db.friends.find(f=>(f.from===a&&f.to===b)||(f.from===b&&f.to===a));if(!f)return 'none';if(f.accepted)return 'friends';return f.from===a?'sent':'received'}
const friendIds=a=>db.friends.filter(f=>f.accepted&&(f.from===a||f.to===a)).map(f=>f.from===a?f.to:f.from);
app.post('/api/friends/:id',auth,(q,r)=>{const a=q.user.id,b=q.params.id;const f=db.friends.find(f=>(f.from===a&&f.to===b)||(f.from===b&&f.to===a));
  if(!f)db.friends.push({from:a,to:b,accepted:false});else if(f.to===a)f.accepted=true;save();emitU(b,'refresh');r.json({friend:fstate(a,b)})});
app.get('/api/friends',auth,(q,r)=>r.json({friends:friendIds(q.user.id).map(i=>pub(db.users.find(u=>u.id===i))),requests:db.friends.filter(f=>!f.accepted&&f.to===q.user.id).map(f=>pub(db.users.find(u=>u.id===f.from)))}));
// chats
const chatView=(c,me)=>{const msgs=db.messages.filter(m=>m.chat===c.id);const last=msgs[msgs.length-1];const others=c.members.filter(m=>m!==me).map(i=>pub(db.users.find(u=>u.id===i)));
  return {id:c.id,group:c.group,name:c.group?c.name:(others[0]||{}).name,members:c.members.map(i=>pub(db.users.find(u=>u.id===i))),other:c.group?null:others[0],last,unread:msgs.filter(m=>m.from!==me&&!(m.readBy||[]).includes(me)).length}};
app.get('/api/chats',auth,(q,r)=>{const s=String(q.query.q||'').toLowerCase();let cs=db.chats.filter(c=>c.members.includes(q.user.id)).map(c=>chatView(c,q.user.id));
  if(s)cs=cs.filter(c=>(c.name||'').toLowerCase().includes(s)||db.messages.some(m=>m.chat===c.id&&m.type==='text'&&m.text.toLowerCase().includes(s)));
  cs.sort((a,b)=>((b.last||{}).ts||0)-((a.last||{}).ts||0));r.json(cs)});
app.post('/api/chats/dm/:uid',auth,(q,r)=>{const a=q.user.id,b=q.params.uid;if(!db.users.find(u=>u.id===b))return r.sendStatus(404);
  let c=db.chats.find(c=>!c.group&&c.members.length===2&&c.members.includes(a)&&c.members.includes(b));if(!c){c={id:id(),group:false,members:[a,b]};db.chats.push(c);save()}r.json(chatView(c,a))});
app.post('/api/chats/group',auth,(q,r)=>{const m=[...new Set([q.user.id,...(q.body.members||[])])].filter(i=>db.users.find(u=>u.id===i));
  const c={id:id(),group:true,name:String(q.body.name||'Group').slice(0,40),members:m};db.chats.push(c);save();m.forEach(i=>emitU(i,'refresh'));r.json(chatView(c,q.user.id))});
app.post('/api/chats/:id/members',auth,(q,r)=>{const c=db.chats.find(c=>c.id===q.params.id&&c.members.includes(q.user.id)&&c.group);if(!c)return r.sendStatus(404);
  (q.body.members||[]).forEach(i=>{if(!c.members.includes(i)&&db.users.find(u=>u.id===i))c.members.push(i)});save();c.members.forEach(i=>emitU(i,'refresh'));r.json(chatView(c,q.user.id))});
const myChat=(q)=>db.chats.find(c=>c.id===q.params.id&&c.members.includes(q.user.id));
app.get('/api/chats/:id',auth,(q,r)=>{const c=myChat(q);if(!c)return r.sendStatus(404);let ch=false;
  const msgs=db.messages.filter(m=>m.chat===c.id);msgs.forEach(m=>{m.readBy=m.readBy||[];if(m.from!==q.user.id&&!m.readBy.includes(q.user.id)){m.readBy.push(q.user.id);ch=true}});
  if(ch){save();c.members.forEach(i=>emitU(i,'read',{chat:c.id}))}r.json({chat:chatView(c,q.user.id),messages:msgs.slice(-300)})});
function addMsg(c,from,o){const m={id:id(),chat:c.id,from,ts:Date.now(),readBy:[],...o};db.messages.push(m);save();c.members.forEach(i=>emitU(i,'message',m));return m}
app.post('/api/chats/:id/messages',auth,(q,r)=>{const c=myChat(q);if(!c)return r.sendStatus(404);const t=String(q.body.text||'').trim().slice(0,4000);if(!t)return r.sendStatus(400);r.json(addMsg(c,q.user.id,{type:'text',text:t}))});
app.post('/api/chats/:id/media',auth,up.single('file'),(q,r)=>{const c=myChat(q);if(!c||!q.file)return r.sendStatus(400);
  const type=(q.file.mimetype||'').startsWith('audio')?'voice':'image';r.json(addMsg(c,q.user.id,{type,url:'/uploads/'+q.file.filename,mime:q.file.mimetype,dur:+q.body.dur||0}))});
app.post('/api/chats/:id/read',auth,(q,r)=>{const c=myChat(q);if(!c)return r.sendStatus(404);db.messages.forEach(m=>{if(m.chat===c.id&&m.from!==q.user.id){m.readBy=m.readBy||[];if(!m.readBy.includes(q.user.id))m.readBy.push(q.user.id)}});save();c.members.forEach(i=>emitU(i,'read',{chat:c.id}));r.json({ok:1})});
// posts
const P=me=>p=>({...p,author:pub(db.users.find(u=>u.id===p.author)),liked:p.likes.includes(me),likes:p.likes.length,comments:p.comments.map(c=>({...c,author:pub(db.users.find(u=>u.id===c.author))}))});
app.get('/api/feed',auth,(q,r)=>{const ids=[q.user.id,...friendIds(q.user.id)];let ps=db.posts.filter(p=>ids.includes(p.author));if(ps.length<5)ps=db.posts;r.json(ps.slice(-100).reverse().map(P(q.user.id)))});
app.post('/api/posts',auth,up.single('image'),(q,r)=>{const t=String(q.body.text||'').slice(0,1000);if(!t&&!q.file)return r.sendStatus(400);
  const p={id:id(),author:q.user.id,text:t,image:q.file?'/uploads/'+q.file.filename:'',ts:Date.now(),likes:[],comments:[]};db.posts.push(p);save();r.json(P(q.user.id)(p))});
app.post('/api/posts/:id/like',auth,(q,r)=>{const p=db.posts.find(p=>p.id===q.params.id);if(!p)return r.sendStatus(404);const i=p.likes.indexOf(q.user.id);i<0?p.likes.push(q.user.id):p.likes.splice(i,1);save();r.json(P(q.user.id)(p))});
app.post('/api/posts/:id/comment',auth,(q,r)=>{const p=db.posts.find(p=>p.id===q.params.id);const t=String(q.body.text||'').trim().slice(0,500);if(!p||!t)return r.sendStatus(400);p.comments.push({id:id(),author:q.user.id,text:t,ts:Date.now()});save();r.json(P(q.user.id)(p))});
app.delete('/api/posts/:id',auth,(q,r)=>{db.posts=db.posts.filter(p=>!(p.id===q.params.id&&p.author===q.user.id));save();r.json({ok:1})});
// sockets
const online={};const emitU=(u,e,d)=>io.to('u:'+u).emit(e,d);
io.on('connection',s=>{const c=(s.handshake.headers.cookie||'').match(/sid=([a-f0-9]+)/);const u=c&&userBy(c[1]);if(!u)return s.disconnect();
  s.join('u:'+u.id);online[u.id]=(online[u.id]||0)+1;io.emit('presence',{id:u.id,on:true});
  s.on('online?',(ids,cb)=>cb&&cb((ids||[]).filter(i=>online[i])));
  s.on('typing',chat=>{const ch=db.chats.find(x=>x.id===chat&&x.members.includes(u.id));ch&&ch.members.forEach(i=>i!==u.id&&emitU(i,'typing',{chat,from:u.id,name:u.name}))});
  s.on('call',d=>{if(d&&d.to)emitU(d.to,'call',{...d,from:u.id,fromName:u.name})}); // signaling relay
  s.on('disconnect',()=>{online[u.id]--;if(!online[u.id]){delete online[u.id];io.emit('presence',{id:u.id,on:false})}})});
// seed
if(!db.users.find(u=>u.username==='demo1')){const a=register('demo1','Demo1234!','Demo One'),b=register('demo2','Demo1234!','Demo Two');a.bio='First test account';b.bio='Second test account';
  db.friends.push({from:a.id,to:b.id,accepted:true});const c={id:id(),group:false,members:[a.id,b.id]};db.chats.push(c);
  db.messages.push({id:id(),chat:c.id,from:b.id,ts:Date.now(),readBy:[],type:'text',text:'Hey! Welcome to Friendly 👋'});
  db.posts.push({id:id(),author:a.id,text:'Hello from Lagos! First post on Friendly 🎉',image:'',ts:Date.now(),likes:[b.id],comments:[]});save()}
app.use((q,r)=>r.sendFile(path.join(__dirname,'public','index.html')));
server.listen(process.env.PORT||3300,()=>console.log('Friendly on',process.env.PORT||3300));
