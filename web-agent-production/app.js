let WebContainer = null;
let fflate = null;
async function loadWebContainer(){
  if(WebContainer) return WebContainer;
  const mod = await import('https://esm.sh/@webcontainer/api');
  WebContainer = mod.WebContainer;
  return WebContainer;
}
async function loadFflate(){
  if(fflate) return fflate;
  fflate = await import('https://esm.sh/fflate');
  return fflate;
}

const $ = (id) => document.getElementById(id);
const els = {
  runtimeBadge:$('runtimeBadge'),workspaceBadge:$('workspaceBadge'),fileTree:$('fileTree'),workspaceInfo:$('workspaceInfo'),editor:$('editor'),currentFile:$('currentFile'),diffPanel:$('diffPanel'),diffCount:$('diffCount'),chatLog:$('chatLog'),activityLog:$('activityLog'),prompt:$('prompt'),runAgentBtn:$('runAgentBtn'),stopAgentBtn:$('stopAgentBtn'),stepCounter:$('stepCounter'),providerSummary:$('providerSummary'),settingsDialog:$('settingsDialog'),modelStatus:$('modelStatus'),loadModelsBtn:$('loadModelsBtn'),model:$('model'),confirmDialog:$('confirmDialog'),confirmTitle:$('confirmTitle'),confirmBody:$('confirmBody'),confirmYes:$('confirmYes'),confirmNo:$('confirmNo'),provider:$('provider'),apiUrl:$('apiUrl'),model:$('model'),apiKey:$('apiKey'),maxSteps:$('maxSteps'),thinkingMode:$('thinkingMode'),showReasoning:$('showReasoning'),language:$('language'),skillInput:$('skillInput'),skillsList:$('skillsList')
};

const DIRECT_API_ONLY = true;
const SETTINGS_KEY='web-agent.settings.v5.local-only'; // API keys live only in browser localStorage; AI/model requests go directly from this browser to the provider.
const providers={
  openai:{name:'OpenAI',type:'openai',chat:'https://api.openai.com/v1/chat/completions',models:'https://api.openai.com/v1/models',model:'gpt-4.1-mini',reasoning:true},
  anthropic:{name:'Anthropic Claude',type:'anthropic',chat:'https://api.anthropic.com/v1/messages',models:'https://api.anthropic.com/v1/models',model:'claude-sonnet-4-5',reasoning:true},
  gemini:{name:'Google Gemini',type:'gemini',chat:'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',models:'https://generativelanguage.googleapis.com/v1beta/models',model:'gemini-2.5-flash',reasoning:true},
  openrouter:{name:'OpenRouter',type:'openai',chat:'https://openrouter.ai/api/v1/chat/completions',models:'https://openrouter.ai/api/v1/models',model:'openai/gpt-4.1-mini',reasoning:true},
  deepseek:{name:'DeepSeek',type:'openai',chat:'https://api.deepseek.com/chat/completions',models:'https://api.deepseek.com/models',model:'deepseek-chat',reasoning:true},
  qwen:{name:'Qwen / DashScope',type:'openai',chat:'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',models:'https://dashscope.aliyuncs.com/compatible-mode/v1/models',model:'qwen-plus',reasoning:true},
  moonshot:{name:'Moonshot / Kimi',type:'openai',chat:'https://api.moonshot.cn/v1/chat/completions',models:'https://api.moonshot.cn/v1/models',model:'kimi-k2.5',reasoning:true},
  zhipu:{name:'Zhipu AI / GLM',type:'openai',chat:'https://open.bigmodel.cn/api/paas/v4/chat/completions',models:'https://open.bigmodel.cn/api/paas/v4/models',model:'glm-4.5',reasoning:true},
  minimax:{name:'MiniMax',type:'openai',chat:'https://api.minimaxi.chat/v1/chat/completions',models:'https://api.minimaxi.chat/v1/models',model:'MiniMax-M1',reasoning:true},
  volcengine:{name:'Volcengine / Doubao Ark',type:'openai',chat:'https://ark.cn-beijing.volces.com/api/v3/chat/completions',models:'https://ark.cn-beijing.volces.com/api/v3/models',model:'doubao-seed-1-6-flash-250615',reasoning:true},
  baichuan:{name:'Baichuan',type:'openai',chat:'https://api.baichuan-ai.com/v1/chat/completions',models:'https://api.baichuan-ai.com/v1/models',model:'Baichuan4-Air',reasoning:false},
  siliconflow:{name:'SiliconFlow',type:'openai',chat:'https://api.siliconflow.cn/v1/chat/completions',models:'https://api.siliconflow.cn/v1/models',model:'Qwen/Qwen3-32B',reasoning:true},
  nvidia:{name:'NVIDIA NIM',type:'openai',chat:'https://integrate.api.nvidia.com/v1/chat/completions',models:'https://integrate.api.nvidia.com/v1/models',model:'openai/gpt-oss-20b',reasoning:true,browserDirectWarning:true,fallback:['openai/gpt-oss-20b','openai/gpt-oss-120b','qwen/qwen3-coder-480b-a35b-instruct','qwen/qwen2.5-coder-32b-instruct','qwen/qwq-32b','stepfun-ai/step-3-5-flash']},
  mistral:{name:'Mistral',type:'openai',chat:'https://api.mistral.ai/v1/chat/completions',models:'https://api.mistral.ai/v1/models',model:'mistral-large-latest',reasoning:true},
  xai:{name:'xAI / Grok',type:'openai',chat:'https://api.x.ai/v1/chat/completions',models:'https://api.x.ai/v1/models',model:'grok-4',reasoning:true},
  groq:{name:'Groq',type:'openai',chat:'https://api.groq.com/openai/v1/chat/completions',models:'https://api.groq.com/openai/v1/models',model:'llama-3.3-70b-versatile',reasoning:true},
  together:{name:'Together AI',type:'openai',chat:'https://api.together.xyz/v1/chat/completions',models:'https://api.together.xyz/v1/models',model:'Qwen/Qwen3-Coder-480B-A35B-Instruct',reasoning:true},
  fireworks:{name:'Fireworks AI',type:'openai',chat:'https://api.fireworks.ai/inference/v1/chat/completions',models:'https://api.fireworks.ai/inference/v1/models',model:'accounts/fireworks/models/llama-v3p3-70b-instruct',reasoning:true},
  cerebras:{name:'Cerebras',type:'openai',chat:'https://api.cerebras.ai/v1/chat/completions',models:'https://api.cerebras.ai/v1/models',model:'llama-3.3-70b',reasoning:true},
  sambanova:{name:'SambaNova',type:'openai',chat:'https://api.sambanova.ai/v1/chat/completions',models:'https://api.sambanova.ai/v1/models',model:'Meta-Llama-3.3-70B-Instruct',reasoning:true},
  perplexity:{name:'Perplexity',type:'openai',chat:'https://api.perplexity.ai/chat/completions',models:'https://api.perplexity.ai/models',model:'sonar-pro',reasoning:true},
  cohere:{name:'Cohere',type:'cohere',chat:'https://api.cohere.com/v2/chat',models:'https://api.cohere.com/v1/models',model:'command-a-03-2025',reasoning:true},
  custom:{name:'Custom OpenAI Compatible',type:'openai',chat:'https://YOUR-ENDPOINT/v1/chat/completions',models:'',model:'your-model',reasoning:true}
};
const defaults={provider:'openai',apiUrl:providers.openai.chat,model:providers.openai.model,apiKey:'',maxSteps:30,thinkingMode:'auto',showReasoning:false,language:'zh-CN',skills:[]};
let settings={...defaults,...loadJson('local-agent.settings.v3'),...loadJson(SETTINGS_KEY)};
settings.skills=Array.isArray(settings.skills)?settings.skills:[];
let workspaceOpen=false;
let workspace={mode:null,name:'',rootHandle:null,files:new Map(),modified:new Map(),deleted:new Set(),renamed:new Map(),createdDirs:new Set(),deletedDirs:new Set(),container:null,containerReady:false};
let currentPath=null; let originalCurrent=''; let agentRunning=false; let abortAgent=false; let pendingConfirm=null; let objectUrls=[];
let chatAttachments=[];

function loadJson(k){try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}}
function saveJson(k,v){localStorage.setItem(k,JSON.stringify(v));}
function storageMode(){return 'localStorage-only';}

