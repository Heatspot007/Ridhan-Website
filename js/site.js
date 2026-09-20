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
  var active = null;
  function show(btn){
    active = btn;
    var key = btn.dataset.img, src = key && IMG[key];
    mH.textContent = btn.textContent.trim();
    mP.textContent = btn.dataset.d || '';
    if (src){
      mImg.src = src; mImg.hidden = false; mNone.hidden = true;
      var isIllus = ILLUS.has(key);
      mini.classList.toggle('illus', isIllus);
      mTag.className = 'tag' + (isIllus ? ' soft' : '');
      mTag.textContent = isIllus ? 'Indicative illustration' : 'Treated at Ridhan';
    }
    else { mImg.hidden = true; mImg.removeAttribute('src'); mNone.hidden = false;
      mini.classList.remove('illus'); mTag.textContent = ''; }
    var r = btn.getBoundingClientRect(), W = 336, H = mini.offsetHeight || 340;
    var x = r.right + 16;
    if (x + W > innerWidth - 12) x = Math.max(12, r.left - W - 16);
    var y = Math.min(Math.max(86, r.top + r.height/2 - H/2), innerHeight - H - 12);
    mini.style.left = x + 'px'; mini.style.top = y + 'px';
    mini.classList.add('on'); mini.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
  }
  function hide(){
    mini.classList.remove('on'); mini.setAttribute('aria-hidden','true');
    if (active) active.setAttribute('aria-expanded','false');
    active = null;
  }
  items.forEach(function(b){
    b.setAttribute('aria-expanded','false');
    b.addEventListener('mouseenter', function(){ show(b); });
    b.addEventListener('focus', function(){ show(b); });
    b.addEventListener('mouseleave', hide);
    b.addEventListener('blur', hide);
    b.addEventListener('click', function(e){ e.preventDefault(); active===b ? hide() : show(b); });
  });
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
          var s=document.createElement('span');
          if(!w.trim()){ s.className='sp'; } else { s.className='word'; }
          s.textContent=w; fr.appendChild(s);});
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
