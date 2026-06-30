import fs from 'fs';
const files = ['gallery.json','home-content.json','about-content.json','services-content.json','contact-content.json','blog-posts.json','portfolio-content.json'];
let total = 0, empty = 0;
for (const f of files) {
  const d = JSON.parse(fs.readFileSync('src/data/'+f, 'utf8'));
  const s = JSON.stringify(d);
  const re = /"alt":"([^"]*)"/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    total++;
    if (!m[1]) empty++;
  }
}
console.log('Total images with alt:', total, 'Empty alt:', empty, 'Coverage:', ((total-empty)/total*100).toFixed(1)+'%');
