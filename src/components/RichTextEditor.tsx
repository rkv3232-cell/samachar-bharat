'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-50 animate-pulse rounded-xl border border-gray-200" />
});

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const modules = {
    toolbar: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet'
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    return (
        <div className="quill-editor-wrapper">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white rounded-xl overflow-hidden"
            />
            <style jsx global>{`
                .quill-editor-wrapper .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    background: #f9fafb;
                    border-radius: 12px 12px 0 0;
                }
                .quill-editor-wrapper .ql-container {
                    border: none !important;
                    min-height: 300px;
                    font-size: 1rem;
                }
                .quill-editor-wrapper .ql-editor {
                    min-height: 300px;
                    line-height: 1.6;
                    color: #374151;
                    padding: 1.25rem;
                }
                .quill-editor-wrapper .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
                .quill-editor-wrapper .ql-editor h2 {
                    font-weight: 800;
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                .quill-editor-wrapper .ql-editor h3 {
                    font-weight: 700;
                    font-size: 1.25rem;
                    margin-bottom: 0.5rem;
                }
            `}</style>
        </div>
    );
}
