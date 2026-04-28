const fs = require('fs');
let c = fs.readFileSync('src/app/admin/posts/edit/[id]/page.tsx', 'utf-8');
c = c.replace(/let mediaUrl = form\.image;[\s\S]*?tags: form\.tags\r?\n            \}\);/, `let mediaUrl = form.image;
            let uploadedImages = form.images || [];

            if (mediaFiles.length > 0) {
                setUploading(true);
                setUploadProgress(0);
                const urls: string[] = [];
                for (let i = 0; i < mediaFiles.length; i++) {
                    const u = await uploadToCloudinary(mediaFiles[i], (percent: number) => {
                        setUploadProgress(Math.round(((i * 100) + percent) / mediaFiles.length));
                    });
                    urls.push(u);
                }
                setUploading(false);
                if (urls.length > 0) {
                    mediaUrl = urls[0];
                    uploadedImages = urls;
                }
            }
            await updatePost(id, {
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
                image: mediaUrl,
                images: uploadedImages,
                status: form.status,
                tags: form.tags
            });`);
fs.writeFileSync('src/app/admin/posts/edit/[id]/page.tsx', c);
console.log('Done fix2');
