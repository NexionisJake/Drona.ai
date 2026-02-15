'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

const codeSnippets = [
    {
        raw: `def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()`,
        explanation: `GURU INSIGHT:
-------------------
• Architecture: FastAPI Route
• Mechanism: Dependency Injection
• Query: Secure SQLAlchemy ORM lookup

Status: Validated.`
    },
    {
        raw: `async function fetchUserData(userId) {
  try {
    const res = await fetch(\`/api/users/\${userId}\`);
    if (!res.ok) throw new Error('Network fail');
    return await res.json();
  } catch (error) {
    return null;
  }
}`,
        explanation: `GURU INSIGHT:
-------------------
• Architecture: Async Client Fetch
• Mechanism: Promise-based HTTP
• Error Handling: Try/Catch active

Vulnerability Check: No exposed API keys.
Status: Validated.`
    }
];

const ASCII_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(){}[]<>;:,._-+=!@#$%^&*|\\/\"'`~?";
const generateCode = (length: number): string => {
    let text = "";
    for (let i = 0; i < length; i++) {
        text += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
    }
    return text;
};

const ScannerCardStream = ({
    initialSpeed = 80,
    direction = -1,
    repeat = 6,
    cardGap = 24,
}: {
    initialSpeed?: number;
    direction?: number;
    repeat?: number;
    cardGap?: number;
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sizeRef = useRef({ width: 300, height: 400 });

    const cards = useMemo(() => {
        const totalCards = codeSnippets.length * repeat;
        return Array.from({ length: totalCards }, (_, i) => ({
            id: i,
            data: codeSnippets[i % codeSnippets.length],
        }));
    }, [repeat]);

    const cardLineRef = useRef<HTMLDivElement>(null);
    const particleCanvasRef = useRef<HTMLCanvasElement>(null);
    const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
    const originalExplanations = useRef(new Map<number, string>());

    const cardWidth = 240;
    const cardHeight = 140;

    const cardStreamState = useRef({
        position: 0,
        velocity: initialSpeed,
        direction: direction,
        isDragging: false,
        lastTime: performance.now(),
        cardLineWidth: (cardWidth + cardGap) * codeSnippets.length * repeat,
    });

    const scannerState = useRef({ isScanning: false });

    useEffect(() => {
        const cardLine = cardLineRef.current;
        const particleCanvas = particleCanvasRef.current;
        const scannerCanvas = scannerCanvasRef.current;
        const container = containerRef.current;

        if (!cardLine || !particleCanvas || !scannerCanvas || !container) return;

        // --- ResizeObserver for dynamic sidebar sizing ---
        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            sizeRef.current = { width: rect.width, height: rect.height };
        };
        updateSize();

        const resizeObserver = new ResizeObserver(() => {
            updateSize();
            // Update renderer and canvases on resize
            const { width, height } = sizeRef.current;
            renderer.setSize(width, height);
            camera.left = -width / 2;
            camera.right = width / 2;
            camera.top = height / 2;
            camera.bottom = -height / 2;
            camera.updateProjectionMatrix();
            scannerCanvas.width = width;
            scannerCanvas.height = height;
        });
        resizeObserver.observe(container);

        let { width, height } = sizeRef.current;

        cards.forEach(card => originalExplanations.current.set(card.id, card.data.explanation));
        let animationFrameId: number;

        // --- Three.js setup using container dimensions ---
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(
            -width / 2, width / 2, height / 2, -height / 2, 1, 1000
        );
        camera.position.z = 100;
        const renderer = new THREE.WebGLRenderer({
            canvas: particleCanvas,
            alpha: true,
            antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        // --- Background particle system ---
        const particleCount = 60;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);
        const alphas = new Float32Array(particleCount);

        const texCanvas = document.createElement("canvas");
        texCanvas.width = 100;
        texCanvas.height = 100;
        const texCtx = texCanvas.getContext("2d")!;
        const half = 50;
        const gradient = texCtx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0.025, "#fff");
        gradient.addColorStop(0.1, `hsl(280, 80%, 40%)`);
        gradient.addColorStop(0.25, `hsl(280, 80%, 10%)`);
        gradient.addColorStop(1, "transparent");
        texCtx.fillStyle = gradient;
        texCtx.arc(half, half, half, 0, Math.PI * 2);
        texCtx.fill();
        const texture = new THREE.CanvasTexture(texCanvas);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * width * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * height;
            positions[i * 3 + 2] = 0;
            velocities[i] = Math.random() * 40 + 20;
            alphas[i] = (Math.random() * 8 + 2) / 10;
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: { pointTexture: { value: texture } },
            vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 12.0;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: false,
        });
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // --- Scanner line particle canvas ---
        const ctx = scannerCanvas.getContext('2d')!;
        scannerCanvas.width = width;
        scannerCanvas.height = height;

        let scannerParticles: {
            x: number; y: number; vx: number; vy: number;
            radius: number; alpha: number; life: number; decay: number;
        }[] = [];
        const baseMaxParticles = 80;
        let currentMaxParticles = baseMaxParticles;
        const scanTargetMaxParticles = 300;

        const createScannerParticle = () => {
            const w = sizeRef.current.width;
            const h = sizeRef.current.height;
            return {
                x: w / 2 + (Math.random() - 0.5) * 4,
                y: Math.random() * h,
                vx: Math.random() * 1.5 + 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 0.8 + 0.3,
                alpha: Math.random() * 0.5 + 0.5,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.01,
            };
        };
        for (let i = 0; i < baseMaxParticles; i++) scannerParticles.push(createScannerParticle());

        // --- Scramble effect ---
        const runScrambleEffect = (element: HTMLElement, cardId: number) => {
            if (element.dataset.scrambling === 'true') return;
            element.dataset.scrambling = 'true';
            const finalExplanation = originalExplanations.current.get(cardId) || '';
            let scrambleCount = 0;
            const interval = setInterval(() => {
                element.textContent = generateCode(finalExplanation.length).replace(/(.{28})/g, "$1\n");
                scrambleCount++;
                if (scrambleCount >= 10) {
                    clearInterval(interval);
                    element.textContent = finalExplanation;
                    delete element.dataset.scrambling;
                }
            }, 40);
        };

        // --- Card intersection logic ---
        const updateCardEffects = () => {
            const w = sizeRef.current.width;
            const scannerX = w / 2;
            const scannerWidth = 8;
            const scannerLeft = scannerX - scannerWidth / 2;
            const scannerRight = scannerX + scannerWidth / 2;
            let anyCardIsScanning = false;

            const containerRect = container.getBoundingClientRect();

            cardLine.querySelectorAll<HTMLElement>(".card-wrapper").forEach((wrapper, index) => {
                const rect = wrapper.getBoundingClientRect();
                const rawCodeLayer = wrapper.querySelector<HTMLElement>(".card-raw")!;
                const explanationLayer = wrapper.querySelector<HTMLElement>(".card-explanation")!;
                const explanationText = explanationLayer?.querySelector<HTMLElement>('pre');
                if (!rawCodeLayer || !explanationLayer || !explanationText) return;

                const relativeLeft = rect.left - containerRect.left;
                const relativeRight = rect.right - containerRect.left;

                if (relativeLeft < scannerRight && relativeRight > scannerLeft) {
                    anyCardIsScanning = true;
                    if (wrapper.dataset.scanned !== 'true') runScrambleEffect(explanationText, index);
                    wrapper.dataset.scanned = 'true';
                    const intersectLeft = Math.max(scannerLeft - relativeLeft, 0);
                    const intersectRight = Math.min(scannerRight - relativeLeft, rect.width);
                    rawCodeLayer.style.setProperty("--clip-right", `${(intersectLeft / rect.width) * 100}%`);
                    explanationLayer.style.setProperty("--clip-left", `${(intersectRight / rect.width) * 100}%`);
                } else {
                    delete wrapper.dataset.scanned;
                    if (relativeRight < scannerLeft) {
                        rawCodeLayer.style.setProperty("--clip-right", "100%");
                        explanationLayer.style.setProperty("--clip-left", "100%");
                    } else {
                        rawCodeLayer.style.setProperty("--clip-right", "0%");
                        explanationLayer.style.setProperty("--clip-left", "0%");
                    }
                }
            });
            setIsScanning(anyCardIsScanning);
            scannerState.current.isScanning = anyCardIsScanning;
        };

        // --- Main animation loop ---
        const animate = (currentTime: number) => {
            const w = sizeRef.current.width;
            const h = sizeRef.current.height;
            const deltaTime = (currentTime - cardStreamState.current.lastTime) / 1000;
            cardStreamState.current.lastTime = currentTime;

            cardStreamState.current.position += cardStreamState.current.velocity * cardStreamState.current.direction * deltaTime;

            const { position, cardLineWidth } = cardStreamState.current;
            const containerWidth = container.offsetWidth || 0;
            if (position < -cardLineWidth) cardStreamState.current.position = containerWidth;
            else if (position > containerWidth) cardStreamState.current.position = -cardLineWidth;

            cardLine.style.transform = `translateX(${cardStreamState.current.position}px)`;
            updateCardEffects();

            // Update Three.js particles
            const time = currentTime * 0.001;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i] * 0.016;
                if (positions[i * 3] > w / 2 + 50) positions[i * 3] = -w / 2 - 50;
                positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.3;
                alphas[i] = Math.max(0.1, Math.min(1, alphas[i] + (Math.random() - 0.5) * 0.05));
            }
            geometry.attributes.position.needsUpdate = true;
            (geometry.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
            renderer.render(scene, camera);

            // Scanner line particles
            ctx.clearRect(0, 0, w, h);
            const targetCount = scannerState.current.isScanning ? scanTargetMaxParticles : baseMaxParticles;
            currentMaxParticles += (targetCount - currentMaxParticles) * 0.05;
            while (scannerParticles.length < currentMaxParticles) scannerParticles.push(createScannerParticle());
            while (scannerParticles.length > currentMaxParticles) scannerParticles.pop();

            scannerParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0 || p.x > w) Object.assign(p, createScannerParticle());
                ctx.globalAlpha = p.alpha * p.life;
                ctx.fillStyle = "#ec4899";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            texture.dispose();
        };
    }, [cards, cardGap]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
        >
            <style>{`
        @keyframes decryptPulse {
          0%, 16%, 50%, 100% { opacity: 1; }
          15%, 99% { opacity: 0.8; }
          49% { opacity: 0.6; }
        }
        .animate-decrypt {
          animation: decryptPulse 0.15s infinite linear alternate-reverse;
        }
        @keyframes scanPulse {
          0% { opacity: 0.6; transform: scaleY(1) translateX(-50%); }
          100% { opacity: 1; transform: scaleY(1.05) translateX(-50%); }
        }
        .animate-scan-pulse {
          animation: scanPulse 1.5s infinite alternate ease-in-out;
        }
      `}</style>

            {/* Three.js background particles */}
            <canvas
                ref={particleCanvasRef}
                className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
            />
            {/* Scanner line particles */}
            <canvas
                ref={scannerCanvasRef}
                className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
            />

            {/* Scanner line */}
            <div
                className={`
          scanner-line absolute top-1/2 left-1/2 h-[80%] w-0.5 -translate-y-1/2
          bg-gradient-to-b from-transparent via-pink-500 to-transparent rounded-full
          transition-opacity duration-300 z-20 pointer-events-none animate-scan-pulse
          ${isScanning ? 'opacity-100' : 'opacity-40'}
        `}
                style={{ boxShadow: `0 0 10px #f472b6, 0 0 20px #ec4899, 0 0 40px #db2777` }}
            />

            {/* Card stream */}
            <div className="absolute w-full h-full flex items-center">
                <div
                    ref={cardLineRef}
                    className="flex items-center whitespace-nowrap will-change-transform"
                    style={{ gap: `${cardGap}px` }}
                >
                    {cards.map(card => (
                        <div
                            key={card.id}
                            className={`card-wrapper relative shrink-0`}
                            style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                        >
                            {/* Raw code layer (clips away as scanner passes) */}
                            <div className="card-raw card absolute top-0 left-0 w-full h-full rounded-xl overflow-hidden bg-[#1e1e1e] border border-zinc-800 p-3 z-[2] [clip-path:inset(0_0_0_var(--clip-right,0%))] shadow-lg">
                                <pre className="text-zinc-400 font-mono text-[8px] leading-[13px] whitespace-pre-wrap m-0">
                                    {card.data.raw}
                                </pre>
                            </div>
                            {/* Explanation layer (revealed by scanner) */}
                            <div className="card-explanation card absolute top-0 left-0 w-full h-full rounded-xl overflow-hidden bg-purple-950/80 border border-purple-500/50 p-3 z-[1] [clip-path:inset(0_calc(100%-var(--clip-left,0%))_0_0)] shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                <pre className="absolute top-3 left-3 text-pink-200 font-mono text-[8px] leading-[13px] whitespace-pre-wrap animate-decrypt m-0 p-0">
                                    {card.data.explanation}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlay label */}
            <div className="absolute bottom-3 left-0 right-0 text-center z-30 pointer-events-none">
                <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">
                    Drona.ai • Code Scanner Active
                </p>
            </div>
        </div>
    );
};

export default ScannerCardStream;
