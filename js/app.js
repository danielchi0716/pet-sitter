/* =============================================================
   貓咪代班照顧 - 互動邏輯
   ============================================================= */

/* ---------- 1) Tab 切換 ---------- */
const TAB_META = {
  cats:  { title:'我家的貓',  en:'Meet the cats' },
  tasks: { title:'今日任務',  en:"Today's tasks" },
  map:   { title:'物品位置',  en:'Where things are' },
  faq:   { title:'常見問題',  en:'FAQ & contact' },
};
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = {
  cats:  document.getElementById('panel-cats'),
  tasks: document.getElementById('panel-tasks'),
  map:   document.getElementById('panel-map'),
  faq:   document.getElementById('panel-faq'),
};
const topTitle  = document.getElementById('topTitle');
const topEn     = document.getElementById('topEn');

function switchTab(name){
  // 離開 map tab 時，重置位置頁回到物品清單
  if(name !== 'map'){
    showItemList();
  }
  Object.entries(tabPanels).forEach(([k,el])=>{
    if(k===name){
      el.classList.add('active');
    }else{
      el.classList.remove('active');
    }
  });
  tabBtns.forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===name);
  });
  topTitle.textContent = TAB_META[name].title;
  topEn.textContent    = TAB_META[name].en;
  window.scrollTo({top:0, behavior:'instant'});
}
tabBtns.forEach(b=> b.addEventListener('click', ()=> switchTab(b.dataset.tab)));

/* ---------- 2) localStorage：以今日日期為 key 自動重置 ---------- */
const TASK_IDS = ['t1','t2','t3','t4','t5'];      // 主任務（計入 X/5 進度）
const SPECIAL_IDS = ['t6','t7'];                  // 加分任務（不計入主進度）
const ALL_IDS = [...TASK_IDS, ...SPECIAL_IDS];

function todayKey(){
  const d = new Date();
  // YYYY-MM-DD（本地時區）
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

const STORAGE_KEY = 'cat-sitter-tasks';

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {date:todayKey(), done:{}};
    const data = JSON.parse(raw);
    if(data.date !== todayKey()){
      // 不是今天的資料 → 清空重新開始
      return {date:todayKey(), done:{}};
    }
    return data;
  }catch(e){
    return {date:todayKey(), done:{}};
  }
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
saveState(state); // 確保日期更新到 localStorage

/* ---------- 3) 任務勾選 / 進度 / 慶祝 ---------- */
const progNum    = document.getElementById('progNum');
const progFill   = document.getElementById('progFill');
const progTip    = document.getElementById('progTip');
const celebrate  = document.getElementById('celebrate');
const taskEls    = document.querySelectorAll('.task');
const checkboxes = document.querySelectorAll('input[data-task]');

function refreshUI(){
  let done = 0;
  // 主任務
  TASK_IDS.forEach(id=>{
    const checked = !!state.done[id];
    const cb = document.querySelector(`input[data-task="${id}"]`);
    const card = document.querySelector(`.task[data-id="${id}"]`);
    if(cb) cb.checked = checked;
    if(card) card.classList.toggle('done', checked);
    if(checked) done++;
  });
  // 加分任務（不計入主進度）
  let specialDone = 0;
  SPECIAL_IDS.forEach(id=>{
    const checked = !!state.done[id];
    const cb = document.querySelector(`input[data-task="${id}"]`);
    const card = document.querySelector(`.task[data-id="${id}"]`);
    if(cb) cb.checked = checked;
    if(card) card.classList.toggle('done', checked);
    if(checked) specialDone++;
  });
  const total = TASK_IDS.length;
  progNum.textContent = done;
  const pct = (done/total)*100;
  progFill.style.width = pct + '%';

  // 提示文案
  if(done === 0){
    progTip.textContent = '點一下卡片可以展開步驟 👇';
  }else if(done < total){
    progTip.textContent = `還剩 ${total-done} 項，加油！`;
  }else{
    progTip.textContent = '全部完成 ✨';
  }

  // 主任務全完成 → 帶狀橫幅
  if(done === total){
    celebrate.classList.add('show');
  }else{
    celebrate.classList.remove('show');
  }

  // 加分任務全完成 → 小提示
  const specialEl = document.getElementById('specialCelebrate');
  if(specialEl){
    specialEl.classList.toggle('show', specialDone === SPECIAL_IDS.length);
  }
}

checkboxes.forEach(cb=>{
  cb.addEventListener('change', ()=>{
    const id = cb.dataset.task;
    const wasDone = !!state.done[id];
    state.done[id] = cb.checked;
    state.date = todayKey();
    saveState(state);
    refreshUI();

    // 主任務從未完成 → 全部完成 → 撒花（加分任務不觸發撒花）
    if(TASK_IDS.includes(id)){
      const total = TASK_IDS.length;
      const nowDone = TASK_IDS.filter(t=>state.done[t]).length;
      if(!wasDone && cb.checked && nowDone === total){
        fireConfetti();
      }
    }
  });
});

/* ---------- 4) 重置按鈕 ---------- */
document.getElementById('btnReset').addEventListener('click', ()=>{
  if(!confirm('要清空今天的勾選嗎？')) return;
  state = {date:todayKey(), done:{}};
  saveState(state);
  refreshUI();
});

/* ---------- 5) 任務卡片展開 ---------- */
taskEls.forEach(card=>{
  const head = card.querySelector('.task-head');
  head.addEventListener('click', (e)=>{
    // 點到 checkbox 本身時不切換展開
    if(e.target.closest('.chk')) return;
    card.classList.toggle('open');
  });
});

