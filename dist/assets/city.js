import"./global.js";async function y(){await loadStudiosData();const n=new URLSearchParams(window.location.search),s=n.get("state"),i=n.get("city");document.querySelectorAll(".city-name").forEach(e=>{e.textContent=i||"[City Name]"});const r=allStudiosData.find(e=>e.state===s);if(!r){document.getElementById("city-studios").innerHTML="<p>State not found.</p>";return}const a=document.getElementById("city-studios"),t=r.studios.filter(e=>e.city===i);if(t.length===0){a.innerHTML="<p>No studios found for this city.</p>";return}h(t,s),v()}function h(n,s){const i=document.getElementById("city-studios"),r={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Barre:"🩰",Tower:"🗼",Free_Trial:"🎟️"},a={};n.forEach(t=>{Object.entries(t.criteria||{}).forEach(([e,c])=>{c&&(a[e]=(a[e]||0)+1)})}),document.querySelectorAll(".filter-btn").forEach(t=>{const e=t.dataset.criteria,c=a[e]||0,[l,d]=t.textContent.split(" ");t.innerHTML=`
            ${l}
                <span class="filter-name">${d}</span>
                        <span class="filter-count">(${c})</span>
        `}),n.forEach(t=>{var m;const e=document.createElement("a");e.classList.add("studio-card"),e.href=`studio.html?state=${encodeURIComponent(s)}&city=${encodeURIComponent(t.city)}&name=${encodeURIComponent(t.name)}`;const c=(m=t.criteria)!=null&&m.Reformer?"Reformer Pilates":"Classical Pilates",l=t.number_of_reviews||0,d=Object.entries(t.criteria||{}).filter(([o,f])=>f).map(([o])=>o.replace("_"," ")).join(", "),u=`${t.name} is a ${c} studio located in ${t.city}, ${s} with a ${t.rating||"N/A"} star rating from ${l} reviews. This establishment is offering ${d||"various pilates services"}.`,p=u.length>110?u.substring(0,109)+"...":u;e.innerHTML=`
            <div class="studio-image">
                <img src="${t.photo_url||"./assets/default-studio.jpg"}" alt="${t.name}" 
                     onerror="this.src='./assets/default-studio.jpg'">
                <div class="rating-container">
                    ⭐ ${t.rating||"N/A"} (${l})
                </div>
            </div>
            <div class="studio-info">
                <h3>${t.name}</h3>
                <div class="studio-type">${c}</div>
                <div class="criteria">
                    ${Object.entries(t.criteria||{}).filter(([o,f])=>f).map(([o])=>`<span class="criteria-badge city-criteria">${r[o]}</span>`).join("")}
                </div>
                <p class="description">${p}</p>
                <span class="view-details-link">View details</span>
            </div>
        `,i.appendChild(e)})}function v(){document.querySelectorAll(".filter-btn").forEach(s=>{s.addEventListener("click",function(){this.classList.toggle("active"),$()})})}function $(){const n=Array.from(document.querySelectorAll(".filter-btn.active")).map(i=>i.dataset.criteria);document.querySelectorAll(".studio-card").forEach(i=>{if(n.length===0){i.style.display="flex";return}const r=n.every(a=>i.querySelector(`.criteria-badge[title="${a}"]`));i.style.display=r?"flex":"none"})}document.addEventListener("DOMContentLoaded",()=>{y()});
