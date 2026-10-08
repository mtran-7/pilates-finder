import{l as E}from"./global.js";let f=null;document.addEventListener("DOMContentLoaded",async()=>{var g;const m={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Free_Trial:"🎟️",Barre:"🩰",Tower:"🗼"};if(f=await E(),!f){console.error("Failed to load studios data");return}const u=document.querySelector(".search-bar"),p=document.getElementById("featured-cities-list");[{city:"San Diego",state:"California"},{city:"Reno",state:"Nevada"},{city:"Los Angeles",state:"California"},{city:"Miami",state:"Florida"},{city:"Wilmington",state:"Delaware"},{city:"New York City",state:"New York"}].slice(0,6).forEach(({city:e,state:i})=>{const a=f.find(c=>c.state===i);if(!a)return;const o=a.studios.filter(c=>c.city===e),t=o.length,r={};o.forEach(c=>{Object.entries(c.criteria).forEach(([l,d])=>{m[l]&&d&&(r[l]=(r[l]||0)+1)})});const s=Object.entries(r).sort((c,l)=>l[1]-c[1]).slice(0,3).map(([c,l])=>({criterion:c.replace("_"," "),count:l,emoji:m[c]||""})),n=document.createElement("a");n.classList.add("city-card"),n.href=`/city?state=${encodeURIComponent(i)}&city=${encodeURIComponent(e)}`,n.innerHTML=`
            <h3>${e}</h3>
            <p>${t} pilates locations</p>
            <div class="criteria">
                ${s.map(({emoji:c,criterion:l,count:d})=>`<div class="criteria-item">${c} ${l} (${d})</div>`).join("")}
            </div>
        `,p&&p.appendChild(n)});const y=document.querySelector(".find-near-me");y&&y.addEventListener("click",()=>{if(!navigator.geolocation){alert("Geolocation is not supported by your browser.");return}navigator.geolocation.getCurrentPosition(e=>{const{latitude:i,longitude:a}=e.coords;let o=null,t=1/0;f.forEach(r=>{r.studios.forEach(s=>{if(s.latitude&&s.longitude){const n=Math.sqrt(Math.pow(i-s.latitude,2)+Math.pow(a-s.longitude,2));n<t&&(t=n,o=s)}})}),o?window.location.href=`/city?state=${encodeURIComponent(o.state)}&city=${encodeURIComponent(o.city)}`:alert("No nearby studios found.")})}),(g=document.querySelector(".cta-button"))==null||g.addEventListener("click",function(e){const i=this,a=document.createElement("span"),o=i.getBoundingClientRect(),t=e.clientX-o.left,r=e.clientY-o.top;a.style.cssText=`
            position: absolute;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            left: ${t}px;
            top: ${r}px;
            transform: scale(0);
            pointer-events: none;
        `,i.appendChild(a),requestAnimationFrame(()=>{a.style.transform="scale(10)",a.style.opacity="0",a.style.transition="transform 0.6s, opacity 0.6s",setTimeout(()=>{a.remove()},600)})});const h=document.querySelectorAll(".faq-question");if(h.forEach(e=>{e.addEventListener("click",()=>{const i=e.getAttribute("aria-expanded")==="true",a=e.nextElementSibling;h.forEach(o=>{if(o!==e){o.setAttribute("aria-expanded","false"),o.querySelector("i").className="fas fa-plus";const t=o.nextElementSibling;t.hidden=!0}}),e.setAttribute("aria-expanded",!i),e.querySelector("i").className=i?"fas fa-plus":"fas fa-minus",a.hidden=i,i?(a.style.maxHeight="0",a.style.opacity="0",setTimeout(()=>{a.style.display="none"},300)):(a.style.display="block",setTimeout(()=>{a.style.maxHeight=a.scrollHeight+"px",a.style.opacity="1"},10))})}),u&&typeof Fuse<"u"){const e=document.createElement("div");e.className="search-results-dropdown",u.parentNode.appendChild(e);const i=f.flatMap(t=>[...[...new Set(t.studios.map(s=>s.city))].map(s=>({type:"city",city:s,state:t.state,url:`/city?state=${encodeURIComponent(t.state)}&city=${encodeURIComponent(s)}`})),...t.studios.map(s=>({type:"studio",name:s.name,city:s.city,state:t.state,url:`/studio?state=${encodeURIComponent(t.state)}&city=${encodeURIComponent(s.city)}&name=${encodeURIComponent(s.name)}`}))]),a={keys:["name","city","state"],threshold:.3,distance:100},o=new Fuse(i,a);u.addEventListener("input",t=>{const r=t.target.value;if(r.length<2){e.classList.remove("active");return}const s=o.search(r).slice(0,6);s.length>0?(e.innerHTML=s.map(({item:n})=>`
                <a href="${n.url}" class="search-result-item" role="option">
                    <span class="search-result-icon">
                        <i class="fas ${n.type==="city"?"fa-city":"fa-dumbbell"}"></i>
                    </span>
                    <div class="search-result-content">
                        <div class="search-result-title">${n.name||n.city}</div>
                        <div class="search-result-subtitle">
                            ${n.type==="studio"?`${n.city}, ${n.state}`:n.state}
                        </div>
                    </div>
                </a>
            `).join(""),e.classList.add("active")):(e.innerHTML='<div class="search-result-item">No results found</div>',e.classList.add("active"))}),document.addEventListener("click",t=>{!u.contains(t.target)&&!e.contains(t.target)&&e.classList.remove("active")}),u.addEventListener("keydown",t=>{var n,c,l,d;if(!e.classList.contains("active"))return;const r=e.querySelectorAll(".search-result-item"),s=e.querySelector(".search-result-item:focus");t.key==="ArrowDown"?(t.preventDefault(),s?(c=s.nextElementSibling)==null||c.focus():(n=r[0])==null||n.focus()):t.key==="ArrowUp"&&(t.preventDefault(),s?(d=s.previousElementSibling)==null||d.focus():(l=r[r.length-1])==null||l.focus())})}const b={root:null,rootMargin:"0px",threshold:.1},v=new IntersectionObserver(e=>{e.forEach(i=>{i.isIntersecting&&(i.target.classList.add("fade-in"),v.unobserve(i.target))})},b);if(document.querySelectorAll(".type-card, .why-pilates-content, .faq-item").forEach(e=>{v.observe(e)}),p){const e=document.createElement("div");e.className="section-header index-page",e.innerHTML=`
            <h2>Explore Pilates by Location</h2>
            <a href="/states" class="view-all-link">Explore Pilates Studios by States -></a>
        `,document.body.insertBefore(e,document.body.firstChild)}});
