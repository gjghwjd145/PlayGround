import * as THREE from 'three';

const $ = (s, root=document) => root.querySelector(s);
const defaults = {
  glow:120, dew:8, day:1, view:'home', selected:0, questDone:false, wins:0,
  slimes:[
    {id:1,name:'Moss',kind:'Mossling',color:'#9de5b5',element:'Leaf',rarity:'COMMON',hp:42,maxHp:42,atk:9,level:2,xp:20,mood:76,energy:88},
    {id:2,name:'Pip',kind:'Dewdrop',color:'#8ed8eb',element:'Water',rarity:'COMMON',hp:35,maxHp:35,atk:8,level:1,xp:8,mood:64,energy:92}
  ],
  battle:null, recipe:['leaf','dew'], zone:0
};
let state;
try { state = {...defaults,...JSON.parse(localStorage.getItem('slimebound-save')||'{}')}; } catch { state={...defaults}; }
state.slimes ||= defaults.slimes.map(s=>({...s}));
if (!state.slimes.length) state.slimes=defaults.slimes.map(s=>({...s}));
state.selected=Math.min(state.selected||0,state.slimes.length-1);
const ingredients={leaf:{name:'Sunleaf',icon:'☘',color:'#9de5b5',element:'Leaf',kind:'Mossling',atk:9,hp:42},dew:{name:'Moon dew',icon:'✧',color:'#8ed8eb',element:'Water',kind:'Dewdrop',atk:8,hp:38},ember:{name:'Ember seed',icon:'♨',color:'#ffad8b',element:'Fire',kind:'Cinder',atk:11,hp:34},luna:{name:'Star dust',icon:'✦',color:'#c7a8ff',element:'Arcane',kind:'Starlit',atk:10,hp:40},mushroom:{name:'Glowcap',icon:'❋',color:'#f1cf8c',element:'Earth',kind:'Glowcap',atk:8,hp:48}};
const zones=[{name:'Whispering Woods',icon:'♧',level:1,foe:'Bramble Bug',foeIcon:'🪲',hp:42,reward:28,dew:2},{name:'Moonlit Marsh',icon:'☾',level:3,foe:'Gloom Wisp',foeIcon:'👾',hp:64,reward:46,dew:3},{name:'Ember Hollow',icon:'♨',level:5,foe:'Ashling',foeIcon:'🐲',hp:88,reward:68,dew:4}];
let activeScene=null, toastTimer;
function save(){localStorage.setItem('slimebound-save',JSON.stringify(state));updateResources();}
function updateResources(){ $('#coin-count').textContent=state.glow;$('#dew-count').textContent=state.dew;$('#day-count').textContent=String(state.day).padStart(2,'0');$('#quest-progress').style.width=state.questDone?'100%':'0%';$('#quest-progress-label').textContent=state.questDone?'1 / 1':'0 / 1'; }
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2100);}
function selectedSlime(){return state.slimes[state.selected]||state.slimes[0];}
function stat(label,val,max){return `<div class="stat-row"><span class="stat-label">${label}</span><div class="stat-track"><span style="width:${Math.max(3,Math.min(100,val/max*100))}%"></span></div><b class="stat-value">${val}</b></div>`;}
function header(eyebrow,title,sub,extra=''){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><div class="heading-sub">${sub}</div></div>${extra}</div>`;}
function renderHome(){
 const s=selectedSlime();
 $('#main-content').innerHTML=`${header('YOUR LITTLE WORLD','A good day to grow.','A quiet place for tiny friends and big adventures.',`<div class="weather-pill"><span>☼</span> Soft sunshine</div>`)}
 <div class="game-grid"><section class="scene-card" aria-label="3D slime habitat"><canvas id="world-canvas"></canvas><div class="scene-vignette"></div><div class="scene-topline"><div class="habitat-label"><span></span> MOSSY GLADE</div><div class="scene-weather">✧ &nbsp;Little things are growing</div></div><div class="scene-bottom"><div><div class="scene-name">The Fernlight Clearing</div><div class="scene-caption">Home is wherever your slime is.</div></div><div class="scene-badge">✦ &nbsp;LEVEL ${s.level} COMPANION</div></div></section>
 <section class="slime-card"><div class="slime-card-header"><div><div class="slime-kicker">YOUR COMPANION</div><div class="slime-name">${s.name} <span style="font-size:15px">${s.element==='Fire'?'♨':s.element==='Water'?'✧':s.element==='Arcane'?'✦':'☘'}</span></div></div><span class="rarity">${s.rarity}</span></div><div class="slime-desc">${s.kind} · ${s.element} element<br>${s.level>1?'Growing stronger with you.':'A curious little friend, ready for anything.'}</div>${stat('HEALTH',s.hp,s.maxHp)}${stat('POWER',s.atk,20)}<div class="mood-line"><span>♡ &nbsp;Happiness</span><b class="mood-value">${moodText(s.mood)} &nbsp;${s.mood}%</b></div><div class="divider"></div><div class="slime-actions"><button class="button button-primary" data-action="feed">♡ &nbsp;Give a treat <span style="opacity:.65">· 1 dew</span></button><button class="button button-secondary" data-action="play">✦ &nbsp;Play together</button></div></section></div>
 <div class="lower-grid"><section class="info-panel"><div class="panel-heading"><div class="panel-title">Your little friends</div><button class="panel-link" data-view="collection">SEE ALL &nbsp;↗</button></div><div class="slime-roster">${state.slimes.map((x,i)=>`<button class="roster-item ${i===state.selected?'selected':''}" data-action="select" data-index="${i}"><span class="roster-orb" style="background:${x.color}">• •</span><span><b>${x.name}</b><small>Lv. ${x.level} ${x.kind}</small></span></button>`).join('')}</div></section><section class="info-panel"><div class="panel-heading"><div class="panel-title">A little adventure?</div><button class="panel-link" data-view="explore">EXPLORE &nbsp;↗</button></div><div class="activity-panel"><div class="activity-icon">⚔</div><div class="activity-copy"><b>Whispering Woods</b><span>Easy · A good first journey</span></div><button class="activity-go" data-view="explore" aria-label="Explore">→</button></div></section></div>`;
 mountScene(s);
}
function moodText(v){return v>79?'Very happy':v>59?'Content':v>34?'A little shy':'Needs a hug';}
function renderLab(){
 $('#main-content').innerHTML=`<div class="content-wrap">${header('THE LITTLE ALCHEMY','Make a new friend.','Mix a few found things together. Who knows what might pop out?')}<div class="lab-layout"><section class="feature-card"><h2>Choose your ingredients</h2><p>Every combination makes a different kind of little slime. You can make a new recipe more than once.</p><div class="recipe-ingredients">${Object.entries(ingredients).map(([id,x])=>`<button class="ingredient ${state.recipe.includes(id)?'selected':''}" data-action="ingredient" data-id="${id}"><span class="ing-icon" style="color:${x.color}">${x.icon}</span><b>${x.name}</b><small>Found in the wild</small></button>`).join('')}</div><div class="recipe-actions"><div class="recipe-cost">Crafting uses <b>45 ✦</b> and <b>3 ◈</b></div><button class="button button-primary craft-btn" data-action="craft">✧ &nbsp;Make a slime</button></div></section><section class="feature-card"><div class="panel-heading"><div><h2>Your little recipe</h2><p id="recipe-label">A lovely pairing...</p></div><span class="rarity">${state.recipe.length===2?'MIX':'PICK 2'}</span></div><div class="recipe-preview"><div class="preview-orb" style="background:radial-gradient(circle at 35% 25%,#fff,${ingredients[state.recipe[0]]?.color||'#9de5b5'} 35%,${ingredients[state.recipe[1]]?.color||'#63bba3'} 88%);box-shadow:inset -15px -15px 22px #1c76634f,inset 9px 8px 17px #ffffff70,0 15px 35px ${ingredients[state.recipe[0]]?.color||'#6ef1c5'}44"></div></div><div class="lab-result">${state.recipe.length===2?`<b>${ingredients[state.recipe[0]].kind} + ${ingredients[state.recipe[1]].kind}</b><br>Your new friend will inherit a blend of both elements.`:'Select two ingredients to discover a recipe.'}</div></section></div><div class="feature-card" style="display:flex;align-items:center;gap:14px"><div class="activity-icon" style="font-size:20px">☘</div><div class="activity-copy"><b>Little tip from the alchemist</b><span>Try mixing different ingredients to discover all five slime families.</span></div></div></div>`;
}
function renderExplore(){
 const z=zones[state.zone];
 $('#main-content').innerHTML=`<div class="content-wrap">${header('BEYOND THE GLADE','The wild is waiting.','Take a friend along. Every journey brings a little treasure.')}
 <div class="explore-layout"><section class="feature-card"><h2>Choose a place to wander</h2><p>Pick a trail that feels right for your companion's level.</p><div class="zone-list">${zones.map((a,i)=>`<button class="zone-card ${i===state.zone?'selected':''}" data-action="zone" data-index="${i}"><span class="zone-art">${a.icon}</span><span class="zone-info"><b>${a.name}</b><small>Find ${a.foe} · Reward ${a.reward} glow + ${a.dew} dew</small></span><span class="zone-level">Lv. ${a.level}+</span></button>`).join('')}</div><button class="button button-primary" style="width:100%;margin-top:16px" data-action="begin-adventure">⚔ &nbsp;Set off to ${z.name}</button></section>
 <section class="feature-card battle-card">${state.battle?battleHTML():`<div class="panel-heading"><div><h2>Your travel buddy</h2><p>Ready to make a new friend?</p></div><span class="rarity">LV. ${selectedSlime().level}</span></div><div class="battle-enemy" style="filter:none;font-size:54px">${selectedSlime().element==='Water'?'💧':selectedSlime().element==='Fire'?'🔥':'🌱'}</div><div class="battle-status" style="text-align:center">${selectedSlime().name} is feeling ${moodText(selectedSlime().mood).toLowerCase()}.</div><div class="divider"></div><div class="mood-line"><span>Journey difficulty</span><b class="mood-value">${selectedSlime().level>=z.level?'A comfy stroll':'A little challenging'}</b></div><div class="mood-line"><span>On a good day, find</span><b style="color:var(--gold)">${z.reward} ✦ &nbsp; ${z.dew} ◈</b></div>`}</section></div></div>`;
}
function battleHTML(){const b=state.battle;const z=zones[b.zone];const s=selectedSlime();return `<div class="panel-heading"><div><h2>${b.won?'A little victory!':b.enemyHp<=0?'All clear!':`A wild ${z.foe}!`}</h2><p>${b.won?'Your friend did wonderfully.':`Journeying through ${z.name}`}</p></div><span class="rarity">ROUND ${b.round}</span></div><div class="battle-enemy">${b.enemyHp<=0?'✨':z.foeIcon}</div><div class="battle-hp">${z.foe} · ${b.enemyHp} / ${z.hp}<div class="stat-track"><span style="width:${Math.max(0,b.enemyHp/z.hp*100)}%;background:linear-gradient(90deg,#ff9d91,#ffd18c)"></span></div></div><div class="battle-status">${b.message||`${s.name} is ready. What should they do?`}</div><div class="battle-controls">${b.enemyHp>0?`<button class="button button-primary" data-action="attack">✦ &nbsp;Boop! (${s.atk})</button><button class="button button-secondary" data-action="special" ${state.dew<2?'disabled':''}>✧ &nbsp;Spark (2 dew)</button>`:`<button class="button button-primary" data-action="claim-reward">Collect the goodies</button>`}<button class="button button-secondary" data-action="leave-battle">${b.enemyHp>0?'Retreat':'Done'}</button></div>`;}
function renderCollection(){
 const known=new Set(state.slimes.map(s=>s.kind));const catalog=Object.values(ingredients).map(x=>({kind:x.kind,element:x.element,color:x.color,rarity:'COMMON'}));
 $('#main-content').innerHTML=`<div class="content-wrap">${header('A GROWING LITTLE FAMILY','All your little friends.','Every slime has its own look, mood, and way of being wonderful.')}<div class="feature-card" style="display:flex;justify-content:space-between;align-items:center"><div><h2>${state.slimes.length} of 5 discovered</h2><p>Make new friends in the slime lab.</p></div><button class="button button-primary" data-view="lab">✧ &nbsp;Visit the lab</button></div><div class="collection-grid">${catalog.map((c)=>`<article class="collection-card ${known.has(c.kind)?'':'collection-empty'}"><span class="rarity">${known.has(c.kind)?'FOUND':'???'}</span><div class="collection-orb" style="background:${known.has(c.kind)?c.color:''}"></div><b>${known.has(c.kind)?c.kind:'Undiscovered'}</b><small>${known.has(c.kind)?c.element+' element':'A new friend is out there'}</small></article>`).join('')}</div></div>`;
}
function render(){
 if(activeScene){activeScene.dispose();activeScene=null;}
 document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
 if(state.view==='home')renderHome();else if(state.view==='lab')renderLab();else if(state.view==='explore')renderExplore();else renderCollection();
 updateResources();save();
}
function go(view){state.view=view;render();window.scrollTo({top:0,behavior:'smooth'});}
function mountScene(slime){
 const canvas=$('#world-canvas');if(!canvas)return;
 try{activeScene=new HabitatScene(canvas,slime);}catch(err){console.warn('3D habitat could not start',err);canvas.style.background='radial-gradient(ellipse at 50% 70%,#719b7c,#34505c 65%,#28384e)';}
}
function showModal(title,content,actions=''){const root=$('#modal-root');root.innerHTML=`<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>${title}</h2><button class="close-modal" data-action="close-modal" aria-label="Close">×</button></div>${content}${actions?`<div class="modal-actions">${actions}</div>`:''}</section></div>`;}
function closeModal(){$('#modal-root').innerHTML='';}
function treat(){const s=selectedSlime();if(state.dew<1){toast('No dew left — try a little adventure!');return;}state.dew--;s.mood=Math.min(100,s.mood+16);s.xp+=5;if(!state.questDone){state.questDone=true;state.glow+=15;toast(`${s.name} loved that! Task complete · +15 glow`);}else toast(`${s.name} is looking very happy! +5 XP`);if(s.xp>=50){s.xp-=50;s.level++;s.maxHp+=5;s.hp=Math.min(s.maxHp,s.hp+5);s.atk++;toast(`${s.name} grew to level ${s.level}!`);}render();}
function play(){const s=selectedSlime();s.mood=Math.min(100,s.mood+9);s.energy=Math.max(15,s.energy-7);s.xp+=3;toast(`${s.name} did a happy wiggle! +3 XP`);render();}
function craft(){if(state.recipe.length!==2){toast('Choose two ingredients first.');return;}if(state.glow<45||state.dew<3){toast('You need 45 glow and 3 dew to craft.');return;}state.glow-=45;state.dew-=3;const a=ingredients[state.recipe[0]],b=ingredients[state.recipe[1]];const avg=new THREE.Color(a.color).lerp(new THREE.Color(b.color),.5);const color='#'+avg.getHexString();const chosen=ingredients[state.recipe[Math.floor(Math.random()*2)]];const name=chosen.kind==='Mossling'?'Fern':chosen.kind==='Dewdrop'?'Bloop':chosen.kind==='Cinder'?'Cinder':chosen.kind==='Starlit'?'Nova':'Button';const slime={id:Date.now(),name,kind:chosen.kind,color,element:chosen.element,rarity:'COMMON',hp:chosen.hp,maxHp:chosen.hp,atk:chosen.atk,level:1,xp:0,mood:76,energy:100};state.slimes.push(slime);state.selected=state.slimes.length-1;toast(`${name} the ${chosen.kind} joined your family!`);render();}
function startBattle(){if(state.battle){toast('Finish your current journey first.');return;}const z=zones[state.zone];state.battle={zone:state.zone,enemyHp:z.hp,round:1,message:`A ${z.foe} popped out!`,won:false};render();}
function enemyTurn(message){const s=selectedSlime();const hit=3+Math.floor(Math.random()*5);s.hp=Math.max(0,s.hp-hit);state.battle.round++;state.battle.message=`${message} The ${zones[state.battle.zone].foe} booped back for ${hit}!`;if(s.hp===0){s.hp=Math.ceil(s.maxHp*.55);state.battle.message=`${s.name} needs a little rest. They came home safely.`;state.battle.enemyHp=zones[state.battle.zone].hp;state.battle.won=false;setTimeout(()=>{if(state.battle){state.battle=null;render();toast(`${s.name} is resting at home.`);}},1200);}}
function attack(power=0){const b=state.battle;if(!b||b.enemyHp<=0)return;const s=selectedSlime();b.enemyHp=Math.max(0,b.enemyHp-s.atk-power);s.hp=Math.max(1,s.hp);s.xp+=6+power;if(b.enemyHp<=0){b.message=`${s.name} won the little scuffle!`;b.won=true;}else enemyTurn(`${s.name} gave a ${power?'sparkly':'gentle'} boop!`);render();}
function claimReward(){const b=state.battle;if(!b)return;const z=zones[b.zone];const s=selectedSlime();state.glow+=z.reward;state.dew+=z.dew;state.wins++;s.hp=Math.min(s.maxHp,s.hp+10);s.energy=Math.min(100,s.energy+8);if(s.xp>=50){s.xp-=50;s.level++;s.maxHp+=5;s.hp=s.maxHp;s.atk++;}state.battle=null;state.day++;toast(`Journey complete! +${z.reward} glow, +${z.dew} dew`);render();}
function profile(){showModal('Your little world',`<p class="modal-copy">A cozy corner of the wild, just for you and your friends.</p><div class="profile-stat"><span>Adventures finished</span><b>${state.wins}</b></div><div class="profile-stat"><span>Slimes in your family</span><b>${state.slimes.length}</b></div><div class="profile-stat"><span>Day in the glade</span><b>${String(state.day).padStart(2,'0')}</b></div><div class="profile-stat"><span>Saved on this device</span><b>Just now ✓</b></div>`,`<button class="button button-secondary" data-action="close-modal">Lovely</button>`);}

class HabitatScene{
 constructor(canvas,slime){
  this.canvas=canvas;this.dead=false;this.clock=new THREE.Clock();this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#3c5861');this.scene.fog=new THREE.Fog('#3c5861',11,25);
  this.camera=new THREE.PerspectiveCamera(33,1,.1,80);this.camera.position.set(0,5.3,10.6);this.camera.lookAt(0,1.15,0);
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.scene.add(new THREE.HemisphereLight('#e4f8e7','#385153',2.05));const sun=new THREE.DirectionalLight('#fff0c8',3.3);sun.position.set(-4,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-5;this.scene.add(sun);
  this.makeWorld();this.slime=this.makeSlime(slime,0,0);this.companion=null;
  if(state.slimes.length>1){this.companion=this.makeSlime(state.slimes[(state.selected+1)%state.slimes.length],-1.6,.18);this.companion.scale.setScalar(.52);this.companion.position.set(-1.72,.05,.22);}
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();canvas.addEventListener('pointerdown',this.onTap=()=>{this.hopAt=performance.now()/1000;});this.animate();
 }
 mat(color,roughness=.82){return new THREE.MeshStandardMaterial({color,roughness});}
 makeWorld(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),this.mat('#567d70'));ground.rotation.x=-Math.PI/2;ground.position.y=-.45;ground.receiveShadow=true;this.scene.add(ground);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.55,.42,64),this.mat('#567859'));platform.position.set(0,-.17,0);platform.receiveShadow=true;platform.castShadow=true;this.scene.add(platform);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(3.22,.11,10,64),this.mat('#a2c78a'));lip.rotation.x=Math.PI/2;lip.position.y=.04;this.scene.add(lip);
  const top=new THREE.Mesh(new THREE.CircleGeometry(3.22,64),this.mat('#76986d'));top.rotation.x=-Math.PI/2;top.position.y=.045;top.receiveShadow=true;this.scene.add(top);
  // soft moss patches
  for(let i=0;i<18;i++){let a=i*2.4,r=1.5+(i%5)*.23;const patch=new THREE.Mesh(new THREE.CircleGeometry(.15+(i%3)*.07,16),this.mat(i%2?'#86a879':'#678d6c'));patch.rotation.x=-Math.PI/2;patch.position.set(Math.cos(a)*r,.052,Math.sin(a)*r);patch.scale.set(1.7,.75,1);this.scene.add(patch);}
  const trunkMat=this.mat('#795e54'),leafMats=['#466f66','#58816c','#719773'];
  const tree=(x,z,h,sc=1)=>{const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13*sc,.21*sc,h,9),trunkMat);trunk.position.set(x,h/2-.38,z);trunk.castShadow=true;this.scene.add(trunk);for(let j=0;j<3;j++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry((.63-j*.11)*sc,1),this.mat(leafMats[(j+1)%3]));crown.position.set(x+(j-1)*.19*sc,h*.68+j*.33,z);crown.scale.set(1,1.05,1);crown.castShadow=true;this.scene.add(crown);}};
  tree(-3.3,-1,3.1,1.1);tree(3.3,-1.5,2.7,.92);tree(-2.8,2.2,2.1,.75);tree(3.8,1.6,2.2,.7);
  // glowing mushrooms and tiny flowers around the clearing
  for(let i=0;i<10;i++){let a=i*2.4,r=2.3+(i%3)*.22,x=Math.cos(a)*r,z=Math.sin(a)*r;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.22,8),this.mat('#e2d3ae'));stem.position.set(x,.17,z);this.scene.add(stem);const cap=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshStandardMaterial({color:i%2?'#edb08b':'#e6ce86',roughness:.5,emissive:i%2?'#8f4324':'#80681e',emissiveIntensity:.3}));cap.scale.y=.48;cap.position.set(x,.31,z);this.scene.add(cap);}
  for(let i=0;i<28;i++){const g=new THREE.SphereGeometry(.025+(i%3)*.012,8,6);const m=new THREE.MeshBasicMaterial({color:i%2?'#e7e9ae':'#b0e8d0',transparent:true,opacity:.65});const p=new THREE.Mesh(g,m);p.position.set((Math.random()-.5)*8,Math.random()*3,(Math.random()-.5)*7);p.userData.phase=Math.random()*6.28;p.userData.baseY=p.position.y;this.scene.add(p);(this.motes||=[]).push(p);}
 }
 makeSlime(data,x,z){
  const group=new THREE.Group();group.position.set(x,0,z);this.scene.add(group);const color=new THREE.Color(data.color);const bodyGeo=new THREE.SphereGeometry(.77,40,32);const bodyMat=new THREE.MeshPhysicalMaterial({color,roughness:.24,metalness:.02,clearcoat:.9,clearcoatRoughness:.14,emissive:color,emissiveIntensity:.07});const body=new THREE.Mesh(bodyGeo,bodyMat);body.scale.set(1,.83,.88);body.position.y=.67;body.castShadow=true;body.receiveShadow=true;group.add(body);group.userData.body=body;group.userData.geo=bodyGeo;group.userData.original=Float32Array.from(bodyGeo.attributes.position.array);
  const shine=new THREE.Mesh(new THREE.SphereGeometry(.14,14,10),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.62}));shine.scale.set(.7,1.35,.35);shine.position.set(-.31,1.05,.56);group.add(shine);
  const eyeMat=new THREE.MeshStandardMaterial({color:'#26414c',roughness:.3});for(const ex of [-.22,.22]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),eyeMat);eye.position.set(ex,.7,.66);eye.scale.set(.78,1.2,.5);group.add(eye);const glint=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),new THREE.MeshBasicMaterial({color:'white'}));glint.position.set(ex-.012,.72,.69);group.add(glint);}
  const smile=new THREE.Mesh(new THREE.TorusGeometry(.09,.013,6,16,Math.PI),new THREE.MeshStandardMaterial({color:'#34525a'}));smile.position.set(0,.54,.67);smile.rotation.z=Math.PI;group.add(smile);
  // Tiny leaf tuft makes the companion easy to read at a glance.
  const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshStandardMaterial({color:'#c7efaa',roughness:.5}));leaf.scale.set(.5,1.1,.27);leaf.position.set(.03,1.35,0);leaf.rotation.z=-.42;group.add(leaf);
  group.userData.phase=Math.random()*6.28;group.userData.data=data;return group;
 }
 resize(){if(this.dead)return;const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 animate=()=>{if(this.dead)return;this.raf=requestAnimationFrame(this.animate);const t=this.clock.getElapsedTime();const body=this.slime.userData.body,attr=this.slime.userData.geo.attributes.position,orig=this.slime.userData.original;for(let i=0;i<attr.count;i++){const x=orig[i*3],y=orig[i*3+1],z=orig[i*3+2];const wobble=1+.035*Math.sin(t*2.3+y*3+this.slime.userData.phase)+.018*Math.cos(t*1.6+x*4);attr.setXYZ(i,x*wobble,y*wobble,z*wobble);}attr.needsUpdate=true;this.slime.userData.geo.computeVertexNormals();const jump=this.hopAt&&t-this.hopAt<.6?Math.sin((t-this.hopAt)/.6*Math.PI)*.65:0;this.slime.position.y=jump;this.slime.scale.y=1+.035*Math.sin(t*2.3+this.slime.userData.phase);if(this.companion){this.companion.position.y=.03+Math.sin(t*1.7+1)*.06;}for(const m of this.motes){m.position.y=m.userData.baseY+Math.sin(t*1.2+m.userData.phase)*.18;}this.renderer.render(this.scene,this.camera);};
 dispose(){this.dead=true;cancelAnimationFrame(this.raf);this.resizeObserver?.disconnect();this.canvas.removeEventListener('pointerdown',this.onTap);this.renderer.dispose();}
}

document.addEventListener('click',event=>{
 const viewButton=event.target.closest('[data-view]');if(viewButton){go(viewButton.dataset.view);return;}
 const button=event.target.closest('[data-action]');if(!button)return;
 const action=button.dataset.action;
 if(action==='feed')treat();
 else if(action==='play')play();
 else if(action==='select'){state.selected=Number(button.dataset.index);render();}
 else if(action==='ingredient'){
  const id=button.dataset.id;const at=state.recipe.indexOf(id);
  if(at>=0)state.recipe.splice(at,1);else if(state.recipe.length<2)state.recipe.push(id);else {state.recipe.shift();state.recipe.push(id);}
  render();
 }
 else if(action==='craft')craft();
 else if(action==='zone'){state.zone=Number(button.dataset.index);render();}
 else if(action==='begin-adventure')startBattle();
 else if(action==='attack')attack();
 else if(action==='special'){if(state.dew>=2){state.dew-=2;attack(8);}else toast('You need 2 dew for a spark.');}
 else if(action==='claim-reward')claimReward();
 else if(action==='leave-battle'){state.battle=null;render();toast('Back home safe and sound.');}
 else if(action==='close-modal'||(action==='backdrop'&&event.target===button))closeModal();
});
$('#profile-button').addEventListener('click',profile);
updateResources();render();


