(() => {
  'use strict';
  if (globalThis.zdTitleHelper) return;
  const defaults={enabled:true,layout:true,context:false};
  let enabled=false, armed=false, manualField=false, field=null, host=null, layout=false, context=false, syncFrame=0;
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
    if(action){const apply=document.createElement('button');apply.type='button';apply.textContent=action.label;apply.addEventListener('click',action.run);panel.append(apply);}
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
      if(layout&&visible(grid)){grid.setAttribute('data-zdh-layout','true');grid.setAttribute('data-zdh-context',String(context));marked.add(grid);}
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
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
      if(setter)setter.call(target,review.suggestion);else target.value=review.suggestion;
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.dispatchEvent(new Event('change',{bubbles:true}));
      clearWarning();target.focus();
    }});
    else message('Expected: Company - Requester - Issue. Example: Beluga Sales Inc. - Taylor Baxter - FaceID error. Format only; names are not verified. You can still save.',field);
  }
  function scheduleSync(){if(syncFrame)return;syncFrame=requestAnimationFrame(()=>{syncFrame=0;sync();});}
  const observer=new MutationObserver(scheduleSync);
  document.addEventListener('focusout',event=>{if(event.target===field)check();},true);
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
      enabled=true;layout=Boolean(options.layout);context=Boolean(options.context);armed=Boolean(options.manual);manualField=false;
      clearWarning();field=null;
      observer.disconnect();sync();observer.observe(document.body,{childList:true,subtree:true});
      if(armed)message('Click the title field to select it. No edits or submissions.');
      return {titleFound:Boolean(field),layoutFound:marked.size>0,narrow:innerWidth<1000};
    },
    setEnabled(value){
      if(value)return this.configure({layout:false,context:false,manual:true});
      enabled=false;armed=false;manualField=false;observer.disconnect();if(syncFrame)cancelAnimationFrame(syncFrame);syncFrame=0;clearWarning();field=null;
      for(const grid of marked){grid.removeAttribute('data-zdh-layout');grid.removeAttribute('data-zdh-context');}marked.clear();
    }
  };
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
    else globalThis.zdTitleHelper.configure({layout:preferences.layout,context:preferences.context,manual:false});
  });
  else globalThis.zdTitleHelper.configure(defaults);
})();
