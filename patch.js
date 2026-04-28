const fs = require('fs');

function patchNewPost() {
    let content = fs.readFileSync('src/app/admin/posts/new/page.tsx', 'utf-8');

    // 1. form state
    content = content.replace(
        `image: '',\n        status: 'published' as PostStatus,`,
        `image: '',\n        images: [] as string[],\n        status: 'published' as PostStatus,`
    );

    // 2. Media states
    content = content.replace(
        `const [mediaFile, setMediaFile] = useState<File | null>(null);`,
        `const [mediaFiles, setMediaFiles] = useState<File[]>([]);`
    ).replace(
        `const [mediaPreview, setMediaPreview] = useState('');`,
        `const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);`
    );

    // 3. handleFileChange
    content = content.replace(
        `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {`,
        `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setError('');
        const images = files.filter(f => f.type.startsWith('image/'));
        const videos = files.filter(f => f.type.startsWith('video/'));

        if (videos.length > 1) {
            return setError('आप केवल 1 वीडियो अपलोड कर सकते हैं।');
        }
        if (images.length > 5) {
            return setError('आप अधिकतम 5 तस्वीरें अपलोड कर सकते हैं।');
        }
        if (images.length + videos.length > 6) {
            return setError('कुल मिलाकर 6 से अधिक फाइलें अपलोड नहीं की जा सकतीं।');
        }

        const largeVideo = videos.find(v => v.size > 700 * 1024 * 1024);
        if (largeVideo) {
            return setError('वीडियो का साइज 700MB से छोटा होना चाहिए।');
        }

        const validFiles = [...images, ...videos];
        setMediaFiles(validFiles);
        
        const previews = validFiles.map(f => URL.createObjectURL(f));
        setMediaPreviews(previews);
        setIsSliderVideo(videos.length > 0);
        return;
`
    );

    // 4. In handleSubmit uploading:
    content = content.replace(
        `let mediaUrl = form.image;

            if (mediaFile) {
                setUploading(true);
                setUploadProgress(0);
                mediaUrl = await uploadToCloudinary(mediaFile, (percent: number) => {
                    setUploadProgress(percent);
                });
                setUploading(false);
            }

            if (!mediaUrl && !form.image) {
                setSaving(false);
                return setError('Image या Video अपलोड करना जरूरी है।');
            }`,
        `let mediaUrl = form.image;
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

            if (!mediaUrl && uploadedImages.length === 0) {
                setSaving(false);
                return setError('Image या Video अपलोड करना जरूरी है।');
            }`
    );

    // 5. In handleSubmit payload:
    content = content.replace(
        `image: mediaUrl,
                status: form.status,`,
        `image: mediaUrl,
                images: uploadedImages,
                status: form.status,`
    );

    // 6. Media Render UI
    content = content.replace(
        `{mediaPreview || form.image ? (
                                <div className="relative">
                                    <div className="relative h-44 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                                        {isSliderVideo || isVideoUrl(mediaPreview || form.image) ? (
                                            <video src={mediaPreview || form.image} controls className="max-h-full" />
                                        ) : (
                                            <img src={mediaPreview || form.image} alt="Preview" className="object-cover w-full h-full" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setMediaFile(null); setMediaPreview(''); setForm({ ...form, image: '' }); }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-400 hover:bg-red-50/50 transition group"
                                >
                                    <div className="flex gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                        <Video className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-red-500 font-medium">
                                        Image/Video अपलोड करें
                                    </span>
                                    <span className="text-xs text-gray-300">Unsigned Cloudinary Upload</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />`,
        `{mediaPreviews.length > 0 || (form.images && form.images.length > 0) || form.image ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(mediaPreviews.length > 0 ? mediaPreviews : (form.images?.length > 0 ? form.images : [form.image])).map((url, i) => (
                                            <div key={i} className="relative h-24 md:h-32 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                                                {isVideoUrl(url) ? (
                                                    <video src={url} className="object-cover w-full h-full" />
                                                ) : (
                                                    <img src={url} alt="Preview" className="object-cover w-full h-full" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setMediaFiles([]); setMediaPreviews([]); setForm({ ...form, image: '', images: [] }); }}
                                        className="w-full bg-red-100 text-red-600 hover:bg-red-200 py-2 rounded-xl font-semibold flex flex-row justify-center items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> मीडिया हटाएं
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-400 hover:bg-red-50/50 transition group"
                                >
                                    <div className="flex gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                        <Video className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-red-500 font-medium">
                                        Max 5 Photos + 1 Video
                                    </span>
                                    <span className="text-xs text-gray-300">वीडियो max 700MB</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />`
    );

    fs.writeFileSync('src/app/admin/posts/new/page.tsx', content);
    console.log('patched new post page');
}

