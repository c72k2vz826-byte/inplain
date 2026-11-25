import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc=worker;
const $=id=>document.getElementById(id);
const cats=['Home loan','Personal loan','Car loan','Credit card bill','Utility bill','Insurance policy','Legal notices','Agreements','Other documents'];
const icons=['M3 11 12 3 21 11V21H3Z M9 21V14H15V21','M3 6H21V19H3Z M16 11H21V15H16Z','M3 16V10L6 5H18L21 10V16Z M5 16V20 M19 16V20','M3 5H21V19H3Z M3 10H21','M5 3H19V21L16 19 12 21 8 19 5 21Z M8 8H16 M8 12H16','M12 3 21 7V12Q21 18 12 22Q3 18 3 12V7Z M8 12 11 15 16 9','M12 3V21 M4 7H20 M4 7 1 15H7Z M20 7 17 15H23Z','M5 3H19V21H5Z M8 8H16 M8 12H16','M5 3H19V21H5Z M8 8H16 M8 12H16'];
cats.forEach((c,i)=>{const b=document.createElement('button');b.dataset.cat=c;b.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="'+icons[i]+'"/></svg>';b.append(document.createTextNode(c));$('categories').append(b)});
let category='', pages=[], generation=0, files=[], pending=[];
function clear(){generation++;pages=[];files=[];pending=[];updateQueue();$('files').value='';$('camera').value='';$('source').textContent='';$('findings').replaceChildren();$('status').textContent='';$('aiStatus').textContent='';$('result').hidden=true}
document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{clear();category=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));$('heading').textContent='Add your '+category.toLowerCase()+' documents';$('upload').hidden=false;$('upload').scrollIntoView({behavior:'smooth'})});
$('clear').onclick=clear;
const rules=[
[/non[- ]?refundable/i,'Non-refundable fee','You may not get this fee back. Check when this applies.'],
[/floating rate|variable rate|interest rate reset/i,'Changing interest rate','Your rate may change. Ask whether your EMI or tenure changes.'],
[/foreclosure|prepayment/i,'Early repayment','Check the conditions and charges for repaying early.'],
[/credit bureau|credit information|cibil/i,'Credit information','Check what credit checks and information sharing you authorise.'],
[/insurance premium|credit life/i,'Insurance cost','Ask whether insurance is optional and whether its cost is financed.'],
[/minimum (amount )?due/i,'Minimum payment','Paying only the minimum may leave a balance subject to interest.'],
[/late payment|penal charge|penalty/i,'Late charges','Check the amount, trigger and calculation of late charges.'],
[/due date|pay by|payment deadline/i,'Payment deadline','Confirm the exact date and amount before acting.'],
[/meter reading|units consumed|consumption/i,'Consumption','Compare current and previous readings and billed units.'],
[/arrears|previous balance/i,'Previous balance','Check whether previous payments have been credited.'],
[/fixed charge|fuel adjustment|electricity duty|wheeling charge/i,'Bill components','These may be separate from energy consumption charges.'],
[/waiting period|exclusion|co.payment|sub.limit/i,'Coverage limitation','Check when coverage is restricted and what you may pay yourself.'],
[/sarfaesi|arbitration|summons|demand notice|loan recall/i,'Legal notice','The sender may be asserting a claim or starting a process. Verify the deadline and seek qualified legal advice.'],
[/consent|authori[sz]e|declaration/i,'Permissions and declarations','Read the specific permission or declaration before signing.']
];
function render(){
$('source').textContent=pages.map(p=>p.name+' · Page '+p.page+'\n'+p.text).join('\n\n');
const root=$('findings');root.replaceChildren();
function add(tag,t,parent=root){const e=document.createElement(tag);e.textContent=t;parent.append(e);return e}
if(category==='Utility bill'){
const fields=[['Amount payable',/(?:total amount payable|net amount payable|amount payable|bill amount)\s*[:₹Rs.\s]*([\d,]+(?:\.\d{1,2})?)/i,'₹'],['Payment due date',/(?:payment due date|due date|pay by)\s*[:\s]*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,''],['Units billed',/(?:units consumed|billed units|consumption units)\s*[:\s]*([\d,]+(?:\.\d+)?)/i,'']];
const grid=document.createElement('div');grid.className='metrics';root.append(grid);let found=0;
for(const [label,re,prefix] of fields){const p=pages.find(p=>re.test(p.text));const tile=document.createElement('div');grid.append(tile);add('small',label,tile);add('strong',p?prefix+p.text.match(re)[1]:'Not identified',tile);if(p){found++;add('small','Page '+p.page+' · Verify against bill',tile)}}
add('h3',found?'What to check':'We could not identify the bill details reliably');
add('p',found?'Confirm the amounts and dates against the original bill. Check billed units, arrears and separate charges.':'This PDF may contain website navigation, a scanned bill or an unsupported layout. Select the actual bill PDF rather than a printout of the website, if available.');
}else{
let count=0;for(const [re,title,explain] of rules){const p=pages.find(p=>re.test(p.text));if(!p)continue;count++;const at=p.text.match(re).index;add('h3',title);add('p',explain);add('small',p.name+' · Page '+p.page+' — '+p.text.slice(Math.max(0,at-65),at+130))}
if(!count)add('p','No supported terms identified. This does not establish that the document is safe or complete.');
}
add('small','Limited local review. Verify findings against the original document.');$('result').hidden=!pages.length;if(pages.length)$('result').scrollIntoView({behavior:'smooth',block:'start'});
}
async function read(newFiles){files.push(...newFiles);const g=++generation;pages=[];const errors=[];const batch=[...files];$('status').textContent='Reading locally…';for(const f of batch){try{if(f.name.toLowerCase().endsWith('.pdf')){const pdf=await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer()),isEvalSupported:false}).promise;try{for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();const text=content.items.map(x=>x.str||'').join(' ');if(g!==generation)return;if(text.trim())pages.push({name:f.name,page:i,text});else errors.push(f.name+' page '+i+': scanned or empty; OCR not available')}}finally{await pdf.destroy()}}else if(f.name.toLowerCase().endsWith('.txt')){const text=await f.text();if(g!==generation)return;pages.push({name:f.name,page:1,text})}else errors.push(f.name+': image recognition not available yet')}catch(e){errors.push(f.name+': '+e.message)}if(g!==generation)return} $('status').textContent=batch.length+' files · '+pages.length+' readable pages. '+errors.join('; ');render()}
function updateQueue(){const q=$('queue');q.replaceChildren();pending.forEach((f,i)=>{const row=document.createElement('div');const name=document.createElement('span');name.textContent=f.name;const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Remove '+f.name);remove.onclick=()=>{pending.splice(i,1);invalidate();updateQueue()};row.append(name,remove);q.append(row)});$('analyse').disabled=!pending.length}
function invalidate(){generation++;pages=[];files=[];$('result').hidden=true;$('source').textContent='';$('findings').replaceChildren();$('status').textContent='';$('aiStatus').textContent=''}
function queueFiles(list){invalidate();pending.push(...list);updateQueue()}
$('pick').onclick=()=>$('files').click();
$('files').onchange=e=>{queueFiles(Array.from(e.target.files));e.target.value=''};
const dz=$('dropzone');for(const event of ['dragenter','dragover'])dz.addEventListener(event,e=>{e.preventDefault();dz.classList.add('drag')});for(const event of ['dragleave','drop'])dz.addEventListener(event,e=>{e.preventDefault();dz.classList.remove('drag')});dz.addEventListener('drop',e=>queueFiles(Array.from(e.dataTransfer.files)));
$('analyse').onclick=async()=>{invalidate();$('analyse').disabled=true;try{await read([...pending])}finally{updateQueue()}};
$('handoff').onclick=async()=>{const provider=$('provider').value;const text=$('source').textContent;if(!confirm('Copy extracted document text to your clipboard? Review and remove sensitive information before pasting into '+provider+'. Nothing is sent automatically.'))return;try{await navigator.clipboard.writeText('Explain this '+category+' document in simple language. Identify document type, commitments, costs, permissions, deadlines, uncertainties and questions before deciding. Cite source pages; do not invent facts or legal conclusions.\n\n'+text);$('aiStatus').textContent='Copied. Paste only after reviewing sensitive information.';window.open(({ChatGPT:'https://chatgpt.com',Claude:'https://claude.ai',Gemini:'https://gemini.google.com'})[provider],'_blank','noopener,noreferrer')}catch(e){$('aiStatus').textContent='Clipboard unavailable. No information sent.'}};
