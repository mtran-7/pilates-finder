import"./styles.js";import"./global.js";document.addEventListener("DOMContentLoaded",async()=>{await loadStudiosData();const e=window.location.pathname.split("/").filter(Boolean);let s,n,t;if(e.length===3)[s,n,t]=e,s=decodeURIComponent(s),n=decodeURIComponent(n),t=decodeURIComponent(t);else{const i=new URLSearchParams(window.location.search);s=i.get("state"),n=i.get("city"),t=i.get("name")}console.log("Looking for studio:",{stateParam:s,cityParam:n,studioParam:t}),console.log("Available data:",allStudiosData);const r=allStudiosData.find(i=>i.state.toLowerCase()===s.toLowerCase());if(!r){console.error("State not found:",s),u();return}const a=r.studios.find(i=>i.city.toLowerCase()===n.toLowerCase()&&i.name.toLowerCase()===t.toLowerCase());if(!a){console.error("Studio not found:",{cityParam:n,studioParam:t}),u();return}console.log("Found studio:",a),document.getElementById("studio-name").textContent=a.name,document.getElementById("rating-value").textContent=a.rating,document.getElementById("review-count").textContent=a.number_of_reviews?` (${a.number_of_reviews} reviews)`:"",document.getElementById("studio-address").textContent=a.address;const l=document.getElementById("studio-hours");if(a.opening_hours){const i=a.opening_hours.split(`
`).map(g=>{const[p,o]=g.split(": ");return`<div class="hours-row">
                    <span class="day">${p}</span>
                    <span class="time">${o||"Closed"}</span>
                </div>`}).join("");l.innerHTML=i}document.getElementById("breadcrumb-path").innerHTML=`
        <a href="index.html">Home</a> <span>&nbsp;&gt;&nbsp;</span> 
        <a href="states.html">States</a> <span>&nbsp;&gt;&nbsp;</span> 
        <a href="cities.html?state=${encodeURIComponent(s)}">${s}</a> <span>&nbsp;&gt;&nbsp;</span>
        <a href="city.html?state=${encodeURIComponent(s)}&city=${encodeURIComponent(n)}">${n}</a> <span>&nbsp;&gt;&nbsp;</span>
        ${a.name}
    `,h(a);const d=r.studios.filter(i=>i.city===n&&i.name!==t).slice(0,3);y(d,s),document.getElementById("studio-content").hidden=!1});function u(){document.getElementById("error-message").hidden=!1,document.getElementById("studio-content").hidden=!0}function h(e){const s={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Barre:"🩰",Tower:"🗼",Free_Trial:"🎟️"};document.getElementById("studio-name").textContent=e.name;const n=e.criteria.Reformer?"Reformer Pilates":"Classical Pilates";document.getElementById("studio-type").textContent=n,document.getElementById("rating-value").textContent=e.rating||"N/A",document.getElementById("review-count").textContent=e.number_of_reviews?` (${e.number_of_reviews} reviews)`:"";const t=document.getElementById("studio-features");t.innerHTML="";const r=[];Object.entries(e.criteria||{}).forEach(([o,m])=>{if(m){const c=document.createElement("div");c.className="criteria-badge",c.setAttribute("title",o),c.innerHTML=`
                <span class="emoji">${s[o]}</span>
            `,t.appendChild(c),r.push(o.replace("_"," "))}});const a=document.getElementById("studio-phone");if(e.phone){const o=e.phone.replace(/\D/g,"");a.href=`tel:${o}`,a.textContent=e.phone,a.parentElement.style.display="block"}else a.parentElement.style.display="none";const l=document.createElement("div");if(l.className="about-section",l.innerHTML=`
        <h2>About ${e.name}</h2>
        <p>${e.name} is a ${n} studio located in ${e.city}, ${e.state} 
           with a ${e.rating||"N/A"} star rating from ${e.number_of_reviews||0} reviews. 
           This establishment is offering ${r.join(", ")||"various pilates services"}.</p>
    `,t.parentNode.insertBefore(l,t.nextSibling),e.phone){const o=document.getElementById("studio-phone");o.href=`tel:${e.phone.replace(/\D/g,"")}`,o.textContent=e.phone}if(e.website){const o=document.getElementById("studio-website");o.href=e.website,o.textContent="Visit Website"}const d=document.getElementById("studio-hours");if(e.opening_hours){const o=e.opening_hours.replace(/[\u202f\u2009\u2013]/g," ").split(`
`).map(m=>{const[c,f]=m.split(": ");return`<div class="hours-row">
                    <span class="day">${c}</span>
                    <span class="time">${f||"Closed"}</span>
                </div>`}).join("");d.innerHTML=o}else d.innerHTML="<p>Hours not available</p>";const i=Object.entries(e.criteria||{}).filter(([o,m])=>m).map(([o])=>o.replace("_"," ")).join(", "),g=`${e.name} is a ${n} studio located in ${e.city}, ${e.state} with a ${e.rating||"N/A"} star rating from ${e.number_of_reviews||0} reviews. This establishment is offering ${i||"various pilates services"}.`;document.getElementById("studio-description").textContent=g;const p=document.getElementById("studio-image");p.src=e.photo_url||"./assets/default-studio.jpg",p.alt=e.name,e.instagram?document.getElementById("instagram-link").href=e.instagram:document.getElementById("instagram-link").style.display="none",e.facebook?document.getElementById("facebook-link").href=e.facebook:document.getElementById("facebook-link").style.display="none",$(e)}function y(e,s){const n=document.getElementById("related-studios");n.innerHTML=e.map(t=>`
        <a href="/${encodeURIComponent(s)}/${encodeURIComponent(t.city)}/${encodeURIComponent(t.name)}" class="studio-card">
            <div class="studio-image">
                <img src="${t.photo_url||"./assets/default-studio.jpg"}" alt="${t.name}">
                <div class="rating-container">
                    ⭐ ${t.rating||"N/A"} (${t.number_of_reviews||0})
                </div>
            </div>
            <div class="studio-info">
                <h3>${t.name}</h3>
                <div class="studio-type">${t.type||"Traditional Pilates"}</div>
                <div class="criteria">
                    ${Object.entries(t.criteria||{}).filter(([r,a])=>a).map(([r])=>`<span class="criteria-badge" title="${r}">${criteriaEmojis[r]}</span>`).join("")}
                </div>
                <p class="description">${t.description||"No description available."}</p>
                <span class="view-details-link">View details</span>
            </div>
        </a>
    `).join("")}function $(e){document.title=`${e.name} - Pilates Studio in ${e.city} | Pilates Finder`,document.getElementById("meta-description").content=`${e.name} offers ${Object.keys(e.criteria||{}).filter(n=>e.criteria[n]).join(", ")} Pilates classes in ${e.city}. ${e.rating} stars from ${e.number_of_reviews} reviews.`,document.getElementById("og-title").content=`${e.name} - Pilates Studio in ${e.city}`,document.getElementById("og-description").content=document.getElementById("meta-description").content,document.getElementById("og-image").content=e.photo_url;const s={"@context":"https://schema.org","@type":"FitnessCenter",name:e.name,image:e.photo_url,address:{"@type":"PostalAddress",streetAddress:e.address,addressLocality:e.city,addressRegion:e.state},aggregateRating:{"@type":"AggregateRating",ratingValue:e.rating,reviewCount:e.number_of_reviews}};document.getElementById("schema-data").textContent=JSON.stringify(s)}
