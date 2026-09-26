/* Ridhan clinic — interaction layer */
(function(){
var IMG = {"corns": "/assets/img/th_corns.jpg", "gfc": "/assets/img/th_gfc.jpg", "vitiligo_surg": "/assets/img/th_vitiligo_surg.jpg", "psoriasis": "/assets/img/th_psoriasis.jpg", "prp": "/assets/img/th_prp.jpg", "warts": "/assets/img/th_warts.jpg", "nail": "/assets/img/th_nail.jpg", "vitiligo": "/assets/img/th_vitiligo.jpg", "earlobe": "/assets/img/th_earlobe.jpg", "acne": "/assets/img/th_acne.jpg", "hairfall": "/assets/img/th_hairfall.jpg", "keloid": "/assets/img/th_keloid.jpg", "pigmentation": "/assets/img/th_pigmentation.jpg", "acne_scars": "/assets/img/th_acne_scars.jpg", "nail2": "/assets/img/th_nail2.jpg", "cyst": "/assets/img/th_cyst.jpg", "wound": "/assets/img/th_wound.jpg", "microneedling": "/assets/icons/microneedling.svg", "dermabrasion": "/assets/icons/dermabrasion.svg", "threadlift": "/assets/icons/threadlift.svg", "botox": "/assets/icons/botox.svg", "filler": "/assets/icons/filler.svg", "vaccination": "/assets/icons/vaccination.svg", "growth": "/assets/icons/growth.svg", "allergies": "/assets/icons/allergies.svg", "lipoma": "/assets/icons/lipoma.svg", "consult": "/assets/icons/consult.svg", "monitoring": "/assets/icons/monitoring.svg", "newborn": "/assets/icons/newborn.svg", "asthma": "/assets/icons/asthma.svg", "allergytest": "/assets/icons/allergytest.svg"};
(function(){
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* video: honour reduced motion, and only run what is on screen */
  var hv = document.getElementById('heroVideo');
  var amb = document.querySelector('.filmstage .ambient');
  if (REDUCED){
    [hv, amb].forEach(function(v){ if (v){ v.removeAttribute('autoplay'); v.pause(); } });
  } else {
    [hv, amb].forEach(function(v){
      if (!v) return;
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting){ var q = v.play(); if (q && q.catch) q.catch(function(){}); }
          else v.pause();
        });
      }, {threshold: 0.01});
      io.observe(v);
    });
    /* pause the ambient loop while the real film is playing */
    var film = document.querySelector('.film video');
    if (film && amb){
      film.addEventListener('play', function(){ amb.pause(); });
      film.addEventListener('pause', function(){ var q = amb.play(); if (q && q.catch) q.catch(function(){}); });
    }
  }

  /* ---------- treatment count (computed, never hand-typed) ---------- */
  var items = document.querySelectorAll('#svclist .tx');
  /* stagger the hint so it reads as one wave down the list, not 31 twitches */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(function(b,i){
      var d = (i * 0.055).toFixed(2) + 's';
      b.style.animationDelay = d;
      b.style.setProperty('--d', d);
    });
    var st = document.createElement('style');
    st.textContent = '#svclist .tx::before{animation-delay:inherit}';
    document.head.appendChild(st);
  }
  var cEl = document.querySelector('[data-count]');
  if (cEl) cEl.textContent = items.length;

  /* ---------- mini card ---------- */
  var ILLUS = new Set(['microneedling','dermabrasion','threadlift','botox','filler','vaccination','growth','allergies','lipoma','consult','monitoring','newborn','asthma','allergytest']);
  var mini = document.getElementById('mini');
  var mImg = mini.querySelector('img'), mNone = mini.querySelector('.none');
  var mH = mini.querySelector('h5'), mP = mini.querySelector('p'), mTag = mini.querySelector('.tag');
  var active = null, hideTimer = null;

  /* Decoded-image cache. Swapping src on a cold image flashes the previous
     frame, which read as the card "stuttering" on first hover. */
  var warmed = Object.create(null);
  function warm(src){
    if (!src || warmed[src]) return warmed[src];
    var im = new Image(); im.src = src;
    warmed[src] = im.decode ? im.decode().catch(function(){}) : Promise.resolve();
    return warmed[src];
  }
  Object.keys(IMG).forEach(function(k){ warm(IMG[k]); });

  function place(btn){
    var r = btn.getBoundingClientRect(), W = 336, H = mini.offsetHeight || 340;
    var x = r.right + 16;
    if (x + W > innerWidth - 12) x = Math.max(12, r.left - W - 16);
    var y = Math.min(Math.max(86, r.top + r.height / 2 - H / 2), innerHeight - H - 12);
    /* positioned through custom properties folded into one transform, so moving
       between labels glides on the compositor instead of jumping via left/top */
    mini.style.setProperty('--mx', Math.round(x) + 'px');
    mini.style.setProperty('--my', Math.round(y) + 'px');
  }

  function fill(btn){
    var key = btn.dataset.img, src = key && IMG[key];
    mH.textContent = btn.textContent.trim();
    mP.textContent = btn.dataset.d || '';
    if (src){
      var isIllus = ILLUS.has(key);
      mini.classList.toggle('illus', isIllus);
      mTag.className = 'tag' + (isIllus ? ' soft' : '');
      mTag.textContent = isIllus ? 'Indicative illustration' : 'Treated at Ridhan';
      mNone.hidden = true; mImg.hidden = false;
      if (mImg.getAttribute('src') !== src){
        Promise.resolve(warm(src)).then(function(){ mImg.src = src; });
      }
    } else {
      mImg.hidden = true; mImg.removeAttribute('src'); mNone.hidden = false;
      mini.classList.remove('illus'); mTag.textContent = '';
    }
  }

  function show(btn){
    clearTimeout(hideTimer);
    var wasOn = mini.classList.contains('on');
    if (active && active !== btn) active.setAttribute('aria-expanded','false');
    active = btn;
    fill(btn);
    place(btn);
    if (wasOn){
      /* already open: replay the content entrance rather than the whole card's */
      mini.classList.remove('swap');
      void mini.offsetWidth;
      mini.classList.add('swap');
    } else {
      mini.classList.remove('swap');
    }
    mini.classList.add('on');
    mini.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
  }

  function hide(){
    mini.classList.remove('on','swap');
    mini.setAttribute('aria-hidden','true');
    if (active) active.setAttribute('aria-expanded','false');
    active = null;
  }
  /* a short grace period so sliding from one label to the next never closes
     and reopens the card -- that round trip was the janky part */
  function hideSoon(){ clearTimeout(hideTimer); hideTimer = setTimeout(hide, 180); }

  items.forEach(function(b){
    b.setAttribute('aria-expanded','false');
    b.addEventListener('mouseenter', function(){ show(b); });
    b.addEventListener('focus', function(){ show(b); });
    b.addEventListener('mouseleave', hideSoon);
    b.addEventListener('blur', hideSoon);
    b.addEventListener('click', function(e){ e.preventDefault(); active===b ? hide() : show(b); });
  });
  mini.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); });
  mini.addEventListener('mouseleave', hideSoon);
  addEventListener('scroll', function(){ if (active) place(active); }, { passive:true });
  addEventListener('keydown', function(e){ if (e.key === 'Escape') hide(); });

  /* ---------- appointment form: calendar, WhatsApp handoff ---------- */
  (function(){
    var form = document.getElementById('apptForm'); if (!form) return;
    var input = document.getElementById('f-day');
    var calBtn= document.getElementById('calBtn');
    var cal   = document.getElementById('cal');
    var grid  = document.getElementById('calGrid');
    var title = document.getElementById('calTitle');
    var warn  = document.getElementById('f-warn');
    var send  = document.getElementById('waSend');
    var NUM   = '916374496729';
    var touched = false;
    var MON   = ['January','February','March','April','May','June','July','August',
                 'September','October','November','December'];

    function startOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    var today = startOfDay(new Date());
    var limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 120);
    var chosen = null;                     // Date or null
    var view   = new Date(today.getFullYear(), today.getMonth(), 1);

    /* Sunday closed; nothing before today; nothing past the booking horizon */
    function closedReason(d){
      if (d < today) return 'past';
      if (d > limit) return 'far';
      if (d.getDay() === 0) return 'sunday';
      return null;
    }
    function fmt(d){
      return String(d.getDate()).padStart(2,'0') + ' / ' +
             String(d.getMonth()+1).padStart(2,'0') + ' / ' + d.getFullYear();
    }
    function longFmt(d){
      return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    }
    /* accepts 21/09/2026, 21-9-26, 21.09.2026, 2026-09-21 */
    function parse(str){
      var t = str.trim(); if (!t) return null;
      var iso = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      var dmy = t.match(/^(\d{1,2})\s*[-/.\s]\s*(\d{1,2})\s*[-/.\s]\s*(\d{2,4})$/);
      var y,m,d;
      if (iso){ y=+iso[1]; m=+iso[2]; d=+iso[3]; }
      else if (dmy){ d=+dmy[1]; m=+dmy[2]; y=+dmy[3]; if (y<100) y+=2000; }
      else return null;
      if (m<1||m>12||d<1||d>31) return null;
      var dt = new Date(y, m-1, d);
      if (dt.getFullYear()!==y || dt.getMonth()!==m-1 || dt.getDate()!==d) return null;
      return dt;
    }

    function render(){
      var y=view.getFullYear(), m=view.getMonth();
      title.textContent = MON[m] + ' ' + y;
      grid.innerHTML = '';
      var first = new Date(y,m,1);
      var lead = (first.getDay()+6)%7;                   // Monday-first
      for (var i=0;i<lead;i++){
        var pad=document.createElement('button'); pad.type='button';
        pad.className='pad'; pad.disabled=true; pad.tabIndex=-1; grid.appendChild(pad);
      }
      var days = new Date(y,m+1,0).getDate();
      for (var dnum=1; dnum<=days; dnum++){
        var d = new Date(y,m,dnum);
        var b = document.createElement('button');
        b.type='button'; b.textContent = dnum;
        var why = closedReason(d);
        if (why){
          b.disabled = true;
          b.title = why==='sunday' ? 'Closed on Sundays'
                  : why==='past'   ? 'Already passed' : 'Too far ahead';
        } else {
          b.setAttribute('aria-pressed', chosen && +chosen===+d ? 'true' : 'false');
          b.addEventListener('click', (function(dd){ return function(){
            chosen = dd; input.value = fmt(dd); close(); refresh();
          };})(d));
        }
        grid.appendChild(b);
      }
      var prev = cal.querySelector('[data-nav="-1"]');
      prev.disabled = (y===today.getFullYear() && m===today.getMonth());
      var next = cal.querySelector('[data-nav="1"]');
      next.disabled = (y===limit.getFullYear() && m===limit.getMonth());
    }
    function open(){ cal.hidden=false; calBtn.setAttribute('aria-expanded','true');
                     view = new Date((chosen||today).getFullYear(),(chosen||today).getMonth(),1);
                     render(); }
    function close(){ cal.hidden=true; calBtn.setAttribute('aria-expanded','false'); }

    calBtn.addEventListener('click', function(){ cal.hidden ? open() : close(); });
    cal.addEventListener('click', function(e){
      var nav = e.target.closest('[data-nav]'); if (!nav) return;
      view = new Date(view.getFullYear(), view.getMonth() + (+nav.dataset.nav), 1);
      render();
    });
    document.addEventListener('click', function(e){
      if (!cal.hidden && !cal.contains(e.target) && e.target !== calBtn) close();
    });
    addEventListener('keydown', function(e){ if (e.key==='Escape' && !cal.hidden) close(); });

    function refresh(){
      var msgs = [];
      var typed = input.value.trim();
      if (typed){
        var d = parse(typed);
        if (!d){ msgs.push('Use the calendar, or type the day as DD / MM / YYYY.'); chosen = null; }
        else {
          var why = closedReason(d);
          if (why==='past')   { msgs.push('That day has already passed.'); chosen=null; }
          else if (why==='far'){ msgs.push('Please choose a day within the next four months.'); chosen=null; }
          else if (why==='sunday'){ msgs.push('The clinic is closed on Sundays — choose another day.'); chosen=null; }
          else chosen = d;
        }
      } else chosen = null;

      var name = document.getElementById('f-name').value.trim();
      var phone= document.getElementById('f-phone').value.trim();
      var ready = name.length>1 && phone.replace(/\D/g,'').length>=7;
      send.setAttribute('aria-disabled', ready ? 'false' : 'true');
      /* don't scold an untouched form — only prompt once they've started */
      if (!ready && touched) msgs.push('Add your name and phone number to send on WhatsApp.');

      warn.hidden = msgs.length===0;
      warn.textContent = msgs.join(' ');

      var lines = [
        'Appointment request — Ridhan Skin, Hair & Child Clinic','',
        'Name: ' + (name||'—'),
        'Phone: ' + (phone||'—'),
        'For: ' + document.getElementById('f-who').value,
        'Preferred day: ' + (chosen ? longFmt(chosen) : 'Any'),
        'Preferred session: ' + document.getElementById('f-when').value
      ];
      var note = document.getElementById('f-note').value.trim();
      if (note) lines.push('', 'Concern: ' + note);
      send.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(lines.join('\n'));
    }
    /* A disabled button that does nothing when clicked tells the visitor nothing.
       Clicking it counts as touching the form, so the reason appears. */
    send.addEventListener('click', function(e){
      if (send.getAttribute('aria-disabled') === 'true'){
        e.preventDefault();
        touched = true; refresh();
        var first = document.getElementById('f-name');
        if (first && !first.value.trim()) first.focus({ preventScroll:true });
      }
    });
    form.addEventListener('input', function(){ touched = true; refresh(); });
    form.addEventListener('change', function(){ touched = true; refresh(); });
    form.addEventListener('submit', function(e){ e.preventDefault(); });
    refresh();
  })();

  /* flip cards respond to tap where there is no hover */
  if (matchMedia('(hover: none)').matches) {
    document.querySelectorAll('.gal .flip').forEach(function(card){
      card.addEventListener('click', function(){ card.classList.toggle('tapped'); });
    });
  }
  addEventListener('scroll', function(){ if (active) hide(); }, {passive:true});

  /* ---------- ambient WebGL light field ---------- */
  (function(){
    var cv = document.getElementById('glcanvas');
    if (!cv || typeof THREE === 'undefined'){ if(cv) cv.style.background='linear-gradient(140deg,#FBF3E2,#FDFCFA 45%,#F6EEDC)'; return; }
    var rnd; try { rnd = new THREE.WebGLRenderer({canvas:cv, antialias:false}); }
    catch(e){ cv.style.background='linear-gradient(140deg,#FBF3E2,#FDFCFA 45%,#F6EEDC)'; return; }
    rnd.setPixelRatio(Math.min(devicePixelRatio,1.75));
    var sc=new THREE.Scene(), cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    var u={uT:{value:0},uRes:{value:new THREE.Vector2(1,1)},uM:{value:new THREE.Vector2(.5,.5)}};
    sc.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), new THREE.ShaderMaterial({uniforms:u,
      vertexShader:'void main(){gl_Position=vec4(position,1.0);}',
      fragmentShader:[
      'precision highp float;uniform float uT;uniform vec2 uRes;uniform vec2 uM;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
      ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.0,a=0.5;mat2 r=mat2(0.8,-0.6,0.6,0.8);',
      ' for(int i=0;i<6;i++){v+=a*n(p);p=r*p*2.03;a*=0.5;}return v;}',
      'void main(){vec2 uv=gl_FragCoord.xy/uRes.xy;vec2 p=uv;p.x*=uRes.x/uRes.y;float t=uT*0.016;',
      ' vec2 q=vec2(fbm(p*1.5+vec2(0.0,t)),fbm(p*1.5+vec2(4.2,-t*0.8)));vec2 mo=(uM-0.5)*0.16;',
      ' vec2 r=vec2(fbm(p*1.9+q*2.1+mo+vec2(1.7,9.2)+t*0.35),fbm(p*1.9+q*2.1+mo+vec2(8.3,2.8)-t*0.28));',
      ' float f=fbm(p*1.4+r*1.6);vec3 ivory=vec3(0.992,0.988,0.980);vec3 cream=vec3(0.976,0.949,0.886);',
      ' vec3 gold=vec3(0.831,0.608,0.165);vec3 col=mix(ivory,cream,smoothstep(0.25,0.85,f));',
      ' float vein=smoothstep(0.56,0.88,f+0.22*r.x);col=mix(col,gold,vein*0.22);',
      ' col+=smoothstep(0.70,1.0,fbm(p*3.2-t*0.5+r))*0.04;',
      ' float vig=smoothstep(1.25,0.25,length(uv-0.5));col=mix(ivory,col,0.20+0.60*vig);',
      ' gl_FragColor=vec4(col+(h(gl_FragCoord.xy+uT)-0.5)*0.020,1.0);}'].join('\n')})));
    function size(){var w=cv.clientWidth||innerWidth,g=cv.clientHeight||innerHeight;
      rnd.setSize(w,g,false);u.uRes.value.set(w*rnd.getPixelRatio(),g*rnd.getPixelRatio());}
    size(); addEventListener('resize',size);
    var mx=.5,my=.5,cx=.5,cy=.5,vis=true,t0=performance.now();
    addEventListener('pointermove',function(e){mx=e.clientX/innerWidth;my=1-e.clientY/innerHeight;});
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;},{threshold:0})
      .observe(document.getElementById('hero'));
    if (REDUCED){ u.uT.value=12; rnd.render(sc,cam); }
    else (function loop(now){ requestAnimationFrame(loop); if(!vis) return;
      cx+=(mx-cx)*.045; cy+=(my-cy)*.045; u.uM.value.set(cx,cy);
      u.uT.value=(now-t0)/1000; rnd.render(sc,cam); })(t0);
  })();

  if (REDUCED || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  if (typeof Lenis !== 'undefined'){
    var l = new Lenis({duration:1.15, smoothWheel:true,
      easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t));}});
    window.__lenis = l;
    l.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(t){ l.raf(t*1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click',function(e){var el=document.querySelector(a.getAttribute('href'));
        if(el){e.preventDefault(); l.scrollTo(el,{offset:-70});}});
    });
  }

  gsap.to('#prog',{scaleX:1,ease:'none',
    scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:.25}});
  ScrollTrigger.create({start:'top -60',end:99999,
    onToggle:function(s){document.getElementById('nav').classList.toggle('solid',s.isActive);}});

  var bits = gsap.utils.toArray('[data-rv] > span');
  gsap.set(bits,{yPercent:112});
  gsap.to(bits,{yPercent:0,duration:1.25,ease:'expo.out',stagger:.085,delay:.15,
    onComplete:function(){
      document.querySelectorAll('#hero .rv').forEach(function(el){ el.style.overflow='visible'; });
    }});

  gsap.to('#heroVideo',{yPercent:8,scale:1.08,ease:'none',
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('#glcanvas',{yPercent:9,scale:1.06,ease:'none',
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});


  gsap.utils.toArray('[data-words]').forEach(function(el){
    if (el.dataset.split) return; el.dataset.split='1';
    var tmp=document.createElement('div'); tmp.innerHTML=el.innerHTML;
    (function wrap(node){ Array.prototype.slice.call(node.childNodes).forEach(function(c){
      if(c.nodeType===3){ var fr=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(w){
          if(!w) return;
          if(!w.trim()){ fr.appendChild(document.createTextNode(w)); return; }
          var s=document.createElement('span');
          s.className='word'; s.textContent=w; fr.appendChild(s);});
        node.replaceChild(fr,c);
      } else if(c.nodeType===1){ wrap(c); } }); })(tmp);
    el.innerHTML=tmp.innerHTML;
    gsap.from(el.querySelectorAll('.word'),{yPercent:78,autoAlpha:0,duration:.95,ease:'expo.out',
      stagger:.032,scrollTrigger:{trigger:el,start:'top 86%',once:true}});
  });

  gsap.utils.toArray('[data-mask]').forEach(function(el){
    gsap.fromTo(el,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.3,
      ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    var i=el.querySelector('img');
    if(i) gsap.fromTo(i,{scale:1.12},{scale:1,duration:1.6,ease:'expo.out',
      scrollTrigger:{trigger:el,start:'top 88%',once:true}});
  });
  gsap.utils.toArray('[data-mask-soft]').forEach(function(el){
    gsap.from(el,{y:32,autoAlpha:0,duration:.9,ease:'expo.out',
      scrollTrigger:{trigger:el,start:'top 92%',once:true}});
  });
  /* gallery cards sit on a strict grid — no per-card offset */
  ScrollTrigger.refresh();
})();
})();

