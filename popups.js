/* =========================================================
   RIHULA MUKHOBOLA - Modern Popup & Notification System
   Replaces browser alert()/confirm() dialogs with responsive UI.
   ========================================================= */
(function () {
  if (window.RihulaPopups) return;

  const STYLE_ID = 'rihula-popup-styles';
  const ROOT_ID = 'rihula-popup-root';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,sans-serif}
      .rp-toast-wrap{position:fixed;top:18px;right:18px;width:min(390px,calc(100vw - 36px));display:flex;flex-direction:column;gap:10px;pointer-events:none}
      .rp-toast{pointer-events:auto;display:grid;grid-template-columns:40px 1fr 28px;gap:11px;align-items:start;background:#fff;border:1px solid #e7e7e7;border-left:5px solid #0b6623;border-radius:14px;padding:14px 12px 14px 10px;box-shadow:0 14px 40px rgba(0,0,0,.16);animation:rpIn .25s ease both;overflow:hidden}
      .rp-toast.rp-error{border-left-color:#c62828}.rp-toast.rp-warning{border-left-color:#ef8b00}.rp-toast.rp-info{border-left-color:#1976d2}
      .rp-icon{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#eaf5ed;font-size:20px}.rp-error .rp-icon{background:#fdecec}.rp-warning .rp-icon{background:#fff4df}.rp-info .rp-icon{background:#e8f1fc}
      .rp-title{font-weight:700;color:#172018;font-size:15px;margin:1px 0 4px}.rp-message{font-size:14px;line-height:1.45;color:#536057;white-space:pre-line;word-break:break-word}
      .rp-close{border:0;background:transparent;color:#8a948d;font-size:20px;line-height:1;cursor:pointer;padding:0}.rp-close:hover{color:#172018}
      .rp-progress{height:3px;background:#0b6623;position:absolute;left:0;bottom:0;animation:rpProgress var(--rp-duration) linear forwards}.rp-error .rp-progress{background:#c62828}.rp-warning .rp-progress{background:#ef8b00}.rp-info .rp-progress{background:#1976d2}
      .rp-modal-backdrop{position:fixed;inset:0;background:rgba(9,18,12,.52);backdrop-filter:blur(4px);display:grid;place-items:center;padding:20px;pointer-events:auto;animation:rpFade .18s ease both}
      .rp-modal{width:min(430px,100%);background:#fff;border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.28);padding:24px;animation:rpModal .22s ease both}
      .rp-modal-icon{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#eaf5ed;font-size:25px;margin-bottom:14px}.rp-modal h3{margin:0 0 8px;color:#172018;font-size:20px}.rp-modal p{margin:0;color:#5d685f;font-size:15px;line-height:1.55;white-space:pre-line}
      .rp-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}.rp-btn{border:0;border-radius:10px;padding:11px 17px;font-weight:700;cursor:pointer;font-size:14px}.rp-btn-cancel{background:#eef1ee;color:#344039}.rp-btn-confirm{background:#0b6623;color:#fff}.rp-btn-danger{background:#c62828;color:#fff}.rp-btn:focus-visible,.rp-close:focus-visible{outline:3px solid rgba(25,118,210,.3);outline-offset:2px}
      @keyframes rpIn{from{opacity:0;transform:translateY(-10px) translateX(8px)}to{opacity:1;transform:none}}@keyframes rpFade{from{opacity:0}to{opacity:1}}@keyframes rpModal{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes rpProgress{from{width:100%}to{width:0}}
      @media(max-width:600px){.rp-toast-wrap{top:10px;right:10px;left:10px;width:auto}.rp-toast{grid-template-columns:36px 1fr 24px;padding:12px 10px}.rp-icon{width:36px;height:36px}.rp-modal{padding:20px;border-radius:16px}.rp-actions{flex-direction:column-reverse}.rp-btn{width:100%}}
      @media(prefers-reduced-motion:reduce){.rp-toast,.rp-modal-backdrop,.rp-modal{animation:none}.rp-progress{animation:none}}
    `;
    document.head.appendChild(style);
  }

  function root() {
    let el = document.getElementById(ROOT_ID);
    if (!el) { el = document.createElement('div'); el.id = ROOT_ID; document.body.appendChild(el); }
    return el;
  }

  const icons = {success:'✓', error:'!', warning:'!', info:'i'};
  const titles = {success:'Success', error:'Something went wrong', warning:'Please check', info:'Information'};

  function toast(message, type='info', title='', duration=3800) {
    injectStyles();
    const r = root();
    let wrap = r.querySelector('.rp-toast-wrap');
    if (!wrap) { wrap=document.createElement('div'); wrap.className='rp-toast-wrap'; r.appendChild(wrap); }
    const item=document.createElement('div'); item.className=`rp-toast rp-${type}`;
    const icon=document.createElement('div'); icon.className='rp-icon'; icon.textContent=icons[type]||icons.info;
    const body=document.createElement('div');
    const heading=document.createElement('div'); heading.className='rp-title'; heading.textContent=title||titles[type]||'Notification';
    const msg=document.createElement('div'); msg.className='rp-message'; msg.textContent=String(message ?? '');
    body.append(heading,msg);
    const close=document.createElement('button'); close.className='rp-close'; close.type='button'; close.setAttribute('aria-label','Close notification'); close.textContent='×';
    const progress=document.createElement('div'); progress.className='rp-progress'; progress.style.setProperty('--rp-duration',`${duration}ms`);
    item.append(icon,body,close,progress); wrap.appendChild(item);
    const remove=()=>{item.style.opacity='0';item.style.transform='translateY(-6px)';item.style.transition='.18s ease';setTimeout(()=>item.remove(),180)};
    close.onclick=remove; const timer=setTimeout(remove,duration); item.addEventListener('mouseenter',()=>clearTimeout(timer),{once:true});
    return item;
  }

  function confirmDialog(message, options={}) {
    injectStyles();
    return new Promise(resolve=>{
      const r=root(), backdrop=document.createElement('div'); backdrop.className='rp-modal-backdrop';
      const modal=document.createElement('div'); modal.className='rp-modal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
      const icon=document.createElement('div'); icon.className='rp-modal-icon'; icon.textContent=options.icon||'?';
      const h=document.createElement('h3'); h.textContent=options.title||'Are you sure?';
      const p=document.createElement('p'); p.textContent=String(message ?? '');
      const actions=document.createElement('div'); actions.className='rp-actions';
      const cancel=document.createElement('button'); cancel.className='rp-btn rp-btn-cancel'; cancel.type='button'; cancel.textContent=options.cancelText||'Cancel';
      const confirm=document.createElement('button'); confirm.className=`rp-btn ${options.danger?'rp-btn-danger':'rp-btn-confirm'}`; confirm.type='button'; confirm.textContent=options.confirmText||'Continue';
      actions.append(cancel,confirm); modal.append(icon,h,p,actions); backdrop.appendChild(modal); r.appendChild(backdrop);
      let done=false; const finish=value=>{if(done)return;done=true;backdrop.remove();resolve(value)};
      cancel.onclick=()=>finish(false); confirm.onclick=()=>finish(true); backdrop.addEventListener('click',e=>{if(e.target===backdrop)finish(false)});
      const onKey=e=>{if(e.key==='Escape')finish(false);if(e.key==='Enter')finish(true)}; document.addEventListener('keydown',onKey); const old=finish; // cleanup key handler after resolution
      const originalResolve=resolve;
      const cleanup=()=>document.removeEventListener('keydown',onKey);
      const wrappedFinish=value=>{cleanup();old(value)};
      cancel.onclick=()=>wrappedFinish(false);confirm.onclick=()=>wrappedFinish(true);backdrop.addEventListener('click',e=>{if(e.target===backdrop)wrappedFinish(false)});
      setTimeout(()=>confirm.focus(),0);
    });
  }

  window.RihulaPopups={toast,confirm:confirmDialog,success:m=>toast(m,'success'),error:m=>toast(m,'error'),warning:m=>toast(m,'warning'),info:m=>toast(m,'info')};
  window.showPopup=(message,type='info',title='',duration=3800)=>toast(message,type,title,duration);
  window.showConfirm=(message,options={})=>confirmDialog(message,options);
})();
