import"./styles.js";import{l as S}from"./global.js";let f=null;document.addEventListener("DOMContentLoaded",async()=>{const y={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Free_Trial:"🎟️",Barre:"🩰",Tower:"🗼"};if(f=await S(),!f){console.error("Failed to load studios data");return}const d=document.querySelector(".search-bar"),h=document.getElementById("results");d&&d.addEventListener("input",()=>{const e=d.value.toLowerCase(),i=[];f.forEach(t=>{t.studios.forEach(s=>{(s.name.toLowerCase().includes(e)||s.city.toLowerCase().includes(e)||t.state.toLowerCase().includes(e))&&i.push(s)})}),h&&(h.innerHTML=i.length?i.map(t=>`
                        <div class="studio-card">
                            <h3>${t.name}</h3>
                            <p>${t.city}, ${t.state}</p>
                            <a href="studios.html?id=${t.id}" class="view-details-link">View Details</a>
                        </div>
                    `).join(""):"<p>No results found.</p>")});const v=document.getElementById("featured-cities-list");[{city:"San Diego",state:"California"},{city:"Reno",state:"Nevada"},{city:"Los Angeles",state:"California"},{city:"Miami",state:"Florida"},{city:"Wilmington",state:"Delaware"},{city:"New York City",state:"New York"}].slice(0,6).forEach(({city:e,state:i})=>{const t=f.find(n=>n.state===i);if(!t)return;const s=t.studios.filter(n=>n.city===e),o=s.length,r={};s.forEach(n=>{Object.entries(n.criteria).forEach(([l,m])=>{y[l]&&m&&(r[l]=(r[l]||0)+1)})});const c=Object.entries(r).sort((n,l)=>l[1]-n[1]).slice(0,3).map(([n,l])=>({criterion:n.replace("_"," "),count:l,emoji:y[n]||""})),u=document.createElement("a");u.classList.add("city-card"),u.href=`city.html?state=${encodeURIComponent(i)}&city=${encodeURIComponent(e)}`,u.innerHTML=`
            <h3>${e}</h3>
            <p>${o} pilates locations</p>
            <div class="criteria">
                ${c.map(({emoji:n,criterion:l,count:m})=>`<div class="criteria-item">${n} ${l} (${m})</div>`).join("")}
            </div>
        `,v&&v.appendChild(u)});const g=document.querySelector(".find-near-me");g&&g.addEventListener("click",()=>{if(!navigator.geolocation){alert("Geolocation is not supported by your browser.");return}navigator.geolocation.getCurrentPosition(e=>{const{latitude:i,longitude:t}=e.coords;let s=null,o=1/0;f.forEach(r=>{r.studios.forEach(c=>{if(c.latitude&&c.longitude){const u=Math.sqrt(Math.pow(i-c.latitude,2)+Math.pow(t-c.longitude,2));u<o&&(o=u,s=c)}})}),s?window.location.href=`city.html?state=${s.state}&city=${s.city}`:alert("No nearby studios found.")})}),document.querySelector(".cta-button").addEventListener("click",function(e){const i=this,t=document.createElement("span"),s=i.getBoundingClientRect(),o=e.clientX-s.left,r=e.clientY-s.top;t.style.cssText=`
            position: absolute;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            left: ${o}px;
            top: ${r}px;
            transform: scale(0);
            pointer-events: none;
        `,i.appendChild(t),requestAnimationFrame(()=>{t.style.transform="scale(10)",t.style.opacity="0",t.style.transition="transform 0.6s, opacity 0.6s",setTimeout(()=>{t.remove()},600)})});const E=document.querySelectorAll(".faq-question");E.forEach(e=>{e.addEventListener("click",()=>{const i=e.getAttribute("aria-expanded")==="true",t=e.nextElementSibling;E.forEach(s=>{if(s!==e){s.setAttribute("aria-expanded","false"),s.querySelector("i").className="fas fa-plus";const o=s.nextElementSibling;o.hidden=!0}}),e.setAttribute("aria-expanded",!i),e.querySelector("i").className=i?"fas fa-plus":"fas fa-minus",t.hidden=i,i?(t.style.maxHeight="0",t.style.opacity="0",setTimeout(()=>{t.style.display="none"},300)):(t.style.display="block",setTimeout(()=>{t.style.maxHeight=t.scrollHeight+"px",t.style.opacity="1"},10))})});const a=document.createElement("div");a.className="search-results-dropdown",d.parentNode.appendChild(a);const w=(await(await fetch("/pilates_studios.json")).json()).flatMap(e=>[{type:"city",city:e.city,state:e.state,url:`cities.html?state=${encodeURIComponent(e.state)}&city=${encodeURIComponent(e.city)}`},...e.studios.map(i=>({type:"studio",name:i.name,city:e.city,state:e.state,url:`studio.html?studio=${i.id}`}))]),L={keys:["name","city","state"],threshold:.3,distance:100},C=new Fuse(w,L);d.addEventListener("input",e=>{const i=e.target.value;if(i.length<2){a.classList.remove("active");return}const t=C.search(i).slice(0,6);t.length>0?(a.innerHTML=t.map(({item:s})=>`
                <a href="${s.url}" class="search-result-item" role="option">
                    <span class="search-result-icon">
                        <i class="fas ${s.type==="city"?"fa-city":"fa-dumbbell"}"></i>
                    </span>
                    <div class="search-result-content">
                        <div class="search-result-title">${s.name||s.city}</div>
                        <div class="search-result-subtitle">
                            ${s.type==="studio"?`${s.city}, ${s.state}`:s.state}
                        </div>
                    </div>
                </a>
            `).join(""),a.classList.add("active")):(a.innerHTML='<div class="search-result-item">No results found</div>',a.classList.add("active"))}),document.addEventListener("click",e=>{!d.contains(e.target)&&!a.contains(e.target)&&a.classList.remove("active")}),d.addEventListener("keydown",e=>{var s,o,r,c;if(!a.classList.contains("active"))return;const i=a.querySelectorAll(".search-result-item"),t=a.querySelector(".search-result-item:focus");e.key==="ArrowDown"?(e.preventDefault(),t?(o=t.nextElementSibling)==null||o.focus():(s=i[0])==null||s.focus()):e.key==="ArrowUp"&&(e.preventDefault(),t?(c=t.previousElementSibling)==null||c.focus():(r=i[i.length-1])==null||r.focus())});const $={root:null,rootMargin:"0px",threshold:.1},b=new IntersectionObserver(e=>{e.forEach(i=>{i.isIntersecting&&(i.target.classList.add("fade-in"),b.unobserve(i.target))})},$);document.querySelectorAll(".type-card, .why-pilates-content, .faq-item").forEach(e=>{b.observe(e)});const p=document.createElement("div");p.className="section-header index-page",p.innerHTML=`
        <h2>Explore Pilates by Location</h2>
        <a href="/states" class="view-all-link">Explore Pilates Studios by States -></a>
    `,document.body.insertBefore(p,document.body.firstChild)});
