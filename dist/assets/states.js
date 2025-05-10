import{l as h}from"./global.js";function E(m){return m.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}document.addEventListener("DOMContentLoaded",async()=>{const r=new URLSearchParams(window.location.search).get("state");r&&(document.getElementById("hero-title").textContent=`Pilates in ${r}`,document.getElementById("hero-subtitle").textContent=`Explore pilates studios across ${r}`,document.getElementById("explore-title").textContent=`Browse ${r}`);const i={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Free_Trial:"🎟️",Barre:"🩰",Tower:"🗼"},c=document.getElementById("states-list");if(!c)return;const l=await h();if(!l||!Array.isArray(l)){console.error("Failed to load studios data"),c.innerHTML="<p>Error loading states data. Please try again later.</p>";return}const p={};l.forEach(a=>{p[a.state]=a.studios}),Object.entries(p).sort(([a],[s])=>a.localeCompare(s)).forEach(([a,s])=>{const n={};s.forEach(e=>{Object.entries(e.criteria).forEach(([t,d])=>{i[t]&&d&&(n[t]=(n[t]||0)+1)})}),Object.entries(n).sort((e,t)=>t[1]-e[1]).slice(0,3).map(([e,t])=>({criterion:e.replace("_"," "),count:t,emoji:i[e]||""}));const o=document.createElement("a");o.classList.add("state-card"),o.href=`/${E(a)}`;const u=Object.entries(n).sort((e,t)=>t[1]-e[1]).slice(0,3).map(([e,t])=>({name:e,count:t,emoji:i[e]}));o.innerHTML=`
                <h3>${a.replace(/[\[\]]/g,"")}</h3>
                <p>${s.length} pilates studios</p>
                <div class="criteria">
                    ${u.map(({emoji:e,name:t,count:d})=>`
                            <div class="criteria-item">
                                <span class="emoji">${e}</span>
                                <span class="name">${t.replace("_"," ")}</span>
                                <span class="count">(${d})</span>
                            </div>
                        `).join("")}
                </div>
            `,c.appendChild(o)})});
