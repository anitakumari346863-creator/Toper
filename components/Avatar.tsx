import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AvatarProps {
  isActive: boolean;
  isSpeaking: boolean;
  volume: number; // 0 to 1 (User's Mic Volume)
}

export const Avatar: React.FC<AvatarProps> = ({ isActive, isSpeaking, volume }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  
  // Refs for animation loop access to avoid re-renders
  const isActiveRef = useRef(isActive);
  const isSpeakingRef = useRef(isSpeaking);
  const volumeRef = useRef(volume);

  // Update refs when props change
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 20;
    camera.position.y = 0; 

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(400, 500);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const group = new THREE.Group();
    scene.add(group);

    // --- Anime Spirit Character Generation ---
    const particleCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const types = new Float32Array(particleCount); // 0:Hair, 1:Face, 2:Body, 3:LArm, 4:RArm, 5:Aura
    
    // Anime Energy Palette
    const coreColor = new THREE.Color(0xffffff); // Core White
    const skinColor = new THREE.Color(0xaaddff); // Pale Cyan Skin
    const armorColor = new THREE.Color(0x112244); // Dark Blue Armor
    const auraColor = new THREE.Color(0x00ffff); // Cyan Aura

    let pIndex = 0;

    const addParticle = (x: number, y: number, z: number, color: THREE.Color, type: number) => {
        if (pIndex >= particleCount) return;
        positions[pIndex * 3] = x;
        positions[pIndex * 3 + 1] = y;
        positions[pIndex * 3 + 2] = z;
        
        initialPositions[pIndex * 3] = x;
        initialPositions[pIndex * 3 + 1] = y;
        initialPositions[pIndex * 3 + 2] = z;

        colors[pIndex * 3] = color.r;
        colors[pIndex * 3 + 1] = color.g;
        colors[pIndex * 3 + 2] = color.b;

        types[pIndex] = type;
        pIndex++;
    };

    // 1. Spiky Anime Hair (Type 0)
    for(let i=0; i<1500; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 1.8 * Math.cbrt(Math.random()); 
        
        let x = r * Math.sin(phi) * Math.cos(theta);
        let y = 6.0 + r * Math.sin(phi) * Math.sin(theta); 
        let z = r * Math.cos(phi);

        let col = skinColor;
        
        // Hair zone logic
        if (y > 6.5 || z < -0.5) {
             col = auraColor;
             // Big Spikes
             if (Math.random() > 0.7) {
                const spikeLen = 1 + Math.random();
                x *= spikeLen;
                y += Math.random() * 2;
                z *= spikeLen;
             }
        }
        addParticle(x, y, z, col, 0);
    }

    // 2. Face & Eyes (Type 1)
    for(let i=0; i<500; i++) {
        const theta = Math.random() * Math.PI; // Front hemisphere
        const phi = Math.random() * Math.PI;
        const r = 1.7;

        let x = r * Math.sin(phi) * Math.cos(theta);
        let y = 6.0 + r * Math.sin(phi) * Math.sin(theta);
        let z = r * Math.cos(phi);

        // Filter to front face only
        if (z > 0.5 && y > 5.5 && y < 7.5 && Math.abs(x) < 1.5) {
             addParticle(x, y, z, skinColor, 1);
        }
    }


    // 3. Armor/Torso (Type 2)
    for(let i=0; i<2000; i++) {
        const yNorm = Math.random(); 
        const y = yNorm * 5; 
        const widthAtY = 1.5 + (y/5) * 3.0; // Broad shoulders
        
        const x = (Math.random() - 0.5) * widthAtY;
        const z = (Math.random() - 0.5) * 2.0;

        let col = armorColor;
        if (y > 3 && y < 4 && Math.abs(x) < 0.5 && z > 0.5) {
            col = coreColor;
        }
        addParticle(x, y, z, col, 2);
    }

    // 4. Arms (Type 3: Left, Type 4: Right)
    const createArm = (xOffset: number, type: number) => {
        for(let i=0; i<800; i++) {
            const y = 4.5 - Math.random() * 6; 
            const r = 0.8;
            const theta = Math.random() * Math.PI * 2;
            const localX = r * Math.cos(theta);
            const localZ = r * Math.sin(theta);
            
            let col = armorColor;
            if (y < 0) col = auraColor; 

            addParticle(xOffset + localX, y, localZ, col, type);
        }
    }
    createArm(-3, 3); // Left
    createArm(3, 4);  // Right

    // 5. Aura (Type 5)
    for(let i=0; i<500; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 5;
        const x = r * Math.cos(theta);
        const y = Math.random() * 12 - 2;
        const z = r * Math.sin(theta);
        addParticle(x, y, z, auraColor, 5);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('type', new THREE.BufferAttribute(types, 1));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geometry, material);
    group.add(mesh);

    // --- Typing Indicator (Holographic Dots) ---
    // Visual cue for AI responding
    const indicatorGroup = new THREE.Group();
    scene.add(indicatorGroup);

    const dotGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.9 
    });
    
    const dots: THREE.Mesh[] = [];
    for(let i=0; i<3; i++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(2.2 + i * 0.5, 6.5, 0.5); 
        dots.push(dot);
        indicatorGroup.add(dot);
    }
    indicatorGroup.visible = false;

    // --- Animation Loop ---
    let frameId = 0;
    let time = 0;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        time += 0.05;

        // Access current props from refs
        const active = isActiveRef.current;
        const speaking = isSpeakingRef.current;
        const vol = volumeRef.current;

        // --- Typing Indicator Logic ---
        if (speaking) {
            indicatorGroup.visible = true;
            dots.forEach((dot, i) => {
                // Wave animation
                dot.position.y = 6.5 + Math.sin(time * 5 + i * 0.8) * 0.2;
                // Pulse opacity
                (dot.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(time * 5 + i * 0.8) * 0.5;
            });
        } else {
            indicatorGroup.visible = false;
        }

        // --- Avatar Animation ---
        const posAttr = mesh.geometry.attributes.position;
        const types = mesh.geometry.attributes.type.array as Float32Array;
        const positionsArr = posAttr.array as Float32Array;
        const count = posAttr.count;

        // Idle Levitation
        group.position.y = Math.sin(time * 0.5) * 0.5 - 2;
        
        // Dynamics
        const expansion = vol * 0.3; 
        const blink = Math.sin(time * 0.5) > 0.98;
        
        const headBob = speaking ? Math.sin(time * 15) * 0.03 : 0;
        const headTilt = vol > 0.1 ? Math.sin(time * 2) * 0.05 : 0;

        for(let i=0; i<count; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            let x = initialPositions[ix];
            let y = initialPositions[iy];
            let z = initialPositions[iz];
            const type = types[i];

            if (type === 0 || type === 1) {
                y += headBob;
                x += headTilt;
            }

            // Face (Type 1)
            if (type === 1) {
                // Blink
                if (y > 6.3 && y < 6.7 && Math.abs(x) > 0.3 && Math.abs(x) < 0.9 && blink) {
                    y = 6.5; 
                }

                // Speech
                if (speaking && y > 5.8 && y < 6.2 &&