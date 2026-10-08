import{l as h}from"./global.js";const p={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Free_Trial:"🎟️",Barre:"🩰",Tower:"🗼"};function u(a){return a?a.toLowerCase().trim():""}document.addEventListener("DOMContentLoaded",async()=>{const a=document.getElementById("cities-list"),s=new URLSearchParams(window.location.search).get("state");if(!s){window.location.href="/states";return}const c=await h();if(!c||!Array.isArray(c)){a.innerHTML="<p>Error loading data. Please try again later.</p>";return}const l=c.find(t=>u(t.state)===u(s));if(!l){a.innerHTML=`<p>${s} not found.</p>`;return}const o=l.state;document.title=`Pilates Finder - ${o}`,document.querySelector(".hero-content h1").textContent=`Pilates Studios in ${o}`,document.querySelector(".hero-content p").textContent=`Discover the best pilates studios in ${o} with our comprehensive directory`,document.querySelector(".section-header h2").textContent=`Cities in ${o}`;const r={};l.studios.forEach(t=>{r[t.city]||(r[t.city]={name:t.city,totalStudios:0,criteriaCounts:{}});const n=r[t.city];n.totalStudios++,Object.entries(t.criteria||{}).forEach(([e,i])=>{i&&p[e]&&(n.criteriaCounts[e]=(n.criteriaCounts[e]||0)+1)})});const m=Object.values(r).sort((t,n)=>t.name.localeCompare(n.name));document.querySelector(".section-header p").textContent=`Explore pilates locations across ${m.length} cities in ${o}`,m.forEach(t=>{const n=Object.entries(t.criteriaCounts).sort((i,d)=>d[1]-i[1]).slice(0,3),e=document.createElement("a");e.classList.add("city-card"),e.href=`/city?state=${encodeURIComponent(o)}&city=${encodeURIComponent(t.name)}`,e.innerHTML=`
            <h3>${t.name}</h3>
            <p>${t.totalStudios} pilates ${t.totalStudios===1?"location":"locations"}</p>
            <div class="criteria">
                ${n.map(([i,d])=>`
                    <div class="criteria-item">
                        <span class="emoji">${p[i]}</span>
                        <span class="name">${i.replace("_"," ")}</span>
                        <span class="count">(${d})</span>
                    </div>`).join("")}
            </div>
        `,a.appendChild(e)})});
