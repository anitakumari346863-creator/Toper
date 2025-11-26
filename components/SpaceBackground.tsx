import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SpaceBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Deep Midnight Blue/Black for that "Anime Night" vibe
    scene.background = new THREE.Color(0x050714); 
    scene.fog = new THREE.FogExp2(0x050714, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Enable shadow map for dramatic lighting possibilities
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 0. Lighting (Critical for Cel-Shading) ---
    const ambientLight = new THREE.AmbientLight(0x404060, 1.5); // Cool ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaabbff, 3); // Bright key light
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.SpotLight(0x00ffff, 5); // Cyan Rim light
    rimLight.position.set(-10, 10, -5);
    rimLight.lookAt(0,0,0);
    scene.add(rimLight);

    // --- 1. God Rays (Volumetric Light Beams) ---
    const rayGeo = new THREE.ConeGeometry(4, 30, 32, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    
    const raysGroup = new THREE.Group();
    // Create a few intersecting beams
    for(let i=0; i<3; i++) {
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.position.set(0, 10, -5);
        ray.rotation.x = Math.PI / 1.2; // Pointing down/forward
        ray.rotation.z = (Math.random() - 0.5) * 1.5;
        ray.scale.set(1 + Math.random(), 1, 1 + Math.random());
        raysGroup.add(ray);
    }
    scene.add(raysGroup);


    // --- 2. Cel-Shaded Floating Shards (Debris) ---
    // Create a simple gradient map for toon shading effect
    const threeTone = new THREE.DataTexture(
        new Uint8Array([0, 0, 0, 128, 128, 128, 255, 255, 255]),
        3, 1,
        THREE.RedFormat
    );
    threeTone.minFilter = THREE.NearestFilter;
    threeTone.magFilter = THREE.NearestFilter;
    threeTone.needsUpdate = true;

    const shardGeo = new THREE.IcosahedronGeometry(0.5, 0);
    const shardMat = new THREE.MeshToonMaterial({
        color: 0x223355,
        gradientMap: threeTone,
        side: THREE.DoubleSide,
    });

    const shards: THREE.Mesh[] = [];
    const shardsGroup = new THREE.Group();
    for(let i=0; i<40; i++) {
        const shard = new THREE.Mesh(shardGeo, shardMat);
        shard.position.set(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10 - 2
        );
        shard.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
        const scale = Math.random() * 0.5 + 0.1;
        shard.scale.set(scale, scale, scale);
        shards.push(shard);
        shardsGroup.add(shard);
    }
    scene.add(shardsGroup);


    // --- 3. Anime "Power Aura" Floor ---
    const auraGeo = new THREE.RingGeometry(3, 8, 32);
    const auraMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.rotation.x = -Math.PI / 2;
    auraMesh.position.y = -6;
    scene.add(auraMesh);


    // --- 4. Stylized "Never Give Up" Text ---
    const createAnimeTextTexture = (text: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            
            ctx.font = 'italic 900 130px Arial, sans-serif'; // Italic for action feel
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Outer Glow (Cyan)
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'white';
            ctx.fillText(text, canvas.width/2, canvas.height/2);
            
            // Sharp Outline
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#00aaaa';
            ctx.lineWidth = 5;
            ctx.strokeText(text, canvas.width/2, canvas.height/2);
        }
        return new THREE.CanvasTexture(canvas);
    };

    const textTexture = createAnimeTextTexture("NEVER GIVE UP");
    const textMat = new THREE.MeshBasicMaterial({ 
        map: textTexture, 
        transparent: true, 
        side: THREE.DoubleSide,
        depthTest: false 
    });
    const textGeo = new THREE.PlaneGeometry(16, 4);
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(0, 6.5, -5); 
    scene.add(textMesh);


    // --- 5. Speed Lines (Subtle Action Lines) ---
    const lineGeo = new THREE.BufferGeometry();
    const lineCount = 100; // Fewer, sharper lines
    const linePos = new Float32Array(lineCount * 6);
    
    for(let i=0; i<lineCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r1 = 10 + Math.random() * 5;
        const r2 = 30 + Math.random() * 10;
        
        linePos[i*6] = r1 * Math.cos(theta);
        linePos[i*6+1] = r1 * Math.sin(theta);
        linePos[i*6+2] = -5;
        
        linePos[i*6+3] = r2 * Math.cos(theta);
        linePos[i*6+4] = r2 * Math.sin(theta);
        linePos[i*6+5] = -2;
    }
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ 
        color: 0xaaddff, // Pale blue
        transparent: true, 
        opacity: 0.3 
    });
    const speedLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(speedLines);


    // --- Mouse Interaction ---
    const onMouseMove = (event: MouseEvent) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const handleResize = () => {
        if (!containerRef.current) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);


    // --- Animation Loop ---
    const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        // Parallax
        camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.05;
        camera.position.y += (mouseRef.current.y * 2 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Rotate God Rays
        raysGroup.rotation.z = Math.sin(time * 0.2) * 0.2;
        raysGroup.rotation.y += 0.002;

        // Float Shards
        shards.forEach((shard, i) => {
            shard.rotation.x += 0.01;
            shard.rotation.y += 0.01;
            shard.position.y += Math.sin(time + i) * 0.01;
        });

        // Rotate Aura
        auraMesh.rotation.z -= 0.01;

        // Pulse Text
        const scale = 1 + Math.sin(time * 2) * 0.02;
        textMesh.scale.set(scale, scale, scale);
        
        // Speed lines rotation (Action feel)
        speedLines.rotation.z += 0.002;

        renderer.render(scene, camera);
    };
    animate();

    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        if (containerRef.current && rendererRef.current) {
            containerRef.current.removeChild(rendererRef.current.domElement);
        }
        renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none bg-black"
    />
  );
};
