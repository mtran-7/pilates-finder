import{l as m}from"./global.js";document.addEventListener("DOMContentLoaded",async()=>{const s=await m();if(console.log("Loaded data:",s),!s||!Array.isArray(s)){const t=document.getElementById("states-list");t&&(t.innerHTML="<p>Error loading states data. Please try again later.</p>");return}const i=document.getElementById("states-list");if(!i){console.error("States list container not found.");return}const c={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Free_Trial:"🎟️",Barre:"🩰",Tower:"🗼"},d=s.length,l=document.querySelector(".section-header p");l&&(l.textContent=`Explore pilates locations across ${d} states`),s.sort((t,n)=>t.state.localeCompare(n.state)).forEach(t=>{const n={};t.studios.forEach(a=>{Object.entries(a.criteria).forEach(([e,r])=>{c[e]&&r&&(n[e]=(n[e]||0)+1)})});const p=Object.entries(n).sort((a,e)=>e[1]-a[1]).slice(0,3).map(([a,e])=>({name:a,count:e,emoji:c[a]})),o=document.createElement("a");o.classList.add("state-card"),o.href=`/cities?state=${encodeURIComponent(t.state)}`,o.innerHTML=`
            <h3>${t.state.replace(/[\\[\\]]/g,"")}</h3>
            <p>${t.studios.length} pilates studios</p>
            <div class="criteria">
                ${p.map(({emoji:a,name:e,count:r})=>`
                        <div class="criteria-item">
                            <span class="emoji">${a}</span>
                            <span class="name">${e.replace("_"," ")}</span>
                            <span class="count">(${r})</span>
                        </div>
                    `).join("")}
            </div>
        `,i.appendChild(o)})});
