"use client";

export default function Footer() {
    return (
        <footer className="py-8 text-center border-t border-gray-100 mt-10">
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                © {new Date().getFullYear()} SAMACHAR BHARAT
            </p>
        </footer>
    );
}