const I18N={
  'zh-CN':{workspace:'WORKSPACE',refresh:'刷新',chooseFolder:'选择本地文件夹',importProject:'导入 ZIP / 文件夹',workspaceHint:'桌面 Chromium 可直接授权本地目录；其他浏览器可导入项目到浏览器沙箱。',files:'FILES',new:'+ 新建',model:'MODEL',configure:'配置',agent:'WEB AGENT',stop:'停止',enterHint:'Enter 发送 · Shift+Enter 换行',send:'发送',save:'保存',applyAll:'应用全部修改',exportZip:'导出 ZIP',editorPlaceholder:'选择文件后开始编辑…',promptPlaceholder:'告诉 Web Agent 你想完成什么。回车发送，Shift+Enter 换行。',settings:'设置',provider:'供应商',apiUrl:'API URL',apiKey:'API Key',modelSelect:'模型',loadModels:'读取模型',thinkingStrength:'思考强度',reasoningSummary:'显示模型推理摘要（仅展示供应商公开返回的摘要，不展示隐藏思维链）',language:'语言',processingChanges:'正在处理修改…',maxSteps:'最大 Agent 步数',apiKeyRequired:'请先填写 API Key。',loadingModels:'读取模型中…',loadedModels:'已读取模型：',emptyModels:'供应商返回了空模型列表。',loadFailed:'读取失败',loadModelsFailed:'读取模型失败：',skills:'SKILLS',loadSkill:'装载 Skill',skillHint:'上传 Markdown / TXT / JSON Skill。激活后的 Skill 会作为 Agent 的额外工作规范。',securityNotice:'API Key 仅保存在当前浏览器 localStorage；AI 与模型请求均由浏览器直接发送到所选供应商，不经过本项目服务器。',madeBy:'由老鼠人开发',nvidiaNotice:'NVIDIA NIM 提示：该接口为浏览器纯前端直连。若出现 Failed to fetch，通常是供应商 CORS/浏览器跨域限制；401/403/404/429 等则分别代表认证、权限、地址/模型或限流问题。本项目不会通过服务器代理。',cancel:'取消',saveSettings:'保存设置',testApi:'测试 API',confirm:'确认操作',reject:'拒绝',allow:'允许',auto:'自动',none:'关闭',minimal:'最低',low:'低',medium:'中',high:'高',xhigh:'极高'},
  'en-US':{workspace:'WORKSPACE',refresh:'Refresh',chooseFolder:'Choose local folder',importProject:'Import ZIP / folder',workspaceHint:'Desktop Chromium can authorize a local folder; other browsers can import a project into the browser sandbox.',files:'FILES',new:'+ New',model:'MODEL',configure:'Configure',agent:'WEB AGENT',stop:'Stop',enterHint:'Enter to send · Shift+Enter for newline',send:'Send',save:'Save',applyAll:'Apply all',exportZip:'Export ZIP',editorPlaceholder:'Select a file to edit…',promptPlaceholder:'Tell Web Agent what you want to do. Enter to send, Shift+Enter for a newline.',settings:'Settings',provider:'Provider',apiUrl:'API URL',apiKey:'API Key',modelSelect:'Model',loadModels:'Load models',thinkingStrength:'Reasoning strength',reasoningSummary:'Show model reasoning summary when publicly provided (never hidden chain-of-thought)',language:'Language',processingChanges:'Processing changes…',maxSteps:'Max Agent steps',apiKeyRequired:'Enter an API key first.',loadingModels:'Loading models…',loadedModels:'Models loaded:',emptyModels:'The provider returned an empty model list.',loadFailed:'Load failed',loadModelsFailed:'Failed to load models:',skills:'SKILLS',loadSkill:'Load Skill',skillHint:'Upload Markdown / TXT / JSON skills. Active skills become additional Agent instructions.',securityNotice:'API keys stay in this browser localStorage; AI and model-list requests are sent directly from the browser to the selected provider and do not pass through this app server.',madeBy:'Developed by 老鼠人',nvidiaNotice:'NVIDIA NIM note: this is browser-direct only. “Failed to fetch” usually means provider CORS/browser cross-origin blocking; 401/403/404/429 indicate auth, permission, endpoint/model, or rate-limit errors. This app does not proxy through a server.',cancel:'Cancel',saveSettings:'Save settings',testApi:'Test API',confirm:'Confirm action',reject:'Reject',allow:'Allow',auto:'Auto',none:'Off',minimal:'Minimal',low:'Low',medium:'Medium',high:'High',xhigh:'XHigh'}
};
function t(key){return I18N[settings.language||'zh-CN']?.[key]||I18N['zh-CN'][key]||key;}
function applyLanguage(){document.documentElement.lang=settings.language||'zh-CN';document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(key)el.textContent=t(key)});document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const key=el.dataset.i18nPlaceholder;if(key)el.placeholder=t(key)});if(els.thinkingMode){const labels={auto:'auto',none:'none',minimal:'minimal',low:'low',medium:'medium',high:'high',xhigh:'xhigh'};for(const opt of els.thinkingMode.options){const key=labels[opt.value];if(key)opt.textContent=t(key)}}const b=document.getElementById('themeBtn');if(b)b.title=settings.language==='en-US'?'Toggle light/dark theme':'切换黑白主题';renderSkills();updateProviderNotice(settings.provider);}
function persistSettings(){saveJson(SETTINGS_KEY,settings);}
function skillId(name,content){return `${name}:${content.length}:${content.slice(0,20)}`;}
function renderSkills(){if(!els.skillsList)return;els.skillsList.innerHTML='';if(!settings.skills.length){els.skillsList.innerHTML=`<div class="small muted-text">${settings.language==='en-US'?'No skills loaded.':'尚未装载 Skill。'}</div>`;return;}for(const skill of settings.skills){const row=document.createElement('div');row.className='skill-card';const cb=document.createElement('input');cb.type='checkbox';cb.checked=skill.active!==false;cb.onchange=()=>{skill.active=cb.checked;persistSettings()};const mid=document.createElement('div');mid.innerHTML=`<div class="name">${esc(skill.name)}</div><div class="meta">${skill.content.length} chars</div>`;const del=document.createElement('button');del.type='button';del.textContent='×';del.title=settings.language==='en-US'?'Remove skill':'移除 Skill';del.onclick=()=>{settings.skills=settings.skills.filter(x=>x.id!==skill.id);persistSettings();renderSkills()};row.append(cb,mid,del);els.skillsList.appendChild(row);}}
function activeSkillsText(){return settings.skills.filter(s=>s.active!==false).map(s=>`### Skill: ${s.name}\n${s.content}`).join('\n\n');}
async function loadSkills(files){for(const file of files||[]){const raw=await file.text();let content=raw;let name=file.name;try{if(file.name.toLowerCase().endsWith('.json')){const obj=JSON.parse(raw);name=obj.name||file.name;content=obj.instructions||obj.content||raw;}}catch{}content=String(content).slice(0,30000);const id=skillId(name,content);if(!settings.skills.some(s=>s.id===id))settings.skills.push({id,name,content,active:true});}persistSettings();renderSkills();}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function addMsg(who,text){const d=document.createElement('div');d.className='msg '+who;const label=who==='user'?(settings.language==='en-US'?'You':'用户'):(settings.language==='en-US'?'Web Agent':'AI');d.innerHTML=`<div class="who">${label}</div><div class="bubble">${esc(text)}</div>`;els.chatLog.appendChild(d);els.chatLog.scrollTop=els.chatLog.scrollHeight}
function activity(name,detail,status='running'){const d=document.createElement('div');d.className='activity '+status;d.innerHTML=`<div class="status"></div><div><div class="name">${esc(name)}</div><div class="detail">${esc(detail||'')}</div></div><div class="detail">${new Date().toLocaleTimeString()}</div>`;els.activityLog.appendChild(d);els.activityLog.scrollTop=els.activityLog.scrollHeight;return {done(detail2){d.classList.remove('running');d.classList.add('done');if(detail2)d.querySelector('.detail').textContent=detail2},error(detail2){d.classList.remove('running');d.classList.add('error');if(detail2)d.querySelector('.detail').textContent=detail2}}}
function setRuntime(text,kind='muted'){els.runtimeBadge.textContent=text;els.runtimeBadge.className='badge '+kind}

