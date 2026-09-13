import{aX as h,aV as e,aR as q,aS as K,an as J,L as Q,ai as Y,a9 as ee,a4 as te,w as ne,O as oe,az as se,$ as ae,K as re}from"./vendor-x-8wQp3d.js";async function ie(s){let l=s,n=!1;try{const a=await fetch(s,{mode:"cors"});if(a.ok){const r=await a.blob();l=URL.createObjectURL(r),n=!0}}catch{}return new Promise((a,r)=>{const c=new Image;c.crossOrigin="anonymous",c.onload=()=>{try{const o=document.createElement("canvas");o.width=c.naturalWidth||1600,o.height=c.naturalHeight||1130;const d=o.getContext("2d");if(!d)throw new Error("Canvas context failed");d.fillStyle="#ffffff",d.fillRect(0,0,o.width,o.height),d.drawImage(c,0,0),o.toBlob(C=>{if(n&&URL.revokeObjectURL(l),!C){r(new Error("Failed to export canvas to JPEG"));return}const z=new FileReader;z.onload=()=>{try{const R=z.result,p=new Uint8Array(R),u=o.width,b=o.height,L=Math.round(u*.75),T=Math.round(b*.75),w=`%PDF-1.4
`,_=`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`,S=`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
`,H=`3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${L} ${T}] /Resources << /XObject << /Im 4 0 R >> >> /Contents 5 0 R >>
endobj
`,W=`4 0 obj
<< /Type /XObject /Subtype /Image /Width ${u} /Height ${b} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.length} >>
stream
`,P=`
endstream
endobj
`,Z=`q
${L} 0 0 ${T} 0 0 cm
/Im Do
Q
`,A=`5 0 obj
<< /Length ${Z.length} >>
stream
${Z}endstream
endobj
`,m=new TextEncoder,$=m.encode(w),D=m.encode(_),O=m.encode(S),F=m.encode(H),E=m.encode(W),U=m.encode(P),B=m.encode(A),t=$.length,I=t+D.length,j=I+O.length,N=j+F.length,k=N+E.length+p.length+U.length,M=k+B.length,f=X=>X.toString().padStart(10,"0"),g=`xref
0 6
0000000000 65535 f 
${f(t)} 00000 n 
${f(I)} 00000 n 
${f(j)} 00000 n 
${f(N)} 00000 n 
${f(k)} 00000 n 
`,y=`trailer
<< /Size 6 /Root 1 0 R >>
startxref
${M}
%%EOF
`,v=m.encode(g+y),V=$.length+D.length+O.length+F.length+E.length+p.length+U.length+B.length+v.length,x=new Uint8Array(V);let i=0;x.set($,i),i+=$.length,x.set(D,i),i+=D.length,x.set(O,i),i+=O.length,x.set(F,i),i+=F.length,x.set(E,i),i+=E.length,x.set(p,i),i+=p.length,x.set(U,i),i+=U.length,x.set(B,i),i+=B.length,x.set(v,i),i+=v.length;const G=new Blob([x],{type:"application/pdf"});a(G)}catch(R){r(R)}},z.readAsArrayBuffer(C)},"image/jpeg",.98)}catch(o){n&&URL.revokeObjectURL(l),r(o)}},c.onerror=()=>{n&&URL.revokeObjectURL(l),r(new Error("Image failed to load for PDF generation"))},c.src=l})}async function ce(s,l,n=!0){if(n)try{const r=await ie(s),c=URL.createObjectURL(r),o=document.createElement("a");o.href=c;const d=l.toLowerCase().endsWith(".pdf")?l:`${l.replace(/\.[^/.]+$/,"")}.pdf`;o.download=d,document.body.appendChild(o),o.click(),o.remove(),setTimeout(()=>URL.revokeObjectURL(c),1e4);return}catch(r){console.warn("Client PDF generation fallback to image download:",r)}try{const r=await fetch(s,{mode:"cors"});if(r.ok){const c=await r.blob(),o=URL.createObjectURL(c),d=document.createElement("a");d.href=o,d.download=l,document.body.appendChild(d),d.click(),d.remove(),setTimeout(()=>URL.revokeObjectURL(o),1e4);return}}catch{}const a=document.createElement("a");a.href=s,a.target="_blank",a.download=l,document.body.appendChild(a),a.click(),a.remove()}function le(s){window.open(s,"_blank","noopener,noreferrer")}function pe({certificate:s,onClose:l}){const n=s.fileData||"",a=s.fileName||"",r=s.fileType||"",c=s.studentName||s.recipientName||"Student Developer",o=s.projectName||s.projectTitle||"Software Engineering Project",d=s.issueDate||"Verified",C=s.credentialId||s.id,[z,R]=h.useState(!1),p=h.useMemo(()=>{if(!n&&!a&&!r)return!1;const t=n.toLowerCase(),I=a.toLowerCase();return!!(r.toLowerCase().includes("pdf")||I.endsWith(".pdf")||I.includes(".pdf")||t.startsWith("data:application/pdf")||t.includes(".pdf"))},[n,a,r]),u=!!(n&&n.includes("res.cloudinary.com")),b=h.useMemo(()=>{if(!u||!n)return"";let t=n.replace(/\.pdf(\?.*)?$/i,".png$1");return t.includes("/upload/")&&(t=t.replace(/\/upload\/(v\d+\/)?/,"/upload/f_png,q_auto:best,w_1800/$1")),t},[n,u]),[L,T]=h.useState("");h.useEffect(()=>{if(n&&n.startsWith("data:application/pdf"))try{const t=n.split(",")[1]||n;(async()=>{try{const j=window.pdfjsLib;if(j){const M=await(await j.getDocument({data:atob(t)}).promise).getPage(1),f=M.getViewport({scale:2}),g=document.createElement("canvas"),y=g.getContext("2d");g.height=f.height,g.width=f.width,y&&(await M.render({canvasContext:y,viewport:f}).promise,T(g.toDataURL("image/png")))}else{const N=document.createElement("script");N.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",N.onload=async()=>{const k=window.pdfjsLib;if(!k)return;k.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";const g=await(await k.getDocument({data:atob(t)}).promise).getPage(1),y=g.getViewport({scale:2}),v=document.createElement("canvas"),V=v.getContext("2d");v.height=y.height,v.width=y.width,V&&(await g.render({canvasContext:V,viewport:y}).promise,T(v.toDataURL("image/png")))},document.head.appendChild(N)}}catch(j){console.warn("Local PDF render note:",j)}})()}catch(t){console.error("PDF data processing note:",t)}},[n]);const w=h.useMemo(()=>u&&p&&b?b:L||b||n,[u,p,b,L,n]),[_,S]=h.useState(1),[H,W]=h.useState(0),[P,Z]=h.useState(!1),A=h.useRef(null),m=()=>S(t=>Math.min(t+.25,3)),$=()=>S(t=>Math.max(t-.25,.5)),D=()=>{S(1),W(0)},O=()=>W(t=>(t+90)%360),F=()=>Z(!P),E=()=>window.print(),U=a?p&&!a.toLowerCase().endsWith(".pdf")?`${a.replace(/\.[^/.]+$/,"")}.pdf`:a:`Certificate_${C}_${c.replace(/\s+/g,"_")}.${p?"pdf":"png"}`,B=async()=>{if(!(!w||z)){R(!0);try{await ce(w,U,p)}finally{R(!1)}}};return e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-text",onClick:l,children:[e.jsx("style",{children:`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #recodex-print-certificate, #recodex-print-certificate * {
            visibility: visible !important;
          }
          #recodex-print-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
            z-index: 99999 !important;
          }
          #recodex-print-certificate img {
            max-width: 100% !important;
            max-height: 100vh !important;
            object-fit: contain !important;
          }
        }
      `}),e.jsxs("div",{className:`relative w-full ${P?"max-w-[98vw] h-[96vh]":"max-w-5xl max-h-[94vh]"} bg-[#080b12] text-white border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_90px_rgba(0,209,255,0.22)] flex flex-col overflow-hidden transition-all duration-300`,onClick:t=>t.stopPropagation(),children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 shrink-0 print:hidden",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("span",{className:"w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-xs font-mono uppercase tracking-widest text-zinc-200 font-bold",children:"Official Certificate Document"}),e.jsx("span",{className:"px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",children:"Verified Credential"})]}),e.jsxs("p",{className:"text-[11px] font-mono text-zinc-400 truncate max-w-sm mt-0.5",children:[c," • ",C]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end",children:[e.jsxs("div",{className:"flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 text-xs font-mono",children:[e.jsx("button",{type:"button",onClick:m,className:"p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer",title:"Zoom In",children:e.jsx(q,{size:14})}),e.jsx("button",{type:"button",onClick:$,className:"p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer",title:"Zoom Out",children:e.jsx(K,{size:14})}),e.jsxs("button",{type:"button",onClick:D,className:"px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer font-bold",title:"Reset Zoom to 100%",children:[Math.round(_*100),"%"]}),e.jsx("button",{type:"button",onClick:O,className:"p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer",title:"Rotate 90°",children:e.jsx(J,{size:14})})]}),w&&e.jsxs("button",{type:"button",onClick:()=>le(w),className:"px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-cyan-300 transition-colors cursor-pointer",title:u?"Open direct asset in Cloudinary":"Open certificate in a clean new tab",children:[e.jsx(Q,{size:13}),e.jsx("span",{children:u?"Open in Cloudinary":"Open in New Tab"})]}),e.jsxs("button",{type:"button",onClick:E,className:"px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-zinc-200 transition-colors cursor-pointer",title:"Print Certificate Document",children:[e.jsx(Y,{size:13}),e.jsx("span",{className:"hidden sm:inline",children:"Print"})]}),e.jsx("button",{type:"button",onClick:F,className:"p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer",title:P?"Exit Fullscreen":"Expand Fullscreen",children:P?e.jsx(ee,{size:16}):e.jsx(te,{size:16})}),e.jsx("button",{type:"button",onClick:l,className:"p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer",title:"Close modal",children:e.jsx(ne,{size:18})})]})]}),e.jsx("div",{ref:A,className:"relative flex-1 mt-4 p-2 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-auto flex flex-col items-center justify-center min-h-[440px]",children:w?e.jsx("div",{id:"recodex-print-certificate",className:"w-full h-full flex items-center justify-center overflow-auto p-2 sm:p-4",children:e.jsx("img",{src:w,alt:`Certificate for ${c}`,style:{transform:`scale(${_}) rotate(${H}deg)`,transition:"transform 0.2s ease-out"},className:"max-h-[620px] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-zinc-800/80 pointer-events-auto select-none",draggable:!1})}):e.jsxs("div",{className:"p-8 text-center space-y-3",children:[e.jsx(oe,{size:40,className:"mx-auto text-zinc-600 animate-pulse"}),e.jsxs("h3",{className:"text-sm font-bold text-white",children:["Certificate Credential #",C]}),e.jsxs("p",{className:"text-xs text-zinc-400 max-w-md mx-auto leading-relaxed",children:["Official certificate issued for ",e.jsx("strong",{children:o}),". The uploaded document is currently being synchronized by the administration."]})]})}),e.jsxs("div",{className:"mt-4 p-3.5 sm:p-4 bg-zinc-900/70 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0 print:hidden",children:[e.jsxs("div",{className:"space-y-0.5 text-left w-full sm:w-auto",children:[e.jsxs("p",{className:"text-zinc-300 flex items-center gap-2",children:[e.jsx(se,{size:14,className:"text-emerald-400 shrink-0"}),e.jsxs("span",{children:["Recipient: ",e.jsx("strong",{className:"text-white",children:c})]}),s.userEmail&&e.jsxs("span",{className:"text-zinc-500",children:["(",s.userEmail,")"]})]}),e.jsxs("p",{className:"text-zinc-500 text-[11px]",children:["Project: ",o," • Issued on: ",d," • ID: ",e.jsx("span",{className:"text-cyan-400 font-bold",children:C})]})]}),e.jsx("div",{className:"flex items-center gap-2 w-full sm:w-auto justify-end",children:e.jsx("button",{type:"button",onClick:B,disabled:z,className:"w-full sm:w-auto px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50",children:z?e.jsxs(e.Fragment,{children:[e.jsx(ae,{size:15,className:"animate-spin"}),e.jsx("span",{children:"Generating PDF..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(re,{size:15}),e.jsxs("span",{children:["Download Official ",p?"PDF":"Certificate"]})]})})})]})]})]})}export{pe as C,ce as d};
