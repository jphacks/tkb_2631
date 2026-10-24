// スマホ幅での「意図しない改行」「要素の崩れ」チェック（確認用ブラウザの javascript_tool で実行する）
// 使い方：ページを表示した状態で、このファイルの中身をそのまま実行する。結果の wrapped / clipped / overlapNav が空ならOK
(()=>{
  const out={wrapped:[],clipped:[],overlapNav:[],viewport:innerWidth+'x'+innerHeight};
  const navTop=document.querySelector('aside')?.getBoundingClientRect().top??innerHeight;
  const seen=new Set();
  document.querySelectorAll('#main *, #modalcontent *').forEach(el=>{
    if(!(el instanceof HTMLElement))return;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none')return;
    const txt=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join('');
    const name=(el.getAttribute('aria-label')||txt||el.className||el.tagName).toString().slice(0,24);
    // 1行想定の要素（ボタン・ラベル・見出し・small）が2行以上になっている
    if(txt&&el.matches('button,b,small,h1,h2,h3,.pill,.tag,.map-year,.map-now,.room-count,.search-count')){
      const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.25;
      const inner=r.height-(parseFloat(cs.paddingTop)||0)-(parseFloat(cs.paddingBottom)||0);if(inner>lh*1.9&&!el.closest('.guide,.day-record,.together-history,.room-detail,.photo-done,.login-card,.welcome')){out.wrapped.push(name+' '+Math.round(r.width)+'x'+Math.round(r.height))}
    }
    // 文字が横にはみ出して「…」になっている
    if(txt&&cs.overflow!=='visible'&&el.scrollWidth>el.clientWidth+2)out.clipped.push(name+' '+el.scrollWidth+'>'+el.clientWidth);
    // 下のメニューに重なっている
    if(r.bottom>navTop+1&&r.top<navTop&&!el.closest('#modalcontent')&&!el.closest('.room-list,.fit-scroll')&&!seen.has(el.parentElement)){seen.add(el.parentElement);out.overlapNav.push(name+' bottom='+Math.round(r.bottom)+' nav='+Math.round(navTop))}
  });
  return out;
})();