function setModelOptions(models,selected=''){const uniq=[...new Set((models||[]).map(x=>typeof x==='string'?x:(x.id||x.name)).filter(Boolean))].sort();els.model.innerHTML='';for(const m of uniq){const o=document.createElement('option');o.value=m;o.textContent=m;els.model.appendChild(o)}if(selected&&!uniq.includes(selected)){const o=document.createElement('option');o.value=selected;o.textContent=selected;els.model.appendChild(o)}if(selected)els.model.value=selected;}
function providerFields(){const p=els.provider.value;const c=providers[p]||providers.custom;els.apiUrl.value=c.chat;setModelOptions([c.model,...(c.fallback||[])],c.model);els.modelStatus.textContent=c.models?'':'自定义供应商请填写模型';updateProviderNotice(p);}
function updateProviderNotice(provider){const el=document.getElementById('providerNotice');if(!el)return;const isNvidia=provider==='nvidia';el.hidden=!isNvidia;if(isNvidia)el.textContent=t('nvidiaNotice');}
function openSettings(){els.provider.value=settings.provider;els.apiUrl.value=settings.apiUrl;setModelOptions([settings.model,...((providers[settings.provider]||{}).fallback||[])],settings.model);els.apiKey.value=settings.apiKey;els.maxSteps.value=settings.maxSteps;els.thinkingMode.value=settings.thinkingMode||'auto';els.showReasoning.checked=!!settings.showReasoning;els.language.value=settings.language||'zh-CN';els.modelStatus.textContent=settings.language==='en-US'?'Load models to choose from the provider':'读取后可选择此供应商可用模型';applyLanguage();renderSkills();updateProviderNotice(settings.provider);els.settingsDialog.showModal()}
$('settingsBtn').onclick=openSettings;$('settingsBtn2').onclick=openSettings;
async function loadModels(){const provider=els.provider.value,key=els.apiKey.value.trim(),api=els.apiUrl.value.trim(),cfg=providers[provider]||providers.custom;if(!key){alert(t('apiKeyRequired'));return;}els.loadModelsBtn.disabled=true;els.modelStatus.textContent=t('loadingModels');try{const models=await fetchProviderModels(provider,api,key);if(!models.length)throw new Error(t('emptyModels'));setModelOptions(models,els.model.value||cfg.model);els.modelStatus.textContent=`${t('loadedModels')} ${models.length}`;}catch(e){const fallback=cfg.fallback||[cfg.model].filter(Boolean);if(fallback.length){setModelOptions(fallback,els.model.value||fallback[0]);els.modelStatus.textContent=(settings.language==='en-US'?'Provider model endpoint unavailable; loaded compatible fallback list.':'模型接口不可用，已载入兼容模型列表。')+` (${e.message})`;return;}els.modelStatus.textContent=t('loadFailed');alert(t('loadModelsFailed')+'\n'+e.message)}finally{els.loadModelsBtn.disabled=false;}}
function apiBaseFromChatUrl(url){return url.replace(/\/(chat\/completions|messages|chat)(\?.*)?$/,'').replace(/\/$/,'');}
async function fetchProviderModels(provider,api,key){const cfg=providers[provider]||providers.custom;let r,data;
 if(provider==='nvidia') return cfg.fallback||[cfg.model];
 if(provider==='gemini'){const base=api.includes('/models/')?api.split('/models/')[0]:api.replace(/\/$/,'');r=await fetchWithTimeout(`${base}/models?key=${encodeURIComponent(key)}`,{headers:{'Content-Type':'application/json'}});data=await r.json();if(!r.ok)throw new Error(classifyApiError(r.status,JSON.stringify(data),provider));return (data.models||[]).filter(x=>!x.supportedGenerationMethods||x.supportedGenerationMethods.includes('generateContent')).map(x=>String(x.baseModelId||x.name||'').replace(/^models\//,''));}
 if(provider==='anthropic'){r=await fetchWithTimeout(cfg.models||`${apiBaseFromChatUrl(api)}/models`,{headers:{'x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}});data=await r.json();if(!r.ok)throw new Error(classifyApiError(r.status,JSON.stringify(data),provider));return (data.data||[]).map(x=>x.id);}
 if(provider==='cohere'){r=await fetchWithTimeout(cfg.models||`${apiBaseFromChatUrl(api)}/models`,{headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}});data=await r.json();if(!r.ok)throw new Error(classifyApiError(r.status,JSON.stringify(data),provider));return (data.models||data.data||[]).map(x=>x.name||x.id);}
 const url=cfg.models||`${apiBaseFromChatUrl(api)}/models`;if(!url)throw new Error('此供应商没有公开模型列表接口，请直接输入模型名。');r=await fetchWithTimeout(url,{headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json','Accept':'application/json'}});data=await r.json();if(!r.ok)throw new Error(classifyApiError(r.status,JSON.stringify(data),provider));return (data.data||data.models||[]).map(x=>x.id||x.name||x.model).filter(Boolean);}
els.provider.onchange=providerFields;els.loadModelsBtn?.addEventListener('click',loadModels);
els.skillInput?.addEventListener('change',e=>loadSkills(e.target.files));
els.language?.addEventListener('change',()=>{settings.language=els.language.value;applyLanguage()});
els.thinkingMode?.addEventListener('change',()=>{settings.thinkingMode=els.thinkingMode.value});

$('saveSettingsBtn').onclick=(e)=>{settings={...settings,provider:els.provider.value,apiUrl:els.apiUrl.value.trim(),model:els.model.value.trim(),apiKey:els.apiKey.value,maxSteps:Math.max(1,Math.min(100,Number(els.maxSteps.value)||30)),thinkingMode:els.thinkingMode.value,showReasoning:els.showReasoning.checked,language:els.language.value};persistSettings();applyLanguage();updateProviderSummary();};
$('testApiBtn')?.addEventListener('click',async()=>{settings={...settings,provider:els.provider.value,apiUrl:els.apiUrl.value.trim(),model:els.model.value.trim(),apiKey:els.apiKey.value,maxSteps:Math.max(1,Math.min(100,Number(els.maxSteps.value)||30)),thinkingMode:els.thinkingMode.value,showReasoning:els.showReasoning.checked,language:els.language.value};if(settings.provider==='nvidia'&&!settings.model){settings.model='openai/gpt-oss-20b';els.model.value=settings.model;}persistSettings();applyLanguage();const b=$('testApiBtn');b.disabled=true;b.textContent=settings.language==='en-US'?'Testing…':'测试中…';try{const r=await callLLM([{role:'system',content:'Reply with exactly OK.'},{role:'user',content:'ping'}],[]);const text=r?.choices?.[0]?.message?.content||'OK';alert((settings.language==='en-US'?'API connection OK:\n':'API 连接成功：\n')+String(text).slice(0,500))}catch(e){alert((settings.language==='en-US'?'API connection failed:\n':'API 连接失败：\n')+e.message)}finally{b.disabled=false;b.textContent=t('testApi')}});
function updateProviderSummary(){const n=(providers[settings.provider]||{}).name||settings.provider;els.providerSummary.textContent=settings.apiKey?`${n} · ${settings.model}`:'未配置 API'}
updateProviderSummary();

function resetWorkspace(name,mode){workspaceOpen=false;workspace={mode,name,rootHandle:null,files:new Map(),modified:new Map(),deleted:new Set(),renamed:new Map(),createdDirs:new Set(),deletedDirs:new Set(),container:null,containerReady:false};currentPath=null;originalCurrent='';els.currentFile.textContent='未打开文件';els.editor.value='';$('saveBtn').disabled=true;$('saveAllBtn').disabled=true;$('downloadZipBtn').disabled=true;els.workspaceBadge.textContent=name||'Workspace';els.workspaceBadge.className='badge good';renderTree();renderDiff();}

async function openLocalFolder(){
  if(!('showDirectoryPicker' in window)){alert('当前浏览器不支持直接选择本地文件夹，请使用“导入 ZIP / 文件夹”模式。');return;}
  try{
    const h=await window.showDirectoryPicker({mode:'readwrite'});
    resetWorkspace(h.name,'local');
    workspace.rootHandle=h;
    els.workspaceInfo.textContent='真实本地 Workspace：AI 的文件修改需要经过 Diff 确认。';
    await ensureWorkspaceHasSeedFile(h);
    await loadLocalDirectory(h,'');
    workspaceOpen=true;
    renderTree();
  }catch(e){if(e?.name!=='AbortError')addMsg('agent','无法打开文件夹：'+e.message)}
}

async function ensureWorkspaceHasSeedFile(dir){
  let hasAnyEntry=false;
  for await(const _ of dir.entries()){hasAnyEntry=true;break;}
  if(hasAnyEntry)return false;
  const handle=await dir.getFileHandle('empty.md',{create:true});
  const writable=await handle.createWritable();
  const content='# Empty Workspace\n\nThis file was created automatically so the workspace can be initialized.\n';
  await writable.write(content);
  await writable.close();
  workspace.files.set('empty.md',content);
  return true;
}

async function loadLocalDirectory(dir,prefix){for await(const [name,handle] of dir.entries()){const path=prefix?`${prefix}/${name}`:name;if(handle.kind==='directory'){await loadLocalDirectory(handle,path)}else if(isTextFile(name)){try{const f=await handle.getFile();workspace.files.set(path,await f.text())}catch{}}}renderTree();}
function isTextFile(p){const ext=p.toLowerCase().split('.').pop();return !['png','jpg','jpeg','gif','webp','ico','pdf','zip','7z','rar','mp4','mov','mp3','woff','woff2','ttf','otf','exe','dll','bin','dylib','so','a','class','jar'].includes(ext)}

async function openFolderImport(files){
  if(!files?.length)return;const root=(files[0].webkitRelativePath||files[0].name).split('/')[0];resetWorkspace(root,'browser');
  for(const f of files){const path=f.webkitRelativePath||f.name;if(isTextFile(path)){try{workspace.files.set(path.includes('/')?path.slice(root.length+1):path,await f.text())}catch{}}}
  els.workspaceInfo.textContent='浏览器 Sandbox Workspace：修改会保存在当前浏览器环境，并可导出 ZIP。';
  workspaceOpen=true;
  renderTree();
}
async function importZip(file){const {unzipSync,strFromU8}=await loadFflate();const buf=new Uint8Array(await file.arrayBuffer());const entries=unzipSync(buf);resetWorkspace(file.name.replace(/\.zip$/i,''),'browser');for(const [path,data] of Object.entries(entries)){if(path.endsWith('/')||!isTextFile(path))continue;workspace.files.set(path,strFromU8(data))}els.workspaceInfo.textContent='浏览器 Sandbox Workspace：ZIP 已导入。';renderTree();}

async function ensureContainer(){
  if(workspace.containerReady)return true;
  if(!window.crossOriginIsolated){setRuntime('需开启 COOP/COEP','muted');throw new Error('当前站点没有 cross-origin isolation。部署时请启用 Cross-Origin-Opener-Policy: same-origin 与 Cross-Origin-Embedder-Policy: credentialless/require-corp。');}
  const a=activity('启动 Browser Terminal','WebContainer / 浏览器 Node.js 沙箱');
  try{const WC=await loadWebContainer();workspace.container=await WC.boot({coep:'credentialless',workdirName:'workspace'});workspace.containerReady=true;setRuntime('Browser Terminal 已连接','good');a.done('ready');return true}catch(e){a.error(e.message);setRuntime('Runtime 启动失败','muted');throw e}
}
async function syncToContainer(){if(!workspace.containerReady)return;const tree={};for(const [path,content] of workspace.files){if(workspace.deleted.has(path)||[...workspace.deletedDirs].some(d=>stagedPathUnder(d,path)))continue;putTree(tree,path.split('/'),content)}for(const [path,content] of workspace.modified){if(workspace.deleted.has(path)||[...workspace.deletedDirs].some(d=>stagedPathUnder(d,path)))continue;putTree(tree,path.split('/'),content)}await workspace.container.mount(tree);}
function putTree(root,parts,content){let cur=root;parts.forEach((p,i)=>{if(i===parts.length-1)cur[p]={file:{contents:content}};else{cur[p]??={directory:{}};cur=cur[p].directory}})}

function renderTree(){const renamedOld=new Set([...workspace.renamed.keys()]);const visible=[...new Set([...workspace.files.keys(),...workspace.modified.keys(),...workspace.deleted])].filter(p=>!workspace.deleted.has(p)&&![...workspace.deletedDirs].some(d=>stagedPathUnder(d,p))&&!renamedOld.has(p));if(!visible.length){els.fileTree.className='file-tree empty-state';els.fileTree.textContent='还没有打开项目';return}els.fileTree.className='file-tree';els.fileTree.innerHTML='';for(const p of visible.sort()){const d=document.createElement('div');d.className='tree-item '+(p===currentPath?'active ':'')+(workspace.modified.has(p)?'modified':'');d.style.paddingLeft=(10+(p.split('/').length-1)*12)+'px';d.textContent=(p.split('/').length>1?'↳ ':'📄 ')+p.split('/').pop()+(workspace.modified.has(p)?' *':'');d.title=p;d.onclick=()=>openFile(p);els.fileTree.appendChild(d)}}
function readWorkspace(path){if(workspace.modified.has(path))return workspace.modified.get(path);return workspace.files.get(path)}
async function openFile(path){currentPath=path;originalCurrent=readWorkspace(path)||'';els.editor.value=originalCurrent;els.currentFile.textContent=path;$('saveBtn').disabled=false;renderTree()}
els.editor.oninput=()=>{if(currentPath){workspace.modified.set(currentPath,els.editor.value);renderTree();renderDiff();}}

function renderDiff(){
  const dirs=[...workspace.createdDirs].map(path=>({type:'mkdir',path}));
  const deletedDirs=[...workspace.deletedDirs].map(path=>({type:'delete-dir',path}));
  const renames=[...workspace.renamed.entries()].map(([from,to])=>({type:'rename',from,to}));
  const renamedPaths=new Set();
  for(const [from,to] of workspace.renamed){renamedPaths.add(from);renamedPaths.add(to)}
  const edits=[...workspace.modified.entries()].filter(([path])=>!renamedPaths.has(path)).map(([path,next])=>({type:'edit',path,next}));
  const deletes=[...workspace.deleted].filter(path=>!renamedPaths.has(path)).map(path=>({type:'delete',path}));
  const entries=[...dirs,...deletedDirs,...renames,...edits,...deletes];
  els.diffCount.textContent=entries.length;
  if(!entries.length){els.diffPanel.className='diff-panel empty-state';els.diffPanel.textContent='暂无待应用修改';$('saveAllBtn').disabled=true;$('downloadZipBtn').disabled=!workspace.files.size;return}
  els.diffPanel.className='diff-panel';els.diffPanel.innerHTML='';
  for(const item of entries){
    const div=document.createElement('div');div.className='diff-file';
    if(item.type==='mkdir'){div.innerHTML=`<div class=\"diff-file-head\"><span>📁 ${esc(item.path)}</span><button class=\"mini-btn\" data-reject-mkdir=\"${encodeURIComponent(item.path)}\">撤销</button></div><div class=\"diff-body\"><div class=\"diff-add\">+ 新建目录</div></div>`;
    } else if(item.type==='delete-dir'){div.innerHTML=`<div class=\"diff-file-head\"><span>📁 ${esc(item.path)}</span><button class=\"mini-btn\" data-reject-delete-dir=\"${encodeURIComponent(item.path)}\">撤销</button></div><div class=\"diff-body\"><div class=\"diff-del\">− 递归删除整个目录</div></div>`;
    } else if(item.type==='rename'){
      const content=workspace.modified.get(item.to) ?? workspace.files.get(item.from) ?? '';
      const orig=workspace.files.get(item.from) ?? '';
      div.innerHTML=`<div class="diff-file-head"><span>${esc(item.from)} → ${esc(item.to)}</span><button class="mini-btn" data-reject-rename="${encodeURIComponent(item.from)}">撤销</button></div><div class="diff-body"><div class="diff-context">重命名并保留文件内容</div>${orig!==content?simpleDiffHtml(orig,content):''}</div>`;
    } else if(item.type==='delete'){
      div.innerHTML=`<div class="diff-file-head"><span>${esc(item.path)}</span><button class="mini-btn" data-reject-delete="${encodeURIComponent(item.path)}">撤销</button></div><div class="diff-body"><div class="diff-del">− 整个文件将被删除</div></div>`;
    } else {
      const orig=workspace.files.get(item.path);
      div.innerHTML=`<div class="diff-file-head"><span>${esc(item.path)}</span><button class="mini-btn" data-reject="${encodeURIComponent(item.path)}">撤销</button></div><div class="diff-body">${simpleDiffHtml(orig??'',item.next)}</div>`;
    }
    els.diffPanel.appendChild(div);
  }
  els.diffPanel.querySelectorAll('[data-reject-mkdir]').forEach(b=>b.onclick=()=>{workspace.createdDirs.delete(decodeURIComponent(b.dataset.rejectMkdir));renderDiff()});
  els.diffPanel.querySelectorAll('[data-reject-delete-dir]').forEach(b=>b.onclick=()=>{workspace.deletedDirs.delete(decodeURIComponent(b.dataset.rejectDeleteDir));renderDiff();renderTree()});
  els.diffPanel.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>{workspace.modified.delete(decodeURIComponent(b.dataset.reject));renderTree();renderDiff()});
  els.diffPanel.querySelectorAll('[data-reject-delete]').forEach(b=>b.onclick=()=>{workspace.deleted.delete(decodeURIComponent(b.dataset.rejectDelete));renderTree();renderDiff()});
  els.diffPanel.querySelectorAll('[data-reject-rename]').forEach(b=>b.onclick=()=>{
    const from=decodeURIComponent(b.dataset.rejectRename); const to=workspace.renamed.get(from); workspace.renamed.delete(from);
    if(to){const content=workspace.modified.get(to);workspace.modified.delete(to);if(!workspace.files.has(to))workspace.files.delete(to);if(!workspace.deleted.has(from)&&!workspace.files.has(from))workspace.files.set(from,content??'');workspace.deleted.delete(from);}
    renderTree();renderDiff();
  });
  $('saveAllBtn').disabled=false;$('downloadZipBtn').disabled=false;
}
function stagedPathUnder(prefix,p){const q=normalizePath(prefix);return !q||p===q||p.startsWith(q+'/');}
function buildWorkspaceDiffText(){const out=[];for(const [from,to] of workspace.renamed)out.push(`rename ${from} -> ${to}`);for(const d of workspace.createdDirs)out.push(`mkdir ${d}`);for(const d of workspace.deletedDirs)out.push(`delete_directory ${d}`);for(const p of workspace.deleted)out.push(`delete ${p}`);for(const [p,c] of workspace.modified){const orig=workspace.files.get(p);out.push(orig===undefined?`create ${p}`:`diff ${p}\n${simpleDiffText(orig,c)}`)}return out.join('\n');}
function simpleDiffText(a,b){const A=String(a??'').split('\n'),B=String(b??'').split('\n');const out=[];const max=Math.max(A.length,B.length);for(let i=0;i<max;i++){if(A[i]===B[i])continue;if(A[i]!==undefined)out.push(`- ${A[i]}`);if(B[i]!==undefined)out.push(`+ ${B[i]}`);}return out.join('\n');}

function simpleDiffHtml(a,b){const A=a.split('\n'),B=b.split('\n');const out=[];const max=Math.max(A.length,B.length);for(let i=0;i<max;i++){if(A[i]===B[i])out.push(`<div class="diff-context">  ${esc(A[i]??'')}</div>`);else{if(A[i]!==undefined)out.push(`<div class="diff-del">- ${esc(A[i])}</div>`);if(B[i]!==undefined)out.push(`<div class="diff-add">+ ${esc(B[i])}</div>`);}}return out.join('')}

async function writeLocalFile(path,content){const parts=path.split('/');let dir=workspace.rootHandle;for(const p of parts.slice(0,-1)){dir=await dir.getDirectoryHandle(p,{create:true})}const fh=await dir.getFileHandle(parts.at(-1),{create:true});const w=await fh.createWritable();await w.write(content);await w.close();}
async function removeLocalFile(path){const parts=path.split('/');let dir=workspace.rootHandle;for(const p of parts.slice(0,-1)){dir=await dir.getDirectoryHandle(p,{create:false})}await dir.removeEntry(parts.at(-1),{recursive:false});}
async function ensureLocalDir(path){if(workspace.mode!=='local'||!workspace.rootHandle)return;let dir=workspace.rootHandle;for(const part of normalizePath(path).split('/').filter(Boolean))dir=await dir.getDirectoryHandle(part,{create:true});}
async function copyLocalFile(from,to){const content=readWorkspace(from);if(content==null)throw new Error(`File not found: ${from}`);await writeLocalFile(to,content);}
async function removeLocalDir(path){if(workspace.mode!=='local'||!workspace.rootHandle)return;const parts=normalizePath(path).split('/').filter(Boolean);if(!parts.length)return;let dir=workspace.rootHandle;for(const p of parts.slice(0,-1))dir=await dir.getDirectoryHandle(p,{create:false});await dir.removeEntry(parts[-1],{recursive:true});}

function showSaveProgress(total){
  const box=$('saveProgress'),bar=$('saveProgressBar'),text=$('saveProgressText');
  if(!box)return; box.hidden=false; bar.style.width='0%'; text.textContent=`0 / ${total}`;
}
function updateSaveProgress(done,total,label){
  const bar=$('saveProgressBar'),text=$('saveProgressText');
  if(bar)bar.style.width=`${total?Math.round(done/total*100):100}%`;
  if(text)text.textContent=`${done} / ${total}${label?` · ${label}`:''}`;
}
function hideSaveProgress(){const box=$('saveProgress');if(box)box.hidden=true;}

async function applyChanges(){
  const createdDirs=[...workspace.createdDirs];
  const renames=[...workspace.renamed.entries()];
  const deleted=[...workspace.deleted];
  const deletedDirs=[...workspace.deletedDirs].sort((a,b)=>b.length-a.length);
  const modified=[...workspace.modified.entries()];
  const total=createdDirs.length+renames.length+deleted.length+deletedDirs.length+modified.length;
  if(!total)return;
  const saveBtn=$('saveAllBtn');
  saveBtn.disabled=true;
  showSaveProgress(total);
  let done=0;
  const tick=label=>{done++;updateSaveProgress(done,total,label);};
  try{
    for(const d of createdDirs){if(workspace.mode==='local')await ensureLocalDir(d);tick(`${settings.language==='en-US'?'Create directory':'创建目录'}: ${d}`);}
    for(const [from,to] of renames){
      const content=workspace.modified.get(to) ?? workspace.files.get(from) ?? '';
      if(workspace.mode==='local'){await writeLocalFile(to,content);try{await removeLocalFile(from)}catch(e){if(e?.name!=='NotFoundError')throw e}}
      workspace.files.delete(from);workspace.files.set(to,content);workspace.modified.delete(to);workspace.deleted.delete(from);
      if(currentPath===from){currentPath=to;originalCurrent=content;els.currentFile.textContent=to;els.editor.value=content;}
      tick(`${settings.language==='en-US'?'Rename':'重命名'}: ${from} → ${to}`);
    }
    workspace.renamed.clear();
    for(const path of deleted){
      if(workspace.mode==='local'){try{await removeLocalFile(path)}catch(e){if(e?.name!=='NotFoundError')throw e}}
      workspace.files.delete(path);workspace.modified.delete(path);
      if(currentPath===path){currentPath=null;originalCurrent='';els.currentFile.textContent='未打开文件';els.editor.value='';$('saveBtn').disabled=true}
      tick(`${settings.language==='en-US'?'Delete':'删除'}: ${path}`);
    }
    for(const path of deletedDirs){
      if(workspace.mode==='local'){try{await removeLocalDir(path)}catch(e){if(e?.name!=='NotFoundError')throw e}}
      for(const fp of [...workspace.files.keys()])if(stagedPathUnder(path,fp))workspace.files.delete(fp);
      for(const fp of [...workspace.modified.keys()])if(stagedPathUnder(path,fp))workspace.modified.delete(fp);
      tick(`${settings.language==='en-US'?'Delete directory':'删除目录'}: ${path}`);
    }
    for(const [path,content] of modified){
      if(workspace.deleted.has(path)||deletedDirs.some(d=>stagedPathUnder(d,path)))continue;
      if(workspace.mode==='local')await writeLocalFile(path,content);
      workspace.files.set(path,content);
      tick(`${settings.language==='en-US'?'Save':'保存'}: ${path}`);
    }
    workspace.createdDirs.clear();workspace.deletedDirs.clear();workspace.modified.clear();workspace.deleted.clear();
    await syncToContainer();
    if(currentPath&&workspace.files.has(currentPath))await openFile(currentPath);
    renderDiff();renderTree();
    updateSaveProgress(total,total,settings.language==='en-US'?'Done':'处理完成');
    await new Promise(r=>setTimeout(r,220));
    addMsg('agent',settings.language==='en-US'?'Applied all pending changes.':'已应用所有待处理修改。');
  }catch(e){
    updateSaveProgress(done,total,(settings.language==='en-US'?'Failed: ':'失败：')+e.message);
    await new Promise(r=>setTimeout(r,500));
    addMsg('agent',(settings.language==='en-US'?'Apply changes failed: ':'应用修改失败：')+e.message);
    throw e;
  }finally{
    hideSaveProgress();
    renderDiff();renderTree();
  }
}
$('saveBtn').onclick=async()=>{if(currentPath&&workspace.modified.has(currentPath)){if(workspace.mode==='local'){await writeLocalFile(currentPath,workspace.modified.get(currentPath));workspace.files.set(currentPath,workspace.modified.get(currentPath));workspace.modified.delete(currentPath)}else{workspace.files.set(currentPath,workspace.modified.get(currentPath))}await syncToContainer();renderTree();renderDiff();addMsg('agent',`已保存 ${currentPath}`)}};
$('saveAllBtn').onclick=applyChanges;
$('refreshTreeBtn').onclick=async()=>{if(workspace.mode==='local'&&workspace.rootHandle){workspace.files.clear();await loadLocalDirectory(workspace.rootHandle,'');renderDiff()}else renderTree()};
$('openFolderBtn').onclick=openLocalFolder;
$('folderInput').onchange=e=>openFolderImport(e.target.files);
$('zipInput').onchange=e=>importZip(e.target.files?.[0]);
$('importBtn').onclick=()=>{if('showDirectoryPicker' in window) $('folderInput').click(); else $('zipInput').click()};
$('newFileBtn').onclick=async()=>{const p=prompt('新文件路径，例如 src/new.ts');if(!p)return;workspace.files.set(p,'');await openFile(p);workspace.modified.set(p,'');renderTree();renderDiff()};

$('downloadZipBtn').onclick=async()=>{const {zipSync,strToU8}=await loadFflate();const data={};for(const [p,c] of workspace.files){if(!workspace.deleted.has(p)&&![...workspace.renamed.keys()].includes(p))data[p]=strToU8(c)}for(const [p,c] of workspace.modified){if(!workspace.deleted.has(p))data[p]=strToU8(c)}const blob=new Blob([zipSync(data)],{type:'application/zip'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(workspace.name||'workspace')+'-modified.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};

async function searchFiles(pattern,query,maxResults=50){const rx=pattern&&pattern!=='*'?new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*'),'i'):null;const hits=[];for(const [path,content] of workspace.files){if(workspace.deleted.has(path)||[...workspace.deletedDirs].some(d=>stagedPathUnder(d,path)))continue;if(rx&&!rx.test(path))continue;const lines=String(content).split('\n');for(let i=0;i<lines.length;i++){if(String(lines[i]).toLowerCase().includes(String(query).toLowerCase())){hits.push({path,line:i+1,text:lines[i].slice(0,300)});if(hits.length>=maxResults)return hits}}}return hits}

const toolDefs=[
{type:'function',function:{name:'list_files',description:'List workspace files. Use this before read_file when exact paths are uncertain.',parameters:{type:'object',properties:{prefix:{type:'string'},max_results:{type:'number'}},required:[]}}},
{type:'function',function:{name:'read_file',description:'Read a text file from the workspace.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}}},
{type:'function',function:{name:'search_files',description:'Search text across workspace.',parameters:{type:'object',properties:{query:{type:'string'},pattern:{type:'string'},max_results:{type:'number'}},required:['query']}}},
{type:'function',function:{name:'write_file',description:'Stage a complete replacement of an existing file. User approval is required to write it.',parameters:{type:'object',properties:{path:{type:'string'},content:{type:'string'}},required:['path','content']}}},
{type:'function',function:{name:'create_file',description:'Stage creation of a new file.',parameters:{type:'object',properties:{path:{type:'string'},content:{type:'string'}},required:['path','content']}}},
{type:'function',function:{name:'delete_file',description:'Stage deletion of an existing file. User approval is required.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}}},
{type:'function',function:{name:'rename_file',description:'Stage a file rename; preserve content. Use this instead of delete + create.',parameters:{type:'object',properties:{old_path:{type:'string'},new_path:{type:'string'}},required:['old_path','new_path']}}},
{type:'function',function:{name:'copy_file',description:'Stage copying a file to a new path while preserving the source.',parameters:{type:'object',properties:{source_path:{type:'string'},destination_path:{type:'string'}},required:['source_path','destination_path']}}},
{type:'function',function:{name:'move_file',description:'Stage moving a file to a new path. Equivalent to rename while clearly expressing move semantics.',parameters:{type:'object',properties:{source_path:{type:'string'},destination_path:{type:'string'}},required:['source_path','destination_path']}}},
{type:'function',function:{name:'mkdir',description:'Stage creation of a directory.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}}},
{type:'function',function:{name:'delete_directory',description:'Stage recursive deletion of a directory and its contents. User approval is required.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}}},
{type:'function',function:{name:'file_exists',description:'Check whether an exact file or directory path exists in the current workspace.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}}},
{type:'function',function:{name:'get_file_info',description:'Get basic workspace metadata for a file path.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}}},
{type:'function',function:{name:'git_diff',description:'Get git diff for the workspace sandbox when git metadata is available; otherwise return the staged workspace diff.',parameters:{type:'object',properties:{path:{type:'string'},staged:{type:'boolean'}},required:[]}}},
{type:'function',function:{name:'run_command',description:'Run a shell command inside the browser WebContainer sandbox only, never on the user OS.',parameters:{type:'object',properties:{command:{type:'string'},cwd:{type:'string'}},required:['command']}}}
];
const BASE_SYSTEM=`You are a browser coding agent. Operate only on the current workspace. NEVER invent filenames or paths. If you do not know an exact path, call list_files or search_files first. Tool paths must be workspace-relative and match returned paths exactly. write_file/create_file/delete_file/rename_file only stage pending changes; the user must approve Diff before local files are changed. Prefer rename_file or move_file for move/rename requests; use copy_file to preserve the source. mkdir/delete_directory operate on directories and always stage changes for approval. git_diff reads the sandbox git diff when available and otherwise returns the staged workspace diff. run_command executes only inside the browser sandbox, not on the user's operating system.`;
function systemPrompt(){const skills=activeSkillsText();return skills?`${BASE_SYSTEM}\n\nActive skills:\n${skills}`:BASE_SYSTEM;}

function reasoningConfig(){const mode=settings.thinkingMode||'auto';if(mode==='auto')return null;const map={minimal:'minimal',low:'low',medium:'medium',high:'high',xhigh:'xhigh',none:'none'};return map[mode]||null;}
function anthropicBudget(mode){return ({minimal:1024,low:2048,medium:4096,high:8192,xhigh:16384})[mode]||4096;}
function geminiLevel(mode){return mode==='xhigh'?'high':mode; }
function appendPublicReasoningSummary(resp){if(!settings.showReasoning)return resp;try{const m=resp?.choices?.[0]?.message;if(!m)return resp;const summary=m.reasoning_summary||m.reasoningSummary; if(summary){resp._publicReasoningSummary=String(summary).slice(0,4000)}}catch{}return resp;}
async function callLLM(messages,tools){const {provider,apiUrl,model,apiKey}=settings;if(!apiKey)throw new Error('请先在设置中配置 API Key。');if(provider==='anthropic')return callAnthropic(messages,tools);if(provider==='gemini')return callGemini(messages,tools);if(provider==='cohere')return callCohere(messages,tools);return callOpenAICompatible(messages,tools)}
function classifyApiError(status,body,provider=''){const map={400:'请求参数错误（400）',401:'API Key 无效或未授权（401）',403:'供应商拒绝访问（403），可能是权限/账户资格限制',404:'接口地址或模型不存在（404）',408:'请求超时（408）',409:'请求冲突（409）',422:'请求参数无法处理（422）',429:'请求过于频繁或额度受限（429）',500:'供应商服务器错误（500）',502:'供应商网关错误（502）',503:'供应商暂时不可用（503）',504:'供应商网关超时（504）'};const label=map[status]||`HTTP ${status}`;const detail=String(body||'').slice(0,1600);return `${label}${provider==='nvidia'?' · NVIDIA NIM':''}${detail?`\n${detail}`:''}`;}
function friendlyNetworkError(e){return e?.code==='API_CORS_OR_NETWORK'?e.message:`网络/CORS 错误：${e?.message||e}`;}

async function fetchWithTimeout(url,options={},timeoutMs=60000){
  if(DIRECT_API_ONLY){
    let u; try{u=new URL(url,location.href)}catch{throw new Error('API URL 无效。')}
    if(!['http:','https:'].includes(u.protocol)) throw new Error('API URL 必须是 http(s) 地址。');
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{
      ...options,
      signal:controller.signal,
      referrerPolicy:'no-referrer'
    });
  }catch(e){
    if(e?.name==='AbortError') throw new Error(`请求超时（${Math.round(timeoutMs/1000)} 秒）。请检查 API URL、网络、CORS 和模型配置。`);
    const err=new Error(`Failed to fetch / 网络请求失败：${e?.message||e}`); err.code='API_CORS_OR_NETWORK'; throw err;
  }finally{clearTimeout(timer);}
}
async function callOpenAICompatible(messages,tools){const headers={'Content-Type':'application/json','Authorization':`Bearer ${settings.apiKey}`};const reason=reasoningConfig();const body={model:settings.model,messages};if(Array.isArray(tools)&&tools.length){body.tools=tools;body.tool_choice='auto';}if(settings.thinkingMode==='auto')body.temperature=0.2;if(reason){let mapped=reason;if(settings.provider==='nvidia'){mapped=({minimal:'low',low:'low',medium:'medium',high:'high',xhigh:'high',none:'none'})[settings.thinkingMode]||null;}if(mapped)body.reasoning_effort=mapped;else if(settings.provider==='nvidia'&&settings.thinkingMode==='none')body.reasoning_effort='none';}let r=await fetchWithTimeout(settings.apiUrl,{method:'POST',headers,body:JSON.stringify(body)});let text=await r.text();if(!r.ok&&reason){try{const b={...body};delete b.reasoning_effort;r=await fetchWithTimeout(settings.apiUrl,{method:'POST',headers,body:JSON.stringify(b)});text=await r.text()}catch{}}if(!r.ok)throw new Error(classifyApiError(r.status,text,settings.provider));try{return appendPublicReasoningSummary(JSON.parse(text))}catch{throw new Error(`API 返回不是合法 JSON：${text.slice(0,1000)}`)}}
async function callAnthropic(messages,tools){const system=messages.find(m=>m.role==='system')?.content||'';const msgs=messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='tool'?'user':m.role,content:m.role==='tool'?[{type:'tool_result',tool_use_id:m.tool_call_id,content:m.content}]:m.content}));const atools=tools.map(t=>({name:t.function.name,description:t.function.description,input_schema:t.function.parameters}));const reason=reasoningConfig();const base={model:settings.model,max_tokens:reason?Math.max(8192,anthropicBudget(settings.thinkingMode)+4096):4096,system,messages:msgs,tools:atools};if(reason&&settings.thinkingMode!=='none')base.thinking={type:'enabled',budget_tokens:anthropicBudget(settings.thinkingMode)};let r=await fetchWithTimeout(settings.apiUrl,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':settings.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(base)});let raw=await r.text();if(!r.ok&&reason&&settings.thinkingMode!=='none'){const fallback={...base};delete fallback.thinking;r=await fetchWithTimeout(settings.apiUrl,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':settings.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(fallback)});raw=await r.text()}if(!r.ok)throw new Error(classifyApiError(r.status,raw,settings.provider));let x;try{x=JSON.parse(raw)}catch{throw new Error(`API 返回不是合法 JSON：${raw.slice(0,1000)}`)}const text=x.content?.filter(p=>p.type==='text').map(p=>p.text).join('\n')||'';const tool_calls=x.content?.filter(p=>p.type==='tool_use').map(p=>({id:p.id,type:'function',function:{name:p.name,arguments:JSON.stringify(p.input)}}))||[];return {choices:[{message:{role:'assistant',content:text,tool_calls}}]}}

async function callCohere(messages,tools){
  const system=messages.find(m=>m.role==='system')?.content||'';
  const msgs=messages.filter(m=>m.role!=='system').map(m=>{
    if(m.role==='tool') return {role:'tool',tool_call_id:m.tool_call_id,content:JSON.stringify(m.content)};
    return {role:m.role,content:typeof m.content==='string'?m.content:JSON.stringify(m.content)};
  });
  const ctools=tools.map(t=>({type:'function',function:{name:t.function.name,description:t.function.description,parameters:t.function.parameters}}));
  const body={model:settings.model,messages:msgs,tools:ctools,tool_choice:'auto'};
  if(system) body.preamble=system;
  if(settings.thinkingMode==='none') body.temperature=0.2;
  let r=await fetchWithTimeout(settings.apiUrl,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${settings.apiKey}`},body:JSON.stringify(body)});
  const raw=await r.text();
  if(!r.ok)throw new Error(classifyApiError(r.status,raw,settings.provider));
  let x;try{x=JSON.parse(raw)}catch{throw new Error(`API 返回不是合法 JSON：${raw.slice(0,1000)}`)}
  const m=x.message||{};
  const content=typeof m.content==='string'?m.content:(Array.isArray(m.content)?m.content.map(v=>typeof v==='string'?v:v.text||'').join(''):'');
  const calls=(m.tool_calls||m.toolCalls||[]).map((tc,i)=>({id:tc.id||`cohere-${Date.now()}-${i}`,type:'function',function:{name:tc.function?.name||tc.name,arguments:typeof tc.function?.arguments==='string'?tc.function.arguments:JSON.stringify(tc.function?.arguments||tc.arguments||{})}}));
  return {choices:[{message:{role:'assistant',content,tool_calls:calls}}]};
}
async function callGemini(messages,tools){const url=settings.apiUrl.replace('{model}',encodeURIComponent(settings.model))+`?key=${encodeURIComponent(settings.apiKey)}`;const contents=messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:typeof m.content==='string'?m.content:JSON.stringify(m.content)}]}));const fdecl=tools.map(t=>({name:t.function.name,description:t.function.description,parameters:t.function.parameters}));const body={systemInstruction:{parts:[{text:messages.find(m=>m.role==='system')?.content||systemPrompt()}]},contents,tools:[{functionDeclarations:fdecl}]};const reason=reasoningConfig();if(reason&&settings.thinkingMode!=='none'){body.generationConfig={thinkingConfig:{thinkingLevel:geminiLevel(settings.thinkingMode)}};}let r=await fetchWithTimeout(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let raw=await r.text();if(!r.ok&&reason){const fallback={...body};delete fallback.generationConfig;r=await fetchWithTimeout(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fallback)});raw=await r.text()}if(!r.ok)throw new Error(classifyApiError(r.status,raw,settings.provider));let x;try{x=JSON.parse(raw)}catch{throw new Error(`API 返回不是合法 JSON：${raw.slice(0,1000)}`)}const parts=x.candidates?.[0]?.content?.parts||[];const text=parts.filter(p=>p.text&&!p.thought).map(p=>p.text).join('\n');const calls=parts.filter(p=>p.functionCall).map((p,i)=>({id:`gemini-${Date.now()}-${i}`,type:'function',function:{name:p.functionCall.name,arguments:JSON.stringify(p.functionCall.args||{})}}));return {choices:[{message:{role:'assistant',content:text,tool_calls:calls}}]}}

async function listWorkspaceFiles(prefix='', maxResults=200){const pre=normalizePath(prefix);const out=[];for(const path of workspace.files.keys()){if(workspace.deleted.has(path)||[...workspace.deletedDirs].some(d=>stagedPathUnder(d,path))||[...workspace.renamed.keys()].includes(path))continue;if(pre&&!(path===pre||path.startsWith(pre+'/')))continue;out.push(path);if(out.length>=Math.max(1,Math.min(500,Number(maxResults)||200)))break}return {files:out,total:out.length}}
function resolveExistingPath(raw){const p=normalizePath(raw);if(workspace.files.has(p)||workspace.modified.has(p))return p;const lower=p.toLowerCase();const candidates=[...new Set([...workspace.files.keys(),...workspace.modified.keys()])];const exact=candidates.filter(x=>x.toLowerCase()===lower);if(exact.length===1)return exact[0];const base=lower.split('/').pop();const byBase=candidates.filter(x=>x.toLowerCase().split('/').pop()===base);if(byBase.length===1)return byBase[0];return p}
async function executeTool(name,args){
  if(name==='list_files')return await listWorkspaceFiles(args.prefix||'',args.max_results||200);
  if(name==='read_file'){const p=resolveExistingPath(args.path);if(!workspace.files.has(p)&&!workspace.modified.has(p))throw new Error(`File not found: ${normalizePath(args.path)}. Use list_files or search_files.`);return {path:p,content:readWorkspace(p)};}
  if(name==='search_files')return await searchFiles(args.pattern||'*',args.query,args.max_results||50);
  if(name==='write_file'||name==='create_file'){const p=normalizePath(args.path);if(!p)throw new Error('Path is required.');if(name==='create_file'&&(workspace.files.has(p)||workspace.modified.has(p))&&!workspace.deleted.has(p))throw new Error(`File already exists: ${p}`);workspace.modified.set(p,String(args.content??''));workspace.deleted.delete(p);await syncToContainer();renderTree();renderDiff();return {ok:true,path:p,pending:true,message:'Change staged in Diff; user approval is required.'};}
  if(name==='delete_file'){const p=resolveExistingPath(args.path);if(!workspace.files.has(p)&&!workspace.modified.has(p))throw new Error(`File not found: ${normalizePath(args.path)}.`);workspace.deleted.add(p);workspace.modified.delete(p);await syncToContainer();renderTree();renderDiff();return {ok:true,path:p,pending:true};}
  if(name==='rename_file'||name==='move_file'){const from=resolveExistingPath(args.old_path||args.source_path),to=normalizePath(args.new_path||args.destination_path);if(!from||!to)throw new Error('Source and destination are required.');if(!workspace.files.has(from)&&!workspace.modified.has(from))throw new Error(`File not found: ${from}`);if(workspace.files.has(to)&&!workspace.deleted.has(to)&&!workspace.modified.has(to))throw new Error(`Destination already exists: ${to}`);const content=readWorkspace(from);workspace.renamed.set(from,to);workspace.modified.delete(from);workspace.modified.set(to,content);workspace.deleted.add(from);await syncToContainer();renderTree();renderDiff();return {ok:true,from,to,pending:true};}
  if(name==='copy_file'){const from=resolveExistingPath(args.source_path),to=normalizePath(args.destination_path);if(!workspace.files.has(from)&&!workspace.modified.has(from))throw new Error(`File not found: ${from}`);if(workspace.files.has(to)&&!workspace.deleted.has(to))throw new Error(`Destination already exists: ${to}`);workspace.modified.set(to,readWorkspace(from)||'');workspace.deleted.delete(to);await syncToContainer();renderTree();renderDiff();return {ok:true,from,to,pending:true};}
  if(name==='mkdir'){const p=normalizePath(args.path);if(!p)throw new Error('Directory path is required.');workspace.createdDirs.add(p);workspace.deletedDirs.delete(p);renderDiff();return {ok:true,path:p,pending:true};}
  if(name==='delete_directory'){const p=normalizePath(args.path);if(!p)throw new Error('Directory path is required.');const hasFiles=[...workspace.files.keys(),...workspace.modified.keys()].some(x=>stagedPathUnder(p,x));if(!hasFiles && workspace.mode==='local'){// probe existence lazily
      if(workspace.rootHandle){try{let dir=workspace.rootHandle;for(const part of p.split('/'))dir=await dir.getDirectoryHandle(part); }catch{throw new Error(`Directory not found: ${p}`);}}}
    workspace.deletedDirs.add(p);for(const fp of [...workspace.modified.keys()])if(stagedPathUnder(p,fp))workspace.modified.delete(fp);await syncToContainer();renderTree();renderDiff();return {ok:true,path:p,recursive:true,pending:true};}
  if(name==='file_exists'){const p=normalizePath(args.path);const file=workspace.files.has(p)||workspace.modified.has(p);const dir=workspace.createdDirs.has(p)||[...workspace.files.keys()].some(x=>x.startsWith(p+'/'))&&!workspace.deletedDirs.has(p)&&![...workspace.deletedDirs].some(d=>stagedPathUnder(d,p));return {path:p,exists:!!(file||dir),kind:file?'file':dir?'directory':null};}
  if(name==='get_file_info'){const p=resolveExistingPath(args.path);if(!workspace.files.has(p)&&!workspace.modified.has(p))throw new Error(`Path not found: ${normalizePath(args.path)}`);const content=readWorkspace(p)||'';return {path:p,kind:'file',size:new Blob([content]).size,lines:String(content).split('\n').length};}
  if(name==='git_diff'){await ensureContainer();await syncToContainer();try{const r=await runSandboxCommand(`git diff --no-ext-diff ${args.staged?'--cached ':''}-- ${(args.path||'.').replace(/'/g,"'\''")}`);if(r.exitCode===0&&r.output.trim())return {available:true,source:'git',output:r.output};if(r.exitCode!==0)return {available:false,source:'workspace',message:'Git diff unavailable in the browser sandbox; returning staged workspace diff.',output:buildWorkspaceDiffText()};return {available:true,source:'git',output:''};}catch(e){return {available:false,source:'workspace',message:e.message,output:buildWorkspaceDiffText()};}}
  if(name==='run_command')return await runSandboxCommand(args.command,normalizePath(args.cwd||''));
  throw new Error('Unknown tool '+name);
}

async function runSandboxCommand(command,cwd=''){
  if(!command||!String(command).trim())throw new Error('Command is required.');
  await ensureContainer();
  await syncToContainer();
  const proc=await workspace.container.spawn('jsh',['-c',String(command)],{cwd:cwd||'/' ,terminal:{cols:120,rows:30}});
  let output='';
  const reader=proc.output.getReader();
  while(true){const {value,done}=await reader.read();if(done)break;output+=value;if(output.length>12000)output=output.slice(-12000);}
  const exitCode=await proc.exit;
  return {exitCode,command,cwd:cwd||'',output};
}

function normalizePath(p){return String(p||'').replaceAll('\\','/').replace(/^\/+/, '').split('/').filter(x=>x&&x!=='.'&&x!=='..').join('/')}


async function agentLoop(){if(agentRunning)return; if(!workspace.files.size){alert(settings.language==='en-US'?'Open or import a workspace first.':'请先打开或导入一个 Workspace。');return}if(!settings.apiKey){openSettings();return}agentRunning=true;abortAgent=false;els.runAgentBtn.disabled=true;els.stopAgentBtn.disabled=false;els.activityLog.innerHTML='';const max=settings.maxSteps||30;els.stepCounter.textContent=`0 / ${max}`;const userPrompt=els.prompt.value.trim()|| (settings.language==='en-US'?'Inspect this project and suggest improvements.':'检查这个项目并给出改进建议。');els.prompt.value='';addMsg('user',userPrompt);const messages=[{role:'system',content:systemPrompt()},{role:'user',content:userPrompt}];try{for(let step=1;step<=max;step++){if(abortAgent)break;els.stepCounter.textContent=`${step} / ${max}`;const a=activity(settings.language==='en-US'?'Reasoning':'AI 思考',`${settings.language==='en-US'?'Step':'第'} ${step}`);let resp;try{resp=await callLLM(messages,toolDefs);a.done('completed')}catch(e){a.error(e.message);throw e}const m=resp.choices?.[0]?.message;if(!m)throw new Error('模型没有返回 message');messages.push(m);if(m.content)addMsg('agent',m.content);const calls=m.tool_calls||[];if(!calls.length)break;for(const tc of calls){if(abortAgent)break;const name=tc.function.name;let args;try{args=JSON.parse(tc.function.arguments||'{}')}catch{throw new Error(`Invalid tool arguments for ${name}`)}const ac=activity(name,JSON.stringify(args));try{const res=await executeTool(name,args);ac.done(typeof res==='string'?res:JSON.stringify(res).slice(0,500));messages.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify(res)});}catch(e){ac.error(e.message);messages.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify({error:e.message})})}}}if(abortAgent)addMsg('agent',settings.language==='en-US'?'Agent stopped.':'Agent 已停止。');else addMsg('agent',settings.language==='en-US'?'Agent finished. Review the Diff before applying changes.':'Agent 已完成当前任务。请在 Diff 区查看待应用修改。')}catch(e){addMsg('agent',(settings.language==='en-US'?'Agent error: ':'Agent 出错：')+e.message)}finally{agentRunning=false;els.runAgentBtn.disabled=false;els.stopAgentBtn.disabled=true}}
els.runAgentBtn.onclick=agentLoop;els.stopAgentBtn.onclick=()=>abortAgent=true;

function installResizers(){
  const root=document.documentElement;
  document.querySelectorAll('[data-resize]').forEach(el=>{
    el.addEventListener('pointerdown',e=>{
      e.preventDefault(); e.stopPropagation(); el.setPointerCapture?.(e.pointerId);
      const type=el.dataset.resize, sx=e.clientX, sy=e.clientY;
      const left0=parseInt(getComputedStyle(root).getPropertyValue('--left'))||270;
      const right0=parseInt(getComputedStyle(root).getPropertyValue('--right'))||400;
      const diff0=parseInt(getComputedStyle(root).getPropertyValue('--diff'))||250;
      const activity0=parseInt(getComputedStyle(root).getPropertyValue('--activity'))||190;
      document.body.classList.add('resizing', type==='diff'||type==='activity'?'row-resizing':'col-resizing');
      const move=ev=>{
        if(type==='left') root.style.setProperty('--left',Math.max(220,Math.min(520,left0 + ev.clientX-sx))+'px');
        else if(type==='right') root.style.setProperty('--right',Math.max(360,Math.min(680,right0 - ev.clientX+sx))+'px');
        else if(type==='diff') root.style.setProperty('--diff',Math.max(120,Math.min(window.innerHeight-220,diff0 - ev.clientY+sy))+'px');
        else if(type==='activity') root.style.setProperty('--activity',Math.max(90,Math.min(420,activity0 - ev.clientY+sy))+'px');
      };
      const up=()=>{document.body.classList.remove('resizing','col-resizing','row-resizing');window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);};
      window.addEventListener('pointermove',move,{passive:true}); window.addEventListener('pointerup',up,{once:true}); window.addEventListener('pointercancel',up,{once:true});
    });
  });
}
function installTheme(){
  const saved=localStorage.getItem('local-agent.theme')||'dark';
  const setTheme=light=>{
    document.body.classList.toggle('light',light);
    const b=document.getElementById('themeBtn');
    if(b){b.textContent=light?'☀':'☾';b.title=light?'切换到深色主题':'切换到浅色主题';}
    localStorage.setItem('local-agent.theme',light?'light':'dark');
  };
  setTheme(saved==='light');
  const b=document.getElementById('themeBtn');
  if(b)b.addEventListener('click',()=>setTheme(!document.body.classList.contains('light')));
}
els.prompt.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();agentLoop()}});
async function init(){settings={...defaults,...settings,skills:Array.isArray(settings.skills)?settings.skills:[]}; delete settings.uiStyle; if(!providers[settings.provider]) settings.provider='openai'; if(!settings.apiUrl) settings.apiUrl=providers[settings.provider].chat; if(!settings.model) settings.model=providers[settings.provider].model;setRuntime('Runtime 待启动','muted');if(location.protocol==='file:'){els.workspaceInfo.textContent=settings.language==='en-US'?'Use HTTPS or localhost. Production deployment also needs COOP/COEP response headers.':'请通过 HTTPS 或 localhost 访问此页面；生产部署还需要 COOP/COEP 响应头。'}applyLanguage();updateProviderNotice(settings.provider);updateProviderSummary();installResizers();installTheme();renderSkills();}
init();
