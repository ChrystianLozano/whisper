import { Mic2, Github } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass-panel border-t-0 border-l-0 border-r-0 rounded-none flex justify-between items-center"
        >
            <div className="flex items-center gap-2">
                <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                    <Mic2 className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Whisper Web
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <a
                    href="https://github.com/xenova/transformers.js"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors flex items-center gap-2"
                >
                    <Github className="w-5 h-5" />
                    <span className="hidden sm:inline">Powered by Transformers.js</span>
                </a>
            </div>
        </motion.header>
    );
}
