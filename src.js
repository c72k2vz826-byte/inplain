import {review,classify} from './intelligence.js';
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
function render(){
$('source').textContent=pages.map(p=>p.name+' · Page '+p.page+'\n'+p.text).join('\n\n');
const root=$('findings');root.replaceChildren();
function add(tag,t,parent=root){const e=document.createElement(tag);e.textContent=t;parent.append(e);return e}
if(category==='Utility bill'){
const norm=t=>t.normalize('NFC').replace(/\s+/g,' ').replace(/ि([क-ह])/g,'$1ि').replace(/े\s+य/g,'ेय');
const pick=re=>{for(const p of pages){const m=norm(p.text).match(re);if(m)return {v:m[1],page:p.page,m}}return null};
const money='([\\d,]+\\.\\d{2})';
const amt=pick(new RegExp('(?:देयक\\s*रक्कम\\s*रु|पूर्णांक\\s*देयक\\s*\\(रु\\.\\)|amount payable)\\s*[:.₹\\s]*'+money,'i')) || pick(/(?:अं\s*ति\s*म\s*तारीख|अं\s*ित\s*म\s*तारीख|अंतिम तारीख)\s*[:\s]*\d{1,2}-[A-Z]{3}-\d{2,4}\s+([\d,]+\.\d{2})/i);
const due=pick(/(?:After this date|देय\s*दिनांक|अंतिम तारीख)\s*[:\s]*(\d{1,2}-[A-Z]{3}-\d{2,4})/i);
const meter=pick(/(?:एकूण\s*)?(\d{4,8})\s+(\d{4,8})\s+(0?1)\s+(\d{1,6})\s+0\s+\4\b/);
const late=pick(/Pay Rs\.\s*([\d,]+\.\d{2})/i);
const deposit=pick(/सुरक्षा\s*ठे\s*व\s*थकबाकी\s*\(रु\)\s*:\s*([\d,]+\.\d{2})/);
const grid=document.createElement('div');grid.className='metrics';root.append(grid);
for(const [label,value,prefix] of [['Amount payable',amt,'₹'],['Original due date',due,''],['Units billed',meter?{v:meter.m[4],page:meter.page}:null,''],['Late payment amount',late,'₹']]){const tile=document.createElement('div');grid.append(tile);add('small',label,tile);add('strong',value?prefix+value.v:'Not identified',tile);if(value)add('small','Page '+value.page,tile)}
add('h3','What your bill means');
if(meter){const [cur,prev,mult,units]=meter.m.slice(1).map(Number);add('p',cur+' − '+prev+' = '+(cur-prev)+' units. '+((cur-prev)*mult===units?'Meter readings reconcile with billed units.':'Meter readings need verification.'))}
if(amt&&late){const n=x=>Number(x.v.replace(/,/g,''));add('p','The printed late payment amount is ₹'+(n(late)-n(amt)).toFixed(2)+' higher than the billed amount. This is not a live balance.')}
if(deposit){add('h3','Separate security deposit outstanding');add('p','₹'+deposit.v+' is listed separately. Confirm whether and when it is payable. Page '+deposit.page)}
const charges=[['Fixed charges','स्थिर\\s*आकार'],['Energy charges','वीज\\s*आकार'],['Wheeling charges','वहन\\s*आकार[^\\d]{0,15}[\\d.]+\\s*/\\s*युनिट'],['Fuel adjustment','इं\\s*धन\\s*समायोजन\\s*आकार'],['Electricity duty','वीज\\s*शुल्क\\s*\\([^)]*\\)']];
let values=[];for(const [label,pattern] of charges){const v=pick(new RegExp(pattern+'\\s*'+money));if(v)values.push([label,v])}
if(values.length){add('h3','Where your money goes');for(const [label,v] of values)add('p',label+' · ₹'+v.v+' · Page '+v.page)}
if(!amt||!due||!meter)add('p','Some fields could not be verified. Do not rely on missing or incomplete figures.');
}else{
const type=classify(pages.map(p=>p.text).join(' '));add('p',type?'Possible document type: '+type:'Document type not confirmed');const findings=review(category,pages);for(const f of findings){add('h3',f.title);add('p',f.meaning);add('small',f.name+' · Page '+f.page+' — '+f.evidence)}if(findings.length){add('h3','Questions to clarify');const ul=document.createElement('ul');root.append(ul);for(const f of findings)add('li',f.question,ul)}else add('p','No supported terms identified. This does not establish that the document is safe or complete.');
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