/* ===== hair case gallery ===== */
(function(){
  var CASES = [
    { t:'Alopecia areata',
      d:'A defined patch of loss at the crown, treated medically over a course of review visits.',
      tag:'Before and after',
      imgs:[{src:'/assets/img/hair1_b.jpg',cap:'Alopecia areata \u2014 before'},
            {src:'/assets/img/hair1_a.jpg',cap:'Alopecia areata \u2014 after'}] },
    { t:'Pattern hair loss, crown',
      d:'Thinning across the vertex. Pattern, thyroid, iron and nutrition are checked before treatment is chosen.',
      tag:'Before and after',
      imgs:[{src:'/assets/img/hair2_b.jpg',cap:'Pattern hair loss \u2014 before'},
            {src:'/assets/img/hair2_a.jpg',cap:'Pattern hair loss \u2014 after'}] },
    { t:'Diffuse thinning',
      d:'Widened parting and visible scalp through the mid-scalp, followed up over a treatment course.',
      tag:'Before and after',
      imgs:[{src:'/assets/img/hair3_b.jpg',cap:'Diffuse thinning \u2014 before'},
            {src:'/assets/img/hair3_a.jpg',cap:'Diffuse thinning \u2014 after'}] },
    { t:'Advanced vertex thinning',
      d:'Photographed after the third GFC session with exosome therapy \u2014 growth factor concentrate prepared from the patient\u2019s own blood.',
      tag:'Before and after',
      imgs:[{src:'/assets/img/hair4_b.jpg',cap:'Vertex thinning \u2014 before'},
            {src:'/assets/img/hair4_a.jpg',cap:'After 3rd GFC \u2014 with exosome therapy'}] }
  ];

  var gal = document.getElementById('hairgal');
  if(!gal) return;
  var track = gal.querySelector('.hg-track'),
      dots  = gal.querySelector('.hg-dots'),
      count = gal.querySelector('.hg-count'),
      prev  = gal.querySelector('.hg-nav.prev'),
      next  = gal.querySelector('.hg-nav.next'),
      opener = null, idx = 0, built = false;

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function build(){
    if(built) return; built = true;
    track.innerHTML = CASES.map(function(c,i){
      var pair = c.imgs.map(function(im){
        return '<figure><span class="imgbox"><img src="'+im.src+'" alt="'+esc(im.cap)+'" loading="lazy"></span>'+
               '<figcaption>'+esc(im.cap)+'</figcaption></figure>'; }).join('');
      return '<div class="hg-slide" role="group" aria-roledescription="slide" '+
             'aria-label="Case '+(i+1)+' of '+CASES.length+'">'+
             '<div class="hg-pair'+(c.imgs.length===1?' single':'')+'">'+pair+'</div>'+
             '<div class="hg-meta"><h5>'+esc(c.t)+'</h5><p>'+esc(c.d)+'</p>'+
             '<span class="hg-tag">'+esc(c.tag)+'</span></div></div>'; }).join('');
    dots.innerHTML = CASES.map(function(c,i){
      return '<button type="button" role="tab" aria-selected="'+(i===0)+'" '+
             'aria-label="'+esc(c.t)+'"></button>'; }).join('');
    dots.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b) return;
      go([].indexOf.call(dots.children, b));
    });
    track.addEventListener('scroll', function(){
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if(i !== idx){ idx = i; sync(); }
    }, { passive:true });
  }

  function sync(){
    count.textContent = 'Case ' + (idx+1) + ' of ' + CASES.length;
    [].forEach.call(dots.children, function(b,i){ b.setAttribute('aria-selected', i===idx); });
    prev.disabled = idx === 0;
    next.disabled = idx === CASES.length - 1;
  }

  function go(i){
    idx = Math.max(0, Math.min(CASES.length-1, i));
    track.scrollTo({ left: idx * track.clientWidth, behavior:'smooth' });
    sync();
  }

  function open(btn){
    build(); opener = btn;
    gal.hidden = false;
    document.body.style.overflow = 'hidden';
    if(window.__lenis && window.__lenis.stop) window.__lenis.stop();
    idx = 0; track.scrollLeft = 0; sync();
    gal.querySelector('.hg-box').focus({preventScroll:true});
  }

  function close(){
    gal.hidden = true;
    document.body.style.overflow = '';
    if(window.__lenis && window.__lenis.start) window.__lenis.start();
    if(opener) opener.focus();
  }

  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-gallery="hair"]');
    if(b){ e.preventDefault(); e.stopPropagation(); open(b); return; }
    if(e.target.closest('#hairgal [data-close]')) close();
  });
  prev.addEventListener('click', function(){ go(idx-1); });
  next.addEventListener('click', function(){ go(idx+1); });
  document.addEventListener('keydown', function(e){
    if(gal.hidden) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowRight') go(idx+1);
    else if(e.key === 'ArrowLeft') go(idx-1);
  });
})();

