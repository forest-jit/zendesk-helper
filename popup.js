'use strict';
async function run(mode){
 const status=document.getElementById('status');
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const url=new URL(tab.url);
  if(url.protocol!=='https:'||url.hostname!=='itjones.zendesk.com'||!url.pathname.startsWith('/agent/'))throw new Error('Open an itjones.zendesk.com agent ticket first.');
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['validator.js','content.js']});
  await chrome.scripting.removeCSS({target:{tabId:tab.id},files:['content.css']}).catch(()=>{});
  if(mode!=='off')await chrome.scripting.insertCSS({target:{tabId:tab.id},files:['content.css']});
  const options={layout:document.getElementById('layout').checked,context:document.getElementById('context').checked,manual:mode==='manual'};
  const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:(mode,options)=>mode==='off'?globalThis.zdTitleHelper.setEnabled(false):globalThis.zdTitleHelper.configure(options),args:[mode,options]});
  if(mode==='off'){status.textContent='Turned off. Original layout restored.';return;}
  const r=result.result;
  status.textContent=mode==='manual'?'Close this popup and click the title field.':(r.titleFound?'Title detected. Leave its input to check the format.':'Title not found. Open a ticket or use manual selection.')+(options.layout?(r.layoutFound?' Layout applied.':' Layout not recognized; unchanged.'):'')+(r.narrow?' Use a window at least 1000px wide for the new layout.':'');
 }catch(error){status.textContent=error.message;}
}
document.getElementById('enable').addEventListener('click',()=>run('apply'));
document.getElementById('manual').addEventListener('click',()=>run('manual'));
document.getElementById('disable').addEventListener('click',()=>run('off'));
