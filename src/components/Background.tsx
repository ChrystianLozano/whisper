export function Background() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030014]">
            {/* Malla base oscura con un sutil gradiente radial en la parte superior para dar luz al título */}
            <div className="absolute top-0 z-[-1] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />

            {/* Orbes de luz mucho más grandes y vibrantes usando 'screen' para el brillo */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/30 mix-blend-screen filter blur-[120px] animate-blob" />
            <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 mix-blend-screen filter blur-[150px] animate-blob" style={{ animationDelay: '4s' }} />

            {/* Una capa extra para oscurecer un poco y permitir contraste */}
            <div className="absolute inset-0 bg-transparent backdrop-blur-[50px] z-10 pointer-events-none" />
        </div>
    );
}
