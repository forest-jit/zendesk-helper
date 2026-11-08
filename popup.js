'use strict';
const defaults={enabled:true,layout:true,context:false};

function readPreferences(){return new Promise(resolve=>chrome.storage.local.get(defaults,resolve));}
function writePreferences(preferences){return new Promise(resolve=>chrome.storage.local.set(preferences,resolve));}

async function activeZendeskTab(){
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 const url=new URL(tab?.url||'about:blank');
 if(url.protocol!=='https:'||url.hostname!=='itjones.zendesk.com'||!url.pathname.startsWith('/agent/'))throw new Error('Open an itjones.zendesk.com agent page first.');
 return tab;
}

async function send(tabId,message){
 try{return await chrome.tabs.sendMessage(tabId,message);}
 catch{throw new Error('Reload this Zendesk tab once after updating the extension.');}
}

async function run(mode){
 const status=document.getElementById('status');
 try{
  const tab=await activeZendeskTab();
  const options={layout:document.getElementById('layout').checked,context:document.getElementById('context').checked,manual:false};
  if(mode==='off'){
   await writePreferences({enabled:false,layout:options.layout,context:options.context});
   await send(tab.id,{type:'zdh-set-enabled',value:false});
   status.textContent='Turned off. This choice persists until you enable it again.';
   return;
  }
  await writePreferences({enabled:true,layout:options.layout,context:options.context});
  const type=mode==='manual'?'zdh-manual-select':'zdh-configure';
  const result=await send(tab.id,{type,options});
  if(mode==='manual'){status.textContent='Close this popup and click the title field. No ticket data will be changed.';return;}
  status.textContent=(result?.titleFound?'Title detected. Leave its input to check the format.':'Title not found. Open a ticket or use manual selection.')+(options.layout?(result?.layoutFound?' Layout applied.':' Layout not recognized; unchanged.'):'')+(result?.narrow?' Use a window at least 1000px wide for the new layout.':'');
 }catch(error){status.textContent=error.message;}
}

async function initialize(){
 const preferences=await readPreferences();
 document.getElementById('layout').checked=Boolean(preferences.layout);
 document.getElementById('context').checked=Boolean(preferences.context);
 document.getElementById('status').textContent=preferences.enabled===false?'Overlay is off. Apply settings to enable it.':'Overlay applies automatically on Jones IT Zendesk.';
}

document.getElementById('enable').addEventListener('click',()=>run('apply'));
document.getElementById('manual').addEventListener('click',()=>run('manual'));
document.getElementById('disable').addEventListener('click',()=>run('off'));
initialize().catch(error=>{document.getElementById('status').textContent=error.message;});