/* ---------- 6) FAQ 折疊 ---------- */
document.querySelectorAll('.faq-item').forEach(item=>{
  item.querySelector('.faq-q').addEventListener('click', ()=>{
    item.classList.toggle('open');
  });
});

/* ---------- 7) Lightbox（平面圖點擊放大） ---------- */
const lightbox = document.getElementById('lightbox');
const lbStage = document.getElementById('lbStage');
function showLightbox(node){
  lbStage.innerHTML = '';
  lbStage.appendChild(node);
  lightbox.classList.add('show');
  lightbox.setAttribute('aria-hidden','false');
}
function closeLightbox(){
  lightbox.classList.remove('show');
  lightbox.setAttribute('aria-hidden','true');
  lbStage.innerHTML = '';                  // 清掉內容，停止其動畫
}
// 平面圖：點擊放大（連同 pin 一起複製進來，% 定位自動跟著縮放）；定位模式(#pin)下不放大
document.querySelectorAll('.floorplan-clickable').forEach(fp=>{
  fp.addEventListener('click', ()=>{
    if(location.hash === '#pin') return;
    const clone = fp.cloneNode(true);
    clone.classList.remove('floorplan-clickable');
    clone.querySelectorAll('.zoom-hint').forEach(el=>el.remove());
    showLightbox(clone);
  });
});
// 純照片連結：點擊以相同的放大檢視呈現
document.querySelectorAll('.photo-link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const img = document.createElement('img');
    img.className = 'lb-photo';
    img.src = btn.dataset.photo;
    img.alt = btn.dataset.alt || '';
    showLightbox(img);
  });
});
document.getElementById('lbClose').addEventListener('click', (e)=>{e.stopPropagation(); closeLightbox();});
lightbox.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape') closeLightbox();
});

/* ---------- 7c) 平面圖座標拾取（開發用，網址結尾加 #pin 才啟用）----------
   點平面圖任一點即顯示並複製「left:X%; top:Y%;」，方便標 pin。正常使用看不到此工具。 */
(function initPinPicker(){
  if(location.hash !== '#pin') return;
  const readout = document.createElement('div');
  readout.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:999;background:#3E2F22;color:#fff;font:13px/1.4 monospace;padding:8px 14px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.35)';
  readout.textContent = '平面圖定位模式：點圖讀座標';
  document.body.appendChild(readout);
  document.querySelectorAll('.floorplan-pin-wrap').forEach(wrap=>{
    wrap.style.cursor = 'crosshair';
    wrap.addEventListener('click', (e)=>{
      const r = wrap.getBoundingClientRect();
      const x = (((e.clientX - r.left) / r.width) * 100).toFixed(1);
      const y = (((e.clientY - r.top) / r.height) * 100).toFixed(1);
      const text = 'left:' + x + '%; top:' + y + '%;';
      readout.textContent = text + '（已複製）';
      if(navigator.clipboard){ navigator.clipboard.writeText(text).catch(()=>{}); }
    });
  });
})();

/* ---------- 7b) Tab 3 兩層導航：物品清單 ↔詳細頁 ---------- */
const mapListView   = document.getElementById('mapListView');
const mapDetailViews = document.querySelectorAll('.map-detail-view');

function showItemDetail(id){
  mapListView.classList.add('hidden');
  mapDetailViews.forEach(d=>{
    d.classList.toggle('active', d.dataset.detail === id);
  });
  // 進入詳細頁要回到頂部
  window.scrollTo({top:0, behavior:'instant'});
  // 更新頂部標題
  const card = document.querySelector(`.item-card[data-item="${id}"] .item-name`);
  if(card){
    topTitle.textContent = card.textContent.trim();
  }
}
function showItemList(){
  mapListView.classList.remove('hidden');
  mapDetailViews.forEach(d=> d.classList.remove('active'));
  // 回到清單時，頭部標題重設回 "物品位置"（若目前在 map tab）
  const onMap = tabPanels.map.classList.contains('active');
  if(onMap){
    topTitle.textContent = TAB_META.map.title;
    topEn.textContent    = TAB_META.map.en;
  }
}
document.querySelectorAll('.item-card').forEach(card=>{
  card.addEventListener('click', ()=> showItemDetail(card.dataset.item));
});
document.querySelectorAll('.btn-back').forEach(btn=>{
  btn.addEventListener('click', ()=> showItemList());
});

/* ---------- 8) Confetti（橘色系小慶祝） ---------- */
function fireConfetti(){
  const root = document.getElementById('confetti');
  root.innerHTML = '';
  const colors = ['#E8843C','#F5934A','#F7B26C','#FBE8D4','#C96A24','#FFD7A8'];
  const count = 36;
  for(let i=0;i<count;i++){
    const piece = document.createElement('i');
    const left = Math.random()*100;
    const delay = Math.random()*0.4;
    const dur = 1.6 + Math.random()*1.4;
    const color = colors[Math.floor(Math.random()*colors.length)];
    const rot = Math.floor(Math.random()*360);
    piece.style.left = left + '%';
    piece.style.background = color;
    piece.style.animationDelay = delay + 's';
    piece.style.animationDuration = dur + 's';
    piece.style.transform = `rotate(${rot}deg)`;
    piece.style.width  = (6 + Math.random()*8) + 'px';
    piece.style.height = (10 + Math.random()*10) + 'px';
    root.appendChild(piece);
  }
  setTimeout(()=>{ root.innerHTML=''; }, 3500);
}

/* ---------- 9) 初始化 ---------- */
refreshUI();
// 預設打開第一個任務（讓朋友看到展開效果範例）
const firstTask = document.querySelector('.task[data-id="t1"]');
if(firstTask) firstTask.classList.add('open');
