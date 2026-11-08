(() => {
  'use strict';
  if (globalThis.zdTitleHelper) return;
  const defaults={enabled:true,layout:true,context:false,theme:'system'};
  let enabled=false, armed=false, manualField=false, field=null, host=null, layout=false, context=false, theme='system', syncFrame=0, warningActionPointer=false, composerHost=null, propertiesHost=null, workflowGrid=null;
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
  function controlState(grid){return globalThis.zdhWorkspace.readState(grid);}
  function clickText(root,text){const wanted=text.toLowerCase();const button=[...root.querySelectorAll('button,[role="menuitem"],[role="menuitemcheckbox"],[role="option"]')].find(node=>{const label=node.textContent.trim().toLowerCase();return visible(node)&&(label===wanted||label.endsWith(` as ${wanted}`));});button?.click();return Boolean(button);}
  async function chooseNativeMode(grid,mode){const state=controlState(grid);if(!state.modeButton)return false;state.modeButton.click();const label=mode==='internal'?'Internal note':'Public reply';for(let i=0;i<8;i++){if(clickText(document,label))return true;await new Promise(resolve=>setTimeout(resolve,75));}return false;}
  async function chooseNativeStatus(state,status){state.statusMenu.click();for(let i=0;i<8;i++){if(clickText(document,status==='on-hold'?'On-hold':status[0].toUpperCase()+status.slice(1)))return true;await new Promise(resolve=>setTimeout(resolve,75));}return false;}
  function composerUI(){return composerHost?.shadowRoot;}
  function propertiesUI(){return propertiesHost?.shadowRoot;}
  function refreshWorkflow(){
    if(!workflowGrid||!composerHost?.isConnected||!propertiesHost?.isConnected)return;
    const state=controlState(workflowGrid),composer=composerUI(),properties=propertiesUI(),review=composer.querySelector('[data-public-review]'),status=properties.querySelector('[data-status]');
    if(composerHost.dataset.mode&&composerHost.dataset.mode!==state.mode)review.checked=false;
    composerHost.dataset.mode=state.mode;
    for(const button of composer.querySelectorAll('[data-mode-choice]'))button.setAttribute('aria-pressed',String(button.dataset.modeChoice===state.mode));
    review.closest('label').hidden=state.mode!=='public';
    if(!status.dataset.touched)status.value=globalThis.zdhWorkflow.statuses.has(state.status)?state.status:'open';
    const sendGate=globalThis.zdhWorkflow.canSend({mode:state.mode,publicReviewed:review.checked,composerContent:state.composerContent,busy:saveLock.busy,nativeReady:state.nativeReady});
    const saveGate=globalThis.zdhWorkflow.canSaveProperties({composerContent:state.composerContent,status:status.value,busy:saveLock.busy,nativeReady:state.nativeReady});
    composer.querySelector('[data-send]').disabled=!sendGate.allowed;composer.querySelector('[data-state]').textContent=sendGate.reason||`Ready to send ${state.mode==='public'?'public reply':'internal note'}.`;
    properties.querySelector('[data-save]').disabled=!saveGate.allowed;properties.querySelector('[data-state]').textContent=saveGate.reason||`Ready to save as ${status.options[status.selectedIndex].text}.`;
  }
  function releaseAction(){setTimeout(()=>{saveLock.release();refreshWorkflow();},1200);}
  async function sendActive(){
    if(!workflowGrid||!saveLock.acquire())return false;
    const state=controlState(workflowGrid),ui=composerUI(),gate=globalThis.zdhWorkflow.canSend({mode:state.mode,publicReviewed:ui.querySelector('[data-public-review]').checked,composerContent:state.composerContent,busy:false,nativeReady:state.nativeReady});
    if(!gate.allowed){saveLock.release();refreshWorkflow();return false;}
    state.submit.click();ui.querySelector('[data-public-review]').checked=false;ui.querySelector('[data-state]').textContent='Send requested through Zendesk.';refreshWorkflow();releaseAction();return true;
  }
  async function savePropertiesActive(){
    if(!workflowGrid||!saveLock.acquire())return false;
    const state=controlState(workflowGrid),ui=propertiesUI(),status=ui.querySelector('[data-status]').value,gate=globalThis.zdhWorkflow.canSaveProperties({composerContent:state.composerContent,status,busy:false,nativeReady:state.nativeReady});
    if(!gate.allowed){saveLock.release();refreshWorkflow();return false;}
    ui.querySelector('[data-state]').textContent='Preparing property save…';
    const selected=await chooseNativeStatus(state,status),expected=globalThis.zdhWorkflow.submitLabel(status);
    if(!selected||!state.submit.textContent.includes(expected.replace('Submit as ',''))){saveLock.release();ui.querySelector('[data-state]').textContent='Zendesk did not confirm the selected status. Nothing was saved.';refreshWorkflow();return false;}
    state.submit.click();ui.querySelector('[data-state]').textContent=`Save requested as ${status}.`;refreshWorkflow();releaseAction();return true;
  }
  function downloadExport(format){const ticket=globalThis.zdhExporter.collect(document,location,workflowGrid);const blob=new Blob([globalThis.zdhExporter.serialize(ticket,format)],{type:format==='json'?'application/json':'text/markdown'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=globalThis.zdhExporter.filename(ticket,format);link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
  const controlStyle=`<style>:host{display:block;font:14px/1.4 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#23323a}section{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px;border:1px solid #c6d2d8;border-radius:10px;background:#f7fafb}button,select{font:inherit;min-height:38px;border-radius:8px}button{padding:0 12px;border:1px solid #79929d;background:#fff;color:#174f63;cursor:pointer}button[aria-pressed="true"],button.primary{background:#174f63;color:#fff;border-color:#174f63}button:disabled{cursor:not-allowed;opacity:.5}label{display:grid;gap:4px;font-weight:600}.review{display:flex;align-items:center}output{flex-basis:100%;color:#425b66;font-size:12px}</style>`;
  function mountWorkflow(grid){
    if(workflowGrid===grid&&composerHost?.isConnected&&propertiesHost?.isConnected){refreshWorkflow();return;}
    composerHost?.remove();propertiesHost?.remove();workflowGrid=grid;
    composerHost=document.createElement('div');composerHost.dataset.zdhComposerActions='true';composerHost.dataset.zdhTheme=theme;
    const composerRoot=composerHost.attachShadow({mode:'open'});composerRoot.innerHTML=`${controlStyle}<section aria-label="Reply actions"><div role="group" aria-label="Reply visibility"><button type="button" data-mode-choice="public" aria-pressed="false">Public reply</button><button type="button" data-mode-choice="internal" aria-pressed="false">Internal note</button></div><label class="review"><input data-public-review type="checkbox"> Public reply reviewed</label><button class="primary" data-send type="button">Send</button><output data-state aria-live="polite"></output></section>`;
    propertiesHost=document.createElement('div');propertiesHost.dataset.zdhPropertiesActions='true';propertiesHost.dataset.zdhTheme=theme;
    const propertiesRoot=propertiesHost.attachShadow({mode:'open'});propertiesRoot.innerHTML=`${controlStyle}<section aria-label="Ticket property actions"><label>Status<select data-status aria-label="Status"><option value="open">Open</option><option value="pending">Pending</option><option value="on-hold">On-hold</option><option value="solved">Solved</option></select></label><button class="primary" data-save type="button">Save changes</button><button data-json type="button">Export JSON</button><button data-md type="button">Export Markdown</button><output data-state aria-live="polite"></output></section>`;
    for(const button of composerRoot.querySelectorAll('[data-mode-choice]'))button.addEventListener('click',()=>chooseNativeMode(grid,button.dataset.modeChoice).then(refreshWorkflow));
    composerRoot.querySelector('[data-public-review]').addEventListener('change',refreshWorkflow);composerRoot.querySelector('[data-send]').addEventListener('click',sendActive);
    propertiesRoot.querySelector('[data-status]').addEventListener('change',event=>{event.target.dataset.touched='true';refreshWorkflow();});propertiesRoot.querySelector('[data-save]').addEventListener('click',savePropertiesActive);propertiesRoot.querySelector('[data-json]').addEventListener('click',()=>downloadExport('json'));propertiesRoot.querySelector('[data-md]').addEventListener('click',()=>downloadExport('markdown'));
    const state=controlState(grid),composerContainer=state.composer?.closest('.composer,[data-test-id="message-composer"],[aria-label="Message composer"]')||state.composer?.parentElement||state.conversation;
    composerContainer?.append(composerHost);state.properties?.append(propertiesHost);
    if(state.mode==='public'&&!globalThis.zdhWorkflow.composerHasContent(state.composerContent))chooseNativeMode(grid,'internal').then(refreshWorkflow);
    state.composer?.addEventListener('input',()=>{const review=composerUI()?.querySelector('[data-public-review]');if(review)review.checked=false;refreshWorkflow();});refreshWorkflow();
  }
  function clearWorkflow(){composerHost?.remove();propertiesHost?.remove();composerHost=null;propertiesHost=null;workflowGrid=null;delete document.documentElement.dataset.zdhTheme;}
  function closeImageLightbox(){const lightbox=document.querySelector('[data-zdh-image-lightbox]');if(!lightbox)return;const returnId=lightbox.dataset.returnId;lightbox.remove();if(returnId)document.querySelector(`[data-zdh-preview-id="${CSS.escape(returnId)}"]`)?.focus();}
  function openImageLightbox(image){closeImageLightbox();const lightbox=document.createElement('div');lightbox.dataset.zdhImageLightbox='true';lightbox.dataset.returnId=image.dataset.zdhPreviewId;lightbox.setAttribute('role','dialog');lightbox.setAttribute('aria-modal','true');lightbox.setAttribute('aria-label',image.alt||'Image preview');const close=document.createElement('button');close.type='button';close.textContent='Close preview';close.addEventListener('click',closeImageLightbox);const full=image.cloneNode();full.removeAttribute('data-zdh-message-image');full.removeAttribute('data-zdh-preview-id');full.removeAttribute('tabindex');full.removeAttribute('role');lightbox.append(close,full);document.body.append(lightbox);close.focus();}
  function syncImages(log){
    for(const image of log.querySelectorAll('article img,.message img,[data-zdh-conversation-entry] img')){
      if(image.closest('[data-zdh-image-preview],[data-zdh-image-lightbox]')||image.matches('.avatar,[class*="avatar" i],[data-test-id*="avatar" i]')||image.closest('button,[role="button"]')||((image.width||image.naturalWidth)<=64&&(image.height||image.naturalHeight)<=64))continue;
      if(image.dataset.zdhMessageImage)return;
      const id=`zdh-image-${Math.random().toString(36).slice(2)}`;image.dataset.zdhMessageImage='true';image.dataset.zdhPreviewId=id;image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-label',`Preview ${image.alt||'message image'}`);
      const preview=document.createElement('span');preview.dataset.zdhImagePreview='true';preview.setAttribute('aria-hidden','true');const clone=image.cloneNode();clone.removeAttribute('data-zdh-message-image');clone.removeAttribute('data-zdh-preview-id');clone.removeAttribute('tabindex');clone.removeAttribute('role');preview.append(clone);image.insertAdjacentElement('afterend',preview);image.addEventListener('click',()=>openImageLightbox(image));image.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openImageLightbox(image);}});
    }
  }
  function syncConversation(grid){
    const state=controlState(grid),log=state.conversation?.querySelector(globalThis.zdhWorkspace.selectors.conversationLog);if(!log)return;
    const entries=[...log.children].filter(node=>node.matches('article,.message,[data-zdh-export-comment]'));
    for(const entry of entries)entry.dataset.zdhConversationEntry='true';
    let disclosure=state.conversation.querySelector('[data-zdh-conversation-disclosure]');
    if(entries.length<=3){disclosure?.remove();for(const entry of entries)if(entry.dataset.zdhCollapsed){entry.hidden=false;delete entry.dataset.zdhCollapsed;}syncImages(log);return;}
    if(!disclosure){disclosure=document.createElement('button');disclosure.type='button';disclosure.dataset.zdhConversationDisclosure='true';disclosure.addEventListener('click',()=>{log.dataset.zdhExpanded=String(log.dataset.zdhExpanded!=='true');syncConversation(grid);});log.insertAdjacentElement('beforebegin',disclosure);}
    const expanded=log.dataset.zdhExpanded==='true',hiddenCount=entries.length-3;disclosure.textContent=expanded?'Show recent only':`+${hiddenCount} conversation${hiddenCount===1?'':'s'}`;disclosure.setAttribute('aria-expanded',String(expanded));
    entries.forEach((entry,index)=>{const collapse=!expanded&&index<hiddenCount;if(collapse){entry.hidden=true;entry.dataset.zdhCollapsed='true';}else if(entry.dataset.zdhCollapsed){entry.hidden=false;delete entry.dataset.zdhCollapsed;}});syncImages(log);
  }
  function clearConversation(){for(const disclosure of document.querySelectorAll('[data-zdh-conversation-disclosure]'))disclosure.remove();for(const entry of document.querySelectorAll('[data-zdh-collapsed]')){entry.hidden=false;delete entry.dataset.zdhCollapsed;}for(const preview of document.querySelectorAll('[data-zdh-image-preview]'))preview.remove();for(const image of document.querySelectorAll('[data-zdh-message-image]')){image.removeAttribute('data-zdh-message-image');image.removeAttribute('data-zdh-preview-id');image.removeAttribute('tabindex');image.removeAttribute('role');image.removeAttribute('aria-label');}closeImageLightbox();}
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
      if(layout&&visible(grid)){grid.setAttribute('data-zdh-layout','true');grid.setAttribute('data-zdh-context',String(context));grid.dataset.zdhTheme=theme;if(innerWidth>=1000)grid.dataset.zdhPageScroll='true';else delete grid.dataset.zdhPageScroll;document.documentElement.dataset.zdhTheme=theme;marked.add(grid);mountWorkflow(grid);syncConversation(grid);}
      else{grid.removeAttribute('data-zdh-layout');grid.removeAttribute('data-zdh-context');delete grid.dataset.zdhPageScroll;marked.delete(grid);}
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
      clearWorkflow();clearConversation();for(const grid of marked){grid.removeAttribute('data-zdh-layout');grid.removeAttribute('data-zdh-context');delete grid.dataset.zdhTheme;delete grid.dataset.zdhPageScroll;}marked.clear();
    }
    ,sendActive,savePropertiesActive
  };
  document.addEventListener('keydown',event=>{if(!enabled||event.key!=='Enter'||!event.metaKey||event.ctrlKey||event.repeat||event.isComposing)return;if(!propertiesHost?.contains(event.target))return;event.preventDefault();savePropertiesActive();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeImageLightbox();},true);
  addEventListener('resize',scheduleSync,{passive:true});
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
