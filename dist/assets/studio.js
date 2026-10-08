import{l as f}from"./global.js";const u={Reformer:"🏋️‍♀️",Mat:"🟦",Private:"🔒",Group:"👥",Online:"🌐",Barre:"🩰",Tower:"🗼",Free_Trial:"🎟️"};document.addEventListener("DOMContentLoaded",async()=>{const e=await f(),o=new URLSearchParams(window.location.search),n=o.get("state"),t=o.get("city"),s=o.get("name");if(!e||!n||!t||!s){console.error("Missing data or URL parameters:",{stateParam:n,cityParam:t,studioParam:s}),p();return}const r=e.find(i=>i.state.toLowerCase()===n.toLowerCase());if(!r){console.error("State not found:",n),p();return}const a=r.studios.find(i=>i.city.toLowerCase()===t.toLowerCase()&&i.name.toLowerCase()===s.toLowerCase());if(!a){console.error("Studio not found:",{cityParam:t,studioParam:s}),p();return}console.log("Found studio:",a),document.getElementById("studio-name").textContent=a.name,document.getElementById("rating-value").textContent=a.rating,document.getElementById("review-count").textContent=a.number_of_reviews?` (${a.number_of_reviews} reviews)`:"",document.getElementById("studio-address").textContent=a.address;const m=document.getElementById("studio-hours");if(a.opening_hours){const i=a.opening_hours.split(`
`).map(l=>{const[d,g]=l.split(": ");return`<div class="hours-row">
                    <span class="day">${d}</span>
                    <span class="time">${g||"Closed"}</span>
                </div>`}).join("");m.innerHTML=i}document.getElementById("breadcrumb-path").innerHTML=`
        <a href="/">Home</a> <span> > </span> 
        <a href="/states">States</a> <span> > </span> 
        <a href="/cities?state=${encodeURIComponent(n)}">${n}</a> <span> > </span>
        <a href="/city?state=${encodeURIComponent(n)}&city=${encodeURIComponent(t)}">${t}</a> <span> > </span>
        ${a.name}
    `,y(a);const c=r.studios.filter(i=>i.city===t&&i.name!==s).slice(0,3);h(c,n)});function p(){var e,o;document.getElementById("error-message").hidden=!1,(e=document.querySelector(".studio-grid"))==null||e.setAttribute("hidden",""),(o=document.querySelector(".related-studios-section"))==null||o.setAttribute("hidden","")}function y(e){document.getElementById("studio-name").textContent=e.name;const o=e.criteria.Reformer?"Reformer Pilates":"Classical Pilates";document.getElementById("studio-type").textContent=o,document.getElementById("rating-value").textContent=e.rating||"N/A",document.getElementById("review-count").textContent=e.number_of_reviews?` (${e.number_of_reviews} reviews)`:"";const n=document.getElementById("studio-features");n.innerHTML="";const t=[];Object.entries(e.criteria||{}).forEach(([c,i])=>{if(i){const l=document.createElement("div");l.className="criteria-badge",l.setAttribute("title",c),l.innerHTML=`
                <span class="emoji">${u[c]}</span>
            `,n.appendChild(l),t.push(c.replace("_"," "))}});const s=document.getElementById("studio-phone");if(e.phone){const c=e.phone.replace(/\D/g,"");s.href=`tel:${c}`,s.textContent=e.phone,s.parentElement.style.display="block"}else s.parentElement.style.display="none";const r=document.createElement("div");if(r.className="about-section",r.innerHTML=`
        <h2>About ${e.name}</h2>
        <p>${e.name} is a ${o} studio located in ${e.city}, ${e.state} 
           with a ${e.rating||"N/A"} star rating from ${e.number_of_reviews||0} reviews. 
           This establishment is offering ${t.join(", ")||"various pilates services"}.</p>
    `,n.parentNode.insertBefore(r,n.nextSibling),e.website){const c=document.getElementById("studio-website");c.href=e.website,c.textContent="Visit Website"}const a=document.getElementById("studio-hours");if(e.opening_hours){const c=e.opening_hours.replace(/[\u202f\u2009\u2013]/g," ").split(`
`).map(i=>{const[l,d]=i.split(": ");return`<div class="hours-row">
                    <span class="day">${l}</span>
                    <span class="time">${d||"Closed"}</span>
                </div>`}).join("");a.innerHTML=c}else a.innerHTML="<p>Hours not available</p>";const m=document.getElementById("studio-image");m.src=e.photo_url||"/assets/default-studio.jpg",m.alt=e.name,e.instagram?document.getElementById("instagram-link").href=e.instagram:document.getElementById("instagram-link").style.display="none",e.facebook?document.getElementById("facebook-link").href=e.facebook:document.getElementById("facebook-link").style.display="none",$(e)}function h(e,o){const n=document.getElementById("related-studios");n.innerHTML=e.map(t=>{var s;return`
        <a href="/studio?state=${encodeURIComponent(o)}&city=${encodeURIComponent(t.city)}&name=${encodeURIComponent(t.name)}" class="studio-card">
            <div class="studio-image">
                <img src="${t.photo_url||"/assets/default-studio.jpg"}" alt="${t.name}">
                <div class="rating-container">
                    ⭐ ${t.rating||"N/A"} (${t.number_of_reviews||0})
                </div>
            </div>
            <div class="studio-info">
                <h3>${t.name}</h3>
                <div class="studio-type">${(s=t.criteria)!=null&&s.Reformer?"Reformer Pilates":"Traditional Pilates"}</div>
                <div class="criteria">
                    ${Object.entries(t.criteria||{}).filter(([r,a])=>a).map(([r])=>`<span class="criteria-badge" title="${r}">${u[r]}</span>`).join("")}
                </div>
                <p class="description">${t.description||"No description available."}</p>
                <span class="view-details-link">View details</span>
            </div>
        </a>
    `}).join("")}function $(e){document.title=`${e.name} - Pilates Studio in ${e.city} | Pilates Finder`;const o=document.querySelector('meta[name="description"]');o&&(o.content=`${e.name} offers ${Object.keys(e.criteria||{}).filter(m=>e.criteria[m]).join(", ")} Pilates classes in ${e.city}. ${e.rating} stars from ${e.number_of_reviews} reviews.`);const n=document.querySelector('meta[property="og:title"]');n&&(n.content=`${e.name} - Pilates Studio in ${e.city}`);const t=document.querySelector('meta[property="og:description"]');t&&(t.content=o==null?void 0:o.content);const s=document.querySelector('meta[property="og:image"]');s&&(s.content=e.photo_url||"/assets/default-studio.jpg");const r=document.createElement("script");r.type="application/ld+json";const a={"@context":"https://schema.org","@type":"FitnessCenter",name:e.name,image:e.photo_url||"/assets/default-studio.jpg",address:{"@type":"PostalAddress",streetAddress:e.address,addressLocality:e.city,addressRegion:e.state},aggregateRating:{"@type":"AggregateRating",ratingValue:e.rating||0,reviewCount:e.number_of_reviews||0}};r.textContent=JSON.stringify(a),document.head.appendChild(r)}
