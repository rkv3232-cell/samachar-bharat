const fs = require('fs');
['src/app/admin/posts/new/page.tsx', 'src/app/admin/posts/edit/[id]/page.tsx'].forEach(file => {
    let c = fs.readFileSync(file, 'utf-8');
    const toRemove = `        return;\n\n        const file = e.target.files?.[0];\n        if (!file) return;\n\n        setError('');\n        const isVideo = file.type.startsWith('video/');\n        setIsSliderVideo(isVideo);\n\n        if (file.size > 500 * 1024 * 1024) {\n            setError('File size 500MB से छोटी होनी चाहिए।');\n            return;\n        }\n\n        setMediaFile(file);\n        setMediaPreview(URL.createObjectURL(file));`;
    c = c.replace(toRemove, '');
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
});
