const fs=require('node:fs'),path=require('node:path');
const src=path.join(__dirname,'src');
const html=fs.readFileSync(path.join(src,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>\n'+fs.readFileSync(path.join(src,name),'utf8')+'\n</script>');
fs.writeFileSync(path.join(__dirname,'HERO84-RGB-Studio.html'),html);
console.log('Built standalone HERO84-RGB-Studio.html');
