const fs = require('fs');
['src/app/admin/posts/new/page.tsx', 'src/app/admin/posts/edit/[id]/page.tsx'].forEach(file => {
    let c = fs.readFileSync(file, 'utf-8');
    c = c.replace(/image: string;([\r\n ]+status: PostStatus;[\r\n ]+tags: string\[\];)/, 'image: string;\n    images?: string[];$1');
    fs.writeFileSync(file, c);
});
console.log('Fixed interface');
