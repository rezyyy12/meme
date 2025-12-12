const dpr = window.devicePixelRatio || 1
const canvas = document.getElementById('memeCanvas')
const ctx = canvas.getContext('2d')
canvas.width = 512 * dpr
canvas.height = 512 * dpr
canvas.style.width = '512px'
canvas.style.height = '512px'
ctx.scale(dpr, dpr)

let state = {
template: null,
top: '',
bottom: '',
font: 'Arial',
color: '#ffffff',
size: 48,
align: 'center',
stickers: [],
history: [],
redo: []
}

const gallery = [
'assets/distracted.jpg',
'assets/thisisfine.jpg',
'assets/successkid.jpg',
'assets/expanding.jpg',
'assets/drake.jpg',
'assets/spongebob.jpg',
'assets/changemymind.jpg',
'assets/zhdun.jpg',
'assets/uspeh.jpg'
]

const stickers = Array.from({length:24}).map((_,i)=>`assets/stickers/${i+1}.svg`)

const placeholders = {
action:['ешь пиццу','работаешь','учишься','отдыхаешь','бежишь','ленишься','делаешь мемы','опаздываешь','залипаешь'],
obstacle:['диета','дедлайны','алгоритмы','будильник','работа','универ','хаос','реальность','рутина'],
emotion:['радость','паника','усталость','фрустрация','эйфория','злость','офигевание','спокойствие','тоска']
}

const randomTemplates = [
'Когда [action], но [obstacle]',
'Когда взрослый, но [action]',
'Ожидания: [emotion], Реальность: [obstacle]',
'Когда пытаешься [action], но получается [obstacle]',
'[emotion] достигает пика, когда [action]'
]

function pick(a){return a[Math.floor(Math.random()*a.length)]}

function genRandom(){
let t = pick(randomTemplates)
t = t.replace('[action]',pick(placeholders.action))
t = t.replace('[obstacle]',pick(placeholders.obstacle))
t = t.replace('[emotion]',pick(placeholders.emotion))
return t
}

function pushHistory(){
state.history.push(JSON.stringify(state))
if(state.history.length>10) state.history.shift()
state.redo=[]
}

function undo(){
if(!state.history.length)return
state.redo.push(JSON.stringify(state))
state = JSON.parse(state.history.pop())
render()
}

function redo(){
if(!state.redo.length)return
state.history.push(JSON.stringify(state))
state = JSON.parse(state.redo.pop())
render()
}

function loadImage(src){
return new Promise(r=>{
const i = new Image()
i.crossOrigin='anonymous'
i.onload=()=>r(i)
i.src=src
})
}

async function render(){
ctx.clearRect(0,0,512,512)
if(state.template){
const img=await loadImage(state.template)
ctx.drawImage(img,0,0,512,512)
}
ctx.fillStyle=state.color
ctx.strokeStyle='#000'
ctx.lineWidth=2

ctx.textAlign=state.align
ctx.font=`${state.size}px ${state.font}`

ctx.strokeText(state.top,256,getY('top'))
ctx.fillText(state.top,256,getY('top'))

ctx.strokeText(state.bottom,256,getY('bottom'))
ctx.fillText(state.bottom,256,getY('bottom'))

state.stickers.forEach(s=>{
ctx.save()
ctx.translate(s.x,s.y)
ctx.rotate(s.r)
ctx.drawImage(s.img,-s.w/2,-s.h/2,s.w,s.h)
ctx.restore()
})
}

function getY(pos){
return pos==='top'?state.size:512-state.size/3
}

function debounce(f,ms){
let t
return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}
}

const update = debounce(()=>{
pushHistory()
render()
},100)

document.getElementById('topText').oninput=e=>{
state.top=e.target.value
update()
}
document.getElementById('bottomText').oninput=e=>{
state.bottom=e.target.value
update()
}
document.getElementById('fontSelect').oninput=e=>{
state.font=e.target.value
update()
}
document.getElementById('fontColor').oninput=e=>{
state.color=e.target.value
update()
}
document.getElementById('fontSize').oninput=e=>{
state.size=+e.target.value
update()
}
document.getElementById('fontAlign').oninput=e=>{
state.align=e.target.value
update()
}

const galleryModal=document.getElementById('galleryModal')
const galleryGrid=document.getElementById('galleryGrid')
gallery.forEach(src=>{
const img=document.createElement('img')
img.className='thumbnail'
img.loading='lazy'
img.src=src
img.onclick=()=>{
state.template=src
pushHistory()
render()
galleryModal.style.display='none'
}
galleryGrid.append(img)
})

document.getElementById('openGallery').onclick=()=>{
galleryModal.style.display='flex'
}

window.onclick=e=>{
if(e.target===galleryModal)galleryModal.style.display='none'
if(e.target===stickersModal)stickersModal.style.display='none'
}

const stickersModal=document.getElementById('stickersModal')
const stickersGrid=document.getElementById('stickersGrid')
stickers.forEach(src=>{
const img=document.createElement('img')
img.className='sticker'
img.src=src
img.onclick=async()=>{
const i=await loadImage(src)
state.stickers.push({img:i,x:256,y:256,w:80,h:80,r:0})
pushHistory()
render()
stickersModal.style.display='none'
}
stickersGrid.append(img)
})

document.getElementById('openStickers').onclick=()=>{
stickersModal.style.display='flex'
}

let drag=null
canvas.onpointerdown=e=>{
const x=e.offsetX
const y=e.offsetY
for(let i=state.stickers.length-1;i>=0;i--){
const s=state.stickers[i]
if(Math.abs(x-s.x)<s.w/2 && Math.abs(y-s.y)<s.h/2){
drag={i,dx:x-s.x,dy:y-s.y}
break
}
}
}

canvas.onpointermove=e=>{
if(!drag)return
const x=e.offsetX
const y=e.offsetY
const s=state.stickers[drag.i]
s.x=x-drag.dx
s.y=y-drag.dy
render()
}

canvas.onpointerup=e=>{
if(!drag)return
pushHistory()
drag=null
}

document.getElementById('randomBtn').onclick=()=>{
const txt=genRandom()
state.top=txt
state.bottom=''
state.template=pick(gallery)
pushHistory()
render()
}

document.getElementById('exportBtn').onclick=async()=>{
const l=document.getElementById('loading')
l.style.display='block'
canvas.toBlob(b=>{
const a=document.createElement('a')
a.href=URL.createObjectURL(b)
a.download='meme.png'
a.click()
l.style.display='none'
},'image/png',1.0)
}

document.getElementById('shareBtn').onclick=async()=>{
if(navigator.share){
canvas.toBlob(async b=>{
const f=new File([b],'meme.png',{type:'image/png'})
await navigator.share({files:[f],title:'Мой мем'})
})
}else{
document.getElementById('exportBtn').click()
}
}

render()
