(() => {
  'use strict';
  if (globalThis.zdTitleHelper) return;
  const defaults={enabled:true,layout:true,context:false,theme:'system'};
  let enabled=false, armed=false, manualField=false, field=null, host=null, layout=false, context=false, theme='system', syncFrame=0, warningActionPointer=false, workflowHost=null, workflowGrid=null;
  const saveLock=globalThis.zdhWorkflow.createSaveLock();
  const marked=new Set();
  function clearWarning(){
    if(field&&host?.id){
      const ids=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==host.id);
      if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby');
    }
    host?.remove();host=null;
  }
  function message(text,anchor,action){
    clearWarning();host=document.createElement('div');
    const anchored=Boolean(anchor?.isConnected);
    host.id='zdh-warning-'+Math.random().toString(36).slice(2);
    host.dataset.zdhWarning='true';host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('aria-label',text);
    if(!anchored)host.dataset.floating='true';
    const root=host.attachShadow({mode:'open'});
    const css=document.createElement('style');
    css.textContent=':host{display:block!important;position:relative!important;z-index:2147483647!important}section{pointer-events:auto;margin:6px 0;padding:10px 14px;background:#fff4d6;color:#513d09;border:1px solid #d8ad3e;border-radius:6px;font:14px/1.5 system-ui;white-space:normal}:host([data-floating="true"]) section{pointer-events:none}button{float:right;margin-left:12px;cursor:pointer}';
    const panel=document.createElement('section');panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
    const label=document.createElement('span');label.textContent=text;
    const close=document.createElement('button');close.type='button';close.textContent='Dismiss';close.addEventListener('click',clearWarning);
    if(action){const apply=document.createElement('button');apply.type='button';apply.textContent=action.label;apply.addEventListener('pointerdown',()=>{warningActionPointer=true;});apply.addEventListener('pointerup',()=>{warningActionPointer=false;});apply.addEventListener('pointercancel',()=>{warningActionPointer=false;});apply.addEventListener('click',event=>{warningActionPointer=false;action.run(event);});panel.append(apply);}
    if(anchored)panel.append(close);
    panel.append(label);root.append(css,panel);
    if(anchored){anchor.insertAdjacentElement('afterend',host);anchor.setAttribute('aria-describedby',[anchor.getAttribute('aria-describedby'),host.id].filter(Boolean).join(' '));}
    else{host.style.cssText='position:fixed!important;bottom:70px!important;right:16px!important;max-width:430px!important;pointer-events:none!important';document.documentElement.append(host);}
  }
  function visible(el){
    if(!el?.isConnected||el.closest('[hidden],[aria-hidden="true"]'))return false;
    const styles=getComputedStyle(el);
    return styles.display!=='none'&&styles.visibility!=='hidden'&&styles.opacity!=='0'&&el.getClientRects().length>0;
  }
  function activeTitle(){return [...document.querySelectorAll('input[data-test-id="omni-header-subject"]')].find(visible)||null;}
  function controlState(grid){
    const modeButton=grid.querySelector('[data-test-id="omnichannel-channel-switcher-button"],button[aria-label="Public reply"],button[aria-label="Internal note"]');
    const composer=grid.querySelector('[data-test-id="ticket-rich-text-editor"],textarea,[contenteditable="true"]');
    const submit=document.querySelector('[data-test-id="submit_button-button"]');
    const statusMenu=document.querySelector('[data-test-id="submit_button-menu-button"],[aria-label="Displays possible ticket submission types"]');
    const mode=globalThis.zdhWorkflow.normalizeMode(modeButton?.getAttribute('aria-label')||modeButton?.textContent);
    const status=(submit?.textContent.match(/Submit as\s+(.+)/i)?.[1]||'open').trim().toLowerCase();
    return {modeButton,composer,submit,statusMenu,mode,status:status==='on hold'?'on-hold':status,nativeReady:Boolean(modeButton&&submit&&statusMenu)};
  }
  function clickText(root,text){const wanted=text.toLowerCase();const button=[...root.querySelectorAll('button,[role="menuitem"],[role="menuitemcheckbox"],[role="option"]')].find(node=>{const label=node.textContent.trim().toLowerCase();return visible(node)&&(label===wanted||label.endsWith(` as ${wanted}`));});button?.click();return Boolean(button);}
  async function chooseNativeMode(grid,mode){const state=controlState(grid);if(!state.modeButton)return false;state.modeButton.click();const label=mode==='internal'?'Internal note':'Public reply';for(let i=0;i<8;i++){if(clickText(document,label))return true;await new Promise(resolve=>setTimeout(resolve,75));}return false;}
  async function chooseNativeStatus(state,status){state.statusMenu.click();for(let i=0;i<8;i++){if(clickText(document,status==='on-hold'?'On-hold':status[0].toUpperCase()+status.slice(1)))return true;await new Promise(resolve=>setTimeout(resolve,75));}return false;}
  function workflowUI(){return workflowHost?.shadowRoot;}
  function refreshWorkflow(){
    if(!workflowGrid||!workflowHost?.isConnected)return;
    const state=controlState(workflowGrid),ui=workflowUI(),review=ui.querySelector('[data-public-review]'),status=ui.querySelector('[data-status]');
    if(workflowHost.dataset.mode&&workflowHost.dataset.mode!==state.mode)review.checked=false;
    workflowHost.dataset.mode=state.mode;
    if(!status.dataset.touched)status.value=globalThis.zdhWorkflow.statuses.has(state.status)?state.status:'open';
    ui.querySelector('[data-mode]').textContent=state.mode==='internal'?'Internal note':state.mode==='public'?'Public reply':'Mode unavailable';
    review.closest('label').hidden=state.mode!=='public';
    const gate=globalThis.zdhWorkflow.canSave({mode:state.mode,publicReviewed:review.checked,status:status.value,busy:saveLock.busy,nativeReady:state.nativeReady});
    const save=ui.querySelector('[data-save]');save.disabled=!gate.allowed;ui.querySelector('[data-state]').textContent=gate.reason||`Ready to save as ${status.options[status.selectedIndex].text}.`;
  }
  async function saveActive(){
    if(!workflowGrid||!saveLock.acquire())return false;
    const ui=workflowUI(),state=controlState(workflowGrid),status=ui.querySelector('[data-status]').value,gate=globalThis.zdhWorkflow.canSave({mode:state.mode,publicReviewed:ui.querySelector('[data-public-review]').checked,status,busy:false,nativeReady:state.nativeReady});
    if(!gate.allowed){saveLock.release();refreshWorkflow();return false;}
    ui.querySelector('[data-state]').textContent='Preparing Zendesk save…';
    const selected=await chooseNativeStatus(state,status);
    const expected=globalThis.zdhWorkflow.submitLabel(status);
    if(!selected||!state.submit.textContent.includes(expected.replace('Submit as ',''))){saveLock.release();ui.querySelector('[data-state]').textContent='Zendesk did not confirm the selected status. Nothing was saved.';refreshWorkflow();return false;}
    state.submit.click();ui.querySelector('[data-public-review]').checked=false;ui.querySelector('[data-state]').textContent=`Save requested as ${status}.`;refreshWorkflow();setTimeout(()=>{saveLock.release();refreshWorkflow();},1200);return true;
  }
  function downloadExport(format){const ticket=globalThis.zdhExporter.collect(document,location,workflowGrid);const blob=new Blob([globalThis.zdhExporter.serialize(ticket,format)],{type:format==='json'?'application/json':'text/markdown'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=globalThis.zdhExporter.filename(ticket,format);link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
  function mountWorkflow(grid){
    if(workflowGrid===grid&&workflowHost?.isConnected){refreshWorkflow();return;}
    workflowHost?.remove();workflowGrid=grid;workflowHost=document.createElement('div');workflowHost.dataset.zdhWorkflow='true';workflowHost.dataset.zdhTheme=theme;
    const root=workflowHost.attachShadow({mode:'open'});root.innerHTML=`<style>:host{display:block;margin:0 0 16px;font:14px/1.4 system-ui;color:#23323a}section{display:flex;align-items:end;gap:12px;flex-wrap:wrap;padding:12px 16px;border:1px solid #c6d2d8;border-radius:10px;background:#f7fafb}label{display:grid;gap:4px;font-weight:600}label.review{display:flex;align-items:center;min-height:38px}select,button{font:inherit;min-height:38px}button{padding:0 12px}.primary{background:#174f63;color:white;border:1px solid #174f63;border-radius:6px}.secondary{background:white;color:#174f63;border:1px solid #79929d;border-radius:6px}button:disabled{opacity:.55}output{flex-basis:100%;color:#425b66}:host([data-zdh-theme="contrast"]) section{background:#fff;border-color:#263238;color:#111}:host([data-zdh-theme="calm"]) section{background:#eef5f7;border-color:#9eb6c0}</style><section aria-label="Zendesk Helper workflow"><label>Reply mode <strong data-mode>Checking…</strong></label><label>Status after save <select data-status aria-label="Status after save"><option value="open">Open</option><option value="pending">Pending</option><option value="on-hold">On-hold</option><option value="solved">Solved</option></select></label><label class="review"><input data-public-review type="checkbox"> Public reply reviewed</label><button class="primary" data-save type="button">Save changes</button><button class="secondary" data-json type="button">Export JSON</button><button class="secondary" data-md type="button">Export Markdown</button><output data-state aria-live="polite"></output></section>`;
    root.querySelector('[data-status]').addEventListener('change',event=>{event.target.dataset.touched='true';refreshWorkflow();});root.querySelector('[data-public-review]').addEventListener('change',refreshWorkflow);root.querySelector('[data-save]').addEventListener('click',saveActive);root.querySelector('[data-json]').addEventListener('click',()=>downloadExport('json'));root.querySelector('[data-md]').addEventListener('click',()=>downloadExport('markdown'));
    const column=grid.querySelector(':scope > [data-test-id="column-2"]')||grid;column.append(workflowHost);
    const state=controlState(grid);if(state.mode==='public'&&!(state.composer?.value||state.composer?.textContent||'').trim())chooseNativeMode(grid,'internal').then(refreshWorkflow);
    state.composer?.addEventListener('input',()=>{const review=workflowUI()?.querySelector('[data-public-review]');if(review)review.checked=false;refreshWorkflow();});refreshWorkflow();
  }
  function clearWorkflow(){workflowHost?.remove();workflowHost=null;workflowGrid=null;delete document.documentElement.dataset.zdhTheme;}
  function ticketIdentity(){
    const requester=document.querySelector('[data-test-id="ticket-system-field-requester-select"] input, input[aria-label="Requester"]')?.value?.trim();
    const organization=document.querySelector('[data-test-id="organization_id-field-test-id"]')?.textContent?.trim().replace(/^Org\.\s*/i,'');
    return {requester,organization};
  }
  function sync(){
    if(!enabled)return;
    if(!armed&&!manualField){const current=activeTitle();if(current!==field){clearWarning();field=current;}}
    const grids=[...document.querySelectorAll('[data-test-id^="ticket-"][data-test-id$="-standard-layout"]')];
    for(const grid of grids){
      if(!grid.querySelector(':scope > [data-test-id="column-1"]')||!grid.querySelector(':scope > [data-test-id="column-2"]'))continue;
      if(layout&&visible(grid)){grid.setAttribute('data-zdh-layout','true');grid.setAttribute('data-zdh-context',String(context));grid.dataset.zdhTheme=theme;document.documentElement.dataset.zdhTheme=theme;marked.add(grid);mountWorkflow(grid);}
      else{grid.removeAttribute('data-zdh-layout');grid.removeAttribute('data-zdh-context');marked.delete(grid);}
    }
    for(const grid of marked)if(!grid.isConnected)marked.delete(grid);
  }
  function check(){
    if(!enabled||!field?.isConnected||!visible(field))return;
    const review=globalThis.zdTitleReview?.(field.value,ticketIdentity())||{valid:globalThis.zdTitleFormat(field.value),kind:'format'};
    if(review.valid)clearWarning();
    else if(review.kind==='duplicate-identity')message(`This title may contain two company/requester prefixes. Review this suggestion: ${review.suggestion}. Nothing was changed; you can still save.`,field,{label:'Use suggestion',run:()=>{
      const target=field;
      target.focus({preventScroll:true});target.select();
      const applied=document.execCommand('insertText',false,review.suggestion);
      if(!applied){
        const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
        if(setter)setter.call(target,review.suggestion);else target.value=review.suggestion;
        target.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertReplacementText',data:review.suggestion}));
      }
      target.dispatchEvent(new Event('change',{bubbles:true}));
      clearWarning();target.focus();
    }});
    else message('Expected: Company - Requester - Issue. Example: Beluga Sales Inc. - Taylor Baxter - FaceID error. Format only; names are not verified. You can still save.',field);
  }
  function scheduleSync(){if(syncFrame)return;syncFrame=requestAnimationFrame(()=>{syncFrame=0;sync();});}
  const observer=new MutationObserver(scheduleSync);
  document.addEventListener('focusout',event=>{
    const next=event.relatedTarget;
    const movingToWarning=warningActionPointer||Boolean(host&&(next===host||host.shadowRoot?.contains(next)));
    if(event.target===field&&!movingToWarning)check();
  },true);
  document.addEventListener('submit',check,true);
  document.addEventListener('click',event=>{
    if(!enabled||!armed)return;
    const target=event.target;
    if(!(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement))return;
    if(target instanceof HTMLInputElement&&!['text','search'].includes(target.type))return;
    if(target.disabled||target.readOnly)return;
    clearWarning();field=target;armed=false;manualField=true;message('Title selected. Leave this field to check its format.',field);
  },true);
  // Observe only element additions/removals, not values, text or our attribute updates.
  globalThis.zdTitleHelper={
    configure(options){
      enabled=true;layout=Boolean(options.layout);context=Boolean(options.context);theme=['system','calm','contrast'].includes(options.theme)?options.theme:'system';armed=Boolean(options.manual);manualField=false;
      clearWarning();field=null;
      observer.disconnect();sync();observer.observe(document.body,{childList:true,subtree:true});
      if(armed)message('Click the title field to select it. No edits or submissions.');
      return {titleFound:Boolean(field),layoutFound:marked.size>0,narrow:innerWidth<1000};
    },
    setEnabled(value){
      if(value)return this.configure({layout:false,context:false,manual:true});
      enabled=false;armed=false;manualField=false;observer.disconnect();if(syncFrame)cancelAnimationFrame(syncFrame);syncFrame=0;clearWarning();field=null;
      clearWorkflow();for(const grid of marked){grid.removeAttribute('data-zdh-layout');grid.removeAttribute('data-zdh-context');delete grid.dataset.zdhTheme;}marked.clear();
    }
    ,saveActive
  };
  document.addEventListener('keydown',event=>{if(!enabled||event.key!=='Enter'||!event.metaKey||event.ctrlKey||event.repeat||event.isComposing)return;if(!workflowGrid?.contains(event.target))return;event.preventDefault();saveActive();},true);
  const runtime=globalThis.chrome?.runtime;
  runtime?.onMessage?.addListener((message,_sender,sendResponse)=>{
    let result=null;
    if(message?.type==='zdh-configure')result=globalThis.zdTitleHelper.configure(message.options||defaults);
    else if(message?.type==='zdh-manual-select')result=globalThis.zdTitleHelper.configure({...defaults,...message.options,manual:true});
    else if(message?.type==='zdh-set-enabled'){globalThis.zdTitleHelper.setEnabled(Boolean(message.value));result={enabled:Boolean(message.value)};}
    else return false;
    sendResponse?.(result);
    return false;
  });
  const storage=globalThis.chrome?.storage?.local;
  if(storage?.get)storage.get(defaults,preferences=>{
    if(preferences.enabled===false)globalThis.zdTitleHelper.setEnabled(false);
    else globalThis.zdTitleHelper.configure({layout:preferences.layout,context:preferences.context,theme:preferences.theme,manual:false});
  });
  else globalThis.zdTitleHelper.configure(defaults);
})();