/* ===== review ring =====
   The three middle cards are the spotlight; the rest sit behind on the same
   circle. One transform per card, so a move is a single compositor animation.
   Reviews come from /api/reviews (refreshed daily server-side); if that is not
   configured yet or fails, the cards already in the HTML are kept. */
(function(){
  var stage = document.getElementById('ringStage');
  if (!stage) return;
  var ring  = document.getElementById('revRing'),
      prev  = document.getElementById('ringPrev'),
      next  = document.getElementById('ringNext'),
      dots  = document.getElementById('ringDots'),
      live  = document.getElementById('ringLive'),
      rating= document.getElementById('gRating'),
      count = document.getElementById('gCount');

  var cards = [], index = 0, timer = null, held = false;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var STARS = '★★★★★';

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* How many cards sit in the spotlight: three on a wide screen, one on a phone
     where three would be unreadable. */
  function spotlight(){ return innerWidth <= 860 ? 0 : 1; }

  function layout(){
    var n = cards.length; if (!n) return;
    var spot = spotlight();
    var cw = parseFloat(getComputedStyle(stage).getPropertyValue('--ring-cw')) || 332;
    var gap = cw + (innerWidth <= 860 ? 14 : 22);
    cards.forEach(function(el, i){
      var o = i - index;
      if (o >  n/2) o -= n;          // always travel the short way round
      if (o < -n/2) o += n;
      var a = Math.abs(o), dir = o < 0 ? -1 : 1;
      var inSpot = a <= spot;
      // beyond the spotlight the cards bunch together instead of marching off screen
      var x = inSpot ? o * gap
                     : dir * (spot * gap + (a - spot) * gap * 0.30);
      var z = -a * 120;
      var rot = Math.max(-40, Math.min(40, -o * 16));
      var sc = Math.max(0.60, 1 - a * 0.085);
      var op = inSpot ? 1 : Math.max(0.10, 0.62 - (a - spot) * 0.18);
      el.style.transform = 'translate3d(' + Math.round(x) + 'px,0,' + Math.round(z) + 'px)' +
                           ' rotateY(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      el.style.opacity = op.toFixed(3);
      el.style.filter = inSpot ? 'none' : 'blur(' + Math.min(3.2, (a - spot) * 1.15).toFixed(2) + 'px)';
      el.style.zIndex = String(120 - Math.round(a * 10));
      el.classList.toggle('spot', inSpot);
      el.classList.toggle('lead', o === 0);
      el.setAttribute('aria-hidden', inSpot ? 'false' : 'true');
    });
    [].forEach.call(dots.children, function(b,i){ b.setAttribute('aria-selected', i === index); });
    if (live) live.textContent = 'Review ' + (index + 1) + ' of ' + n;
  }

  function go(i){
    var n = cards.length; if (!n) return;
    index = ((i % n) + n) % n;       // wrap both ways
    layout();
  }
  function step(d){ go(index + d); restart(); }

  function buildDots(){
    dots.innerHTML = cards.map(function(_,i){
      return '<button type="button" role="tab" aria-selected="' + (i===0) +
             '" aria-label="Review ' + (i+1) + '"></button>'; }).join('');
  }

  function cardHTML(r){
    // Only draw stars when the source actually supplied a per-review rating.
    // Defaulting to five would invent a rating the page cannot stand behind.
    var n = Number(r.rating);
    var stars = (n >= 1 && n <= 5)
      ? '<span class="stars" aria-hidden="true">' + STARS.slice(0, Math.round(n)) + '</span>'
      : '';
    var when = r.whenText ? ' · ' + esc(r.whenText) : '';
    return stars + '<p class="body">' + esc(r.body) + '</p>' +
           '<span class="who">' + esc(r.author) + ' · Google' + when + '</span>';
  }

  function collect(){
    cards = [].slice.call(stage.querySelectorAll('.rev'));
    cards.forEach(function(el,i){
      el.setAttribute('role','group');
      el.setAttribute('aria-roledescription','review');
      el.setAttribute('aria-label','Review ' + (i+1) + ' of ' + cards.length);
    });
    ring.classList.remove('no-ring');   // JS is running; the ring takes over
    buildDots(); go(0);
  }

  /* "2 months ago" from an ISO timestamp, to match how the listing reads */
  function ago(iso){
    var t = Date.parse(iso || ''); if (!t) return '';
    var d = Math.floor((Date.now() - t) / 86400000);
    if (d < 1)  return 'today';
    if (d < 14) return d + (d === 1 ? ' day ago' : ' days ago');
    if (d < 60) { var w = Math.round(d/7);  return w + (w === 1 ? ' week ago'  : ' weeks ago'); }
    if (d < 365){ var m = Math.round(d/30); return m + (m === 1 ? ' month ago' : ' months ago'); }
    var y = Math.round(d/365); return y + (y === 1 ? ' year ago' : ' years ago');
  }

  function render(list){
    stage.innerHTML = list.map(function(r){
      r.whenText = r.whenText || ago(r.when);
      return '<article class="rev">' + cardHTML(r) + '</article>'; }).join('');
    collect();
  }

  /* autoplay: slow, and never while someone is reading or the tab is hidden */
  function restart(){
    clearInterval(timer);
    if (reduce.matches || held || cards.length < 2) return;
    timer = setInterval(function(){ if (!document.hidden) go(index + 1); }, 7000);
  }
  function hold(v){ held = v; restart(); }

  prev.addEventListener('click', function(){ step(-1); });
  next.addEventListener('click', function(){ step(1); });
  dots.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    go([].indexOf.call(dots.children, b)); restart();
  });
  stage.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
  });
  ring.addEventListener('mouseenter', function(){ hold(true); });
  ring.addEventListener('mouseleave', function(){ hold(false); });
  ring.addEventListener('focusin',  function(){ hold(true); });
  ring.addEventListener('focusout', function(){ hold(false); });

  /* drag / swipe */
  var down = null;
  stage.addEventListener('pointerdown', function(e){ down = e.clientX; hold(true); });
  addEventListener('pointerup', function(e){
    if (down === null) return;
    var dx = e.clientX - down; down = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    hold(false);
  });

  addEventListener('resize', layout);
  reduce.addEventListener('change', restart);

  collect();
  restart();

  /* Swap in the live set once it arrives. Anything short of a usable payload
     leaves the built-in cards exactly as they are. */
  fetch('/api/reviews', { headers:{ accept:'application/json' } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      // Places caps at 5. The page already ships with ten real reviews, so only
      // take the live set when it is at least as large -- otherwise configuring
      // the API would silently cut the section from ten cards down to five.
      if (!d || !d.ok || !d.reviews || d.reviews.length < Math.max(3, cards.length)) return;
      render(d.reviews);
      if (rating && typeof d.rating === 'number') rating.textContent = d.rating.toFixed(1);
      if (count  && typeof d.total  === 'number') count.textContent  = String(d.total);
      // the snapshot date in the copy is only true until the live feed answers
      var when = document.getElementById('revWhen');
      if (when && d.fetchedAt){
        var dt = new Date(d.fetchedAt);
        if (!isNaN(dt)) when.textContent = 'Updated ' + dt.toLocaleDateString('en-GB',
          { day:'numeric', month:'long', year:'numeric' }) + '.';
      }
      restart();
    })
    .catch(function(){ /* keep the built-in cards */ });
})();

