// Auto-inject CSS fixes for pointer-events:none on pseudo-elements
(function(){
  var s=document.createElement('style');
  s.textContent=`/* pointer-events fix for clickable elements */
.animated-bg::before{pointer-events:none!important}
button{position:relative!important}
button::before{pointer-events:none!important}
.card{position:relative!important}
.card::before{pointer-events:none!important}
.feature-card{position:relative!important}
.feature-card::after{pointer-events:none!important}
.avatar{position:relative!important}
.avatar::after{pointer-events:none!important}
.nav-item.active::after{pointer-events:none!important}
.stat-card::before{pointer-events:none!important}
.modal::before{pointer-events:none!important}`;
  document.head.appendChild(s);
})();