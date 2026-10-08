import{l as y}from"./global.js";const h={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Barre:"🩰",Tower:"🗼",Free_Trial:"🎟️"};function l(e){return e?e.toLowerCase().trim():""}async function $(){const e=document.getElementById("city-studios"),r=new URLSearchParams(window.location.search),o=r.get("state"),n=r.get("city");if(!o||!n){window.location.href="/states";return}document.querySelectorAll(".city-name").forEach(a=>{a.textContent=n}),document.title=`Pilates Studios in ${n} | Pilates Finder`;const t=await y();if(!t||!Array.isArray(t)){e.innerHTML="<p>Error loading data. Please try again later.</p>";return}const i=t.find(a=>l(a.state)===l(o));if(!i){e.innerHTML=`<p>${o} not found.</p>`;return}const s=i.studios.filter(a=>l(a.city)===l(n));if(s.length===0){e.innerHTML="<p>No studios found for this city.</p>";return}g(s,i.state),v()}function g(e,r){const o=document.getElementById("city-studios"),n={};e.forEach(t=>{Object.entries(t.criteria||{}).forEach(([i,s])=>{s&&(n[i]=(n[i]||0)+1)})}),document.querySelectorAll(".filter-btn").forEach(t=>{const i=t.dataset.criteria,s=n[i]||0,[a,...d]=t.textContent.trim().split(" ");t.innerHTML=`
            ${a}
            <span class="filter-name">${d.join(" ")}</span>
            <span class="filter-count">(${s})</span>
        `}),e.forEach(t=>{var m;const i=document.createElement("a");i.classList.add("studio-card"),i.href=`/studio?state=${encodeURIComponent(r)}&city=${encodeURIComponent(t.city)}&name=${encodeURIComponent(t.name)}`;const s=(m=t.criteria)!=null&&m.Reformer?"Reformer Pilates":"Classical Pilates",a=t.number_of_reviews||0,d=Object.entries(t.criteria||{}).filter(([c,f])=>f).map(([c])=>c.replace("_"," ")).join(", "),u=`${t.name} is a ${s} studio located in ${t.city}, ${r} with a ${t.rating||"N/A"} star rating from ${a} reviews. This establishment is offering ${d||"various pilates services"}.`,p=u.length>110?u.substring(0,109)+"...":u;i.innerHTML=`
            <div class="studio-image">
                <img src="${t.photo_url||"/assets/default-studio.jpg"}" alt="${t.name}"
                     onerror="this.onerror=null;this.src='/assets/default-studio.jpg'">
                <div class="rating-container">
                    ⭐ ${t.rating||"N/A"} (${a})
                </div>
            </div>
            <div class="studio-info">
                <h3>${t.name}</h3>
                <div class="studio-type">${s}</div>
                <div class="criteria">
                    ${Object.entries(t.criteria||{}).filter(([c,f])=>f).map(([c])=>`<span class="criteria-badge city-criteria" title="${c}">${h[c]}</span>`).join("")}
                </div>
                <p class="description">${p}</p>
                <span class="view-details-link">View details</span>
            </div>
        `,o.appendChild(i)})}function v(){document.querySelectorAll(".filter-btn").forEach(e=>{e.addEventListener("click",function(){this.classList.toggle("active"),C()})})}function C(){const e=Array.from(document.querySelectorAll(".filter-btn.active")).map(r=>r.dataset.criteria);document.querySelectorAll(".studio-card").forEach(r=>{if(e.length===0){r.style.display="flex";return}const o=e.every(n=>r.querySelector(`.criteria-badge[title="${n}"]`));r.style.display=o?"flex":"none"})}document.addEventListener("DOMContentLoaded",()=>{$()});