/* ===== phone number: dial on touch, copy/view on desktop =====
   `tel:` is a no-op on most desktop browsers, so every "Call the clinic" button
   appeared dead there. Touch devices keep the native link — that is what opens
   the dialer with the number already filled in. Desktops get a small panel with
   the number, a copy button and a WhatsApp alternative. */
(function(){
  var pop = document.getElementById('callpop');
  if (!pop) return;
  var links = [].slice.call(document.querySelectorAll('a[href^="tel:"]'));
  if (!links.length) return;

  var copyBtn = pop.querySelector('.cp-copy'),
      closeBtn = pop.querySelector('.cp-x'),
      numLink = pop.querySelector('.cp-num a');
  var NUMBER = (numLink.textContent || '').trim();
  var opener = null, doneTimer = null;

  /* A real pointer with hover is a desktop. Width would misjudge a small window
     on a laptop, and a touch laptop should still be able to dial. */
  function isDesktop(){
    return matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function place(el){
    var r = el.getBoundingClientRect();
    var w = pop.offsetWidth || 252, h = pop.offsetHeight || 150;
    var x = Math.round(r.left + r.width / 2 - w / 2);
    x = Math.max(12, Math.min(x, innerWidth - w - 12));
    var below = r.bottom + 10;
    var y = (below + h > innerHeight - 12) ? Math.max(12, r.top - h - 10) : below;
    pop.style.left = x + 'px';
    pop.style.top = Math.round(y) + 'px';
  }

  function open(el){
    opener = el;
    pop.hidden = false;
    place(el);                    // measure once visible, before the transition
    void pop.offsetWidth;
    pop.classList.add('on');
    el.setAttribute('aria-expanded', 'true');
    closeBtn.focus({ preventScroll: true });
  }

  function close(){
    if (pop.hidden) return;
    pop.classList.remove('on');
    if (opener){ opener.setAttribute('aria-expanded', 'false'); }
    var was = opener; opener = null;
    setTimeout(function(){ if (!pop.classList.contains('on')) pop.hidden = true; }, 280);
    if (was) try { was.focus({ preventScroll: true }); } catch (e) {}
  }

  links.forEach(function(a){
    a.setAttribute('aria-expanded', 'false');
    a.addEventListener('click', function(e){
      if (!isDesktop()) return;   // phones and tablets dial natively
      e.preventDefault();
      if (opener === a) { close(); return; }
      open(a);
    });
  });

  copyBtn.addEventListener('click', function(){
    function done(){
      copyBtn.classList.add('done');
      copyBtn.textContent = 'Copied';
      clearTimeout(doneTimer);
      doneTimer = setTimeout(function(){
        copyBtn.classList.remove('done');
        copyBtn.textContent = 'Copy number';
      }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(NUMBER).then(done, fallback);
    } else fallback();

    function fallback(){
      /* older browsers, and any context where the async clipboard is blocked */
      var ta = document.createElement('textarea');
      ta.value = NUMBER;
      ta.setAttribute('readonly','');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (err){ copyBtn.textContent = 'Select and copy'; }
      document.body.removeChild(ta);
    }
  });

  closeBtn.addEventListener('click', close);
  document.addEventListener('click', function(e){
    if (pop.hidden || !opener) return;
    if (pop.contains(e.target) || e.target.closest('a[href^="tel:"]')) return;
    close();
  });
  addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  addEventListener('resize', function(){ if (opener) place(opener); });
  addEventListener('scroll', function(){ if (opener) place(opener); }, { passive:true });
})();
