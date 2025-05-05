import"./styles.js";import"./global.js";const u={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Free_Trial:"🎟️",Barre:"🩰",Tower:"🗼"};function l(n){return n.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}document.addEventListener("DOMContentLoaded",async()=>{await loadStudiosData();const n=window.location.pathname.split("/")[1],o=decodeURIComponent(n).replace(/[\[\]]/g,"");document.querySelector(".hero-content h1").textContent=`Pilates Studios in ${o}`,document.querySelector(".hero-content p").textContent=`Discover the best pilates studios in ${o} with our comprehensive directory`,document.querySelector(".section-header h2").textContent=`Cities in ${o}`;const c=allStudiosData.find(t=>t.state===n);if(!c){document.getElementById("cities-list").innerHTML="<p>State not found.</p>";return}const d=document.getElementById("cities-list"),i={};c.studios.forEach(t=>{i[t.city]||(i[t.city]={name:t.city,totalStudios:0,criteria:new Set}),i[t.city].totalStudios++,Object.entries(t.criteria).forEach(([a,s])=>{s&&i[t.city].criteria.add(a)})});const p=Object.keys(i).length;document.querySelector(".section-header p").textContent=`Explore pilates locations across ${p} cities in ${o}`,Object.values(i).forEach(t=>{const a=document.createElement("a");a.classList.add("city-card"),a.href=`/${l(n)}/${l(t.name)}`;const s=c.studios.filter(e=>e.city===t.name),m=Array.from(t.criteria).map(e=>({name:e,count:s.filter(r=>r.criteria[e]).length}));a.innerHTML=`
            <div class="city-card-inner">
                <h3>${t.name}</h3>
                <p>${t.totalStudios} pilates locations</p>
                <div class="criteria">
                    ${m.slice(0,3).map(({name:e,count:r})=>`<div class="criteria-item">
                                <span class="emoji">${u[e]}</span>
                                <span class="name">${e.replace("_"," ")}</span>
                                <span class="count">(${r})</span>
                            </div>`).join("")}
                </div>
            </div>
        `,d.appendChild(a)})});