function patchEditPost() {
    let content = fs.readFileSync('src/app/admin/posts/edit/[id]/page.tsx', 'utf-8');

    // 1. form state
    content = content.replace(
        `image: '',\n        status: 'published' as PostStatus,`,
        `image: '',\n        images: [] as string[],\n        status: 'published' as PostStatus,`
    );

    // 1.5 fetchPost update
    content = content.replace(
        `image: post.image,\n                    status: post.status || 'published',`,
        `image: post.image,\n                    images: post.images || [],\n                    status: post.status || 'published',`
    );
    content = content.replace(
        `setMediaPreview(post.image);`,
        `if (post.images && post.images.length > 0) {
                    setMediaPreviews(post.images);
                } else if (post.image) {
                    setMediaPreviews([post.image]);
                }`
    );

    // 2. Media states
    content = content.replace(
        `const [mediaFile, setMediaFile] = useState<File | null>(null);`,
        `const [mediaFiles, setMediaFiles] = useState<File[]>([]);`
    ).replace(
        `const [mediaPreview, setMediaPreview] = useState('');`,
        `const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);`
    );

    // 3. handleFileChange
    content = content.replace(
        `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {`,
        `const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setError('');
        const images = files.filter(f => f.type.startsWith('image/'));
        const videos = files.filter(f => f.type.startsWith('video/'));

        if (videos.length > 1) return setError('आप केवल 1 वीडियो अपलोड कर सकते हैं।');
        if (images.length > 5) return setError('आप अधिकतम 5 तस्वीरें अपलोड कर सकते हैं।');
        if (images.length + videos.length > 6) return setError('कुल मिलाकर 6 फ़ाइलें।');
        const largeVideo = videos.find(v => v.size > 700 * 1024 * 1024);
        if (largeVideo) return setError('वीडियो का साइज 700MB से छोटा होना चाहिए।');

        const validFiles = [...images, ...videos];
        setMediaFiles(validFiles);
        setMediaPreviews(validFiles.map(f => URL.createObjectURL(f)));
        setIsSliderVideo(videos.length > 0);
        return;
`
    );

    // 4. In handleSubmit uploading:
    content = content.replace(
        `let mediaUrl = form.image;
            if (mediaFile) {
                setUploading(true);
                setUploadProgress(0);
                mediaUrl = await uploadToCloudinary(mediaFile, (percent: number) => {
                    setUploadProgress(percent);
                });
                setUploading(false);
            }`,
        `let mediaUrl = form.image;
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
            }`
    );

    // 5. In handleSubmit payload:
    content = content.replace(
        `image: mediaUrl,
                status: form.status,`,
        `image: mediaUrl,
                images: uploadedImages,
                status: form.status,`
    );

    // 6. Media Render UI
    content = content.replace(
        `{mediaPreview || form.image ? (
                                <div className="relative">
                                    <div className="relative h-44 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                                        {isSliderVideo || isVideoUrl(mediaPreview || form.image) ? (
                                            <video src={mediaPreview || form.image} controls className="max-h-full" />
                                        ) : (
                                            <img src={mediaPreview || form.image} alt="Preview" className="object-cover w-full h-full" />
                                        )}
                                    </div>
                                    <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(''); setForm({ ...form, image: '' }); }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-400 transition group">
                                    <div className="flex gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                        <Video className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-red-500">Image/Video Upload करें</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                            <div className="mt-3">
                                <label className="block text-xs text-gray-500 mb-1">या मीडिया URL</label>
                                <input type="url" value={form.image} onChange={(e) => { setForm({ ...form, image: e.target.value }); setMediaPreview(''); }}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
                            </div>`,
        `{mediaPreviews.length > 0 || (form.images && form.images.length > 0) || form.image ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(mediaPreviews.length > 0 ? mediaPreviews : (form.images?.length > 0 ? form.images : [form.image])).map((url, i) => (
                                            <div key={i} className="relative h-24 md:h-32 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                                                {isVideoUrl(url) ? (
                                                    <video src={url} className="object-cover w-full h-full" />
                                                ) : (
                                                    <img src={url} alt="Preview" className="object-cover w-full h-full" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setMediaFiles([]); setMediaPreviews([]); setForm({ ...form, image: '', images: [] }); }}
                                        className="w-full bg-red-100 text-red-600 hover:bg-red-200 py-2 rounded-xl font-semibold flex flex-row justify-center items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> मीडिया हटाएं
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-400 transition group">
                                    <div className="flex gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                        <Video className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-red-500">Max 5 Photos + 1 Video</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                            <div className="mt-3">
                                <label className="block text-xs text-gray-500 mb-1">या मीडिया URL</label>
                                <input type="url" value={form.images?.[0] || form.image} onChange={(e) => { setForm({ ...form, image: e.target.value, images: [e.target.value] }); setMediaPreviews([]); }}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50" />
                            </div>`
    );

    fs.writeFileSync('src/app/admin/posts/edit/[id]/page.tsx', content);
    console.log('patched edit post page');
}

patchNewPost();
patchEditPost();
