
const links = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

function onScroll(){
  let best = null;
  for(const s of sections){
    const r = s.getBoundingClientRect();
    if(r.top <= 120) best = s;
  }
  links.forEach(a => a.classList.remove('active'));
  if(best){
    const id = '#' + best.id;
    const a = links.find(x => x.getAttribute('href') === id);
    if(a) a.classList.add('active');
  }
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

links.forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if(t) t.scrollIntoView({behavior:'smooth', block:'start'});
    history.replaceState(null, '', a.getAttribute('href'));
  });
});
