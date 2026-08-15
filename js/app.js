// Client app: register service worker and provide a tiny offline save/load demo
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/js/sw.js').then(reg => {
    console.log('SW registered', reg);
  }).catch(err => console.warn('SW failed', err));
}

const onlineEl = document.getElementById('online');
function updateOnlineStatus(){
  onlineEl.textContent = navigator.onLine ? 'online' : 'offline';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Very small IndexedDB wrapper (promises)
function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('dustdev-db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore('files', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFile(id, text){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files','readwrite');
    const store = tx.objectStore('files');
    store.put({id, text, updated: Date.now()});
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadFile(id){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files','readonly');
    const store = tx.objectStore('files');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? req.result.text : '');
    req.onerror = () => reject(req.error);
  });
}

const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const codeEl = document.getElementById('code');

saveBtn.addEventListener('click', async () => {
  try{
    await saveFile('demo.js', codeEl.value);
    alert('Saved offline — reopen the page to confirm');
  }catch(e){
    alert('Save failed: '+e);
  }
});

loadBtn.addEventListener('click', async () => {
  try{
    const contents = await loadFile('demo.js');
    codeEl.value = contents || '// nothing saved yet';
  }catch(e){
    alert('Load failed: '+e);
  }
});

// PWA install button handling (basic)
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return alert('Install not available');
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  console.log('PWA choice', choice);
  deferredPrompt = null;
});
