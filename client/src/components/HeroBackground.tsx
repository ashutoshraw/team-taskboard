import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Card {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
}

export default function HeroBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Card colors matching our accent palette
    const COLORS = [0x6c63ff, 0xa78bfa, 0x4c1d95, 0x7c3aed, 0x4caf82, 0x1e1b4b];

    const cards: Card[] = [];

    for (let i = 0; i < 18; i++) {
      const geometry = new THREE.BoxGeometry(1.4, 0.9, 0.04);
      const material = new THREE.MeshStandardMaterial({
        color: COLORS[i % COLORS.length],
        roughness: 0.3,
        metalness: 0.4,
        transparent: true,
        opacity: Math.random() * 0.25 + 0.1,
      });

      // Rounded feel via edge highlight
      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Scatter cards across the scene
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6 - 2
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      scene.add(mesh);
      cards.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.004,
        vy: (Math.random() - 0.5) * 0.004,
        vz: (Math.random() - 0.5) * 0.002,
        rx: (Math.random() - 0.5) * 0.003,
        ry: (Math.random() - 0.5) * 0.003,
      });
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6c63ff, 3, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa78bfa, 2, 30);
    pointLight2.position.set(-5, -5, 3);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x4caf82, 1.5, 20);
    pointLight3.position.set(0, 5, -2);
    scene.add(pointLight3);

    // Mouse parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      cards.forEach((card, i) => {
        // Float movement
        card.mesh.position.x += card.vx + Math.sin(t * 0.2 + i) * 0.001;
        card.mesh.position.y += card.vy + Math.cos(t * 0.15 + i) * 0.001;
        card.mesh.position.z += card.vz;

        // Slow rotation
        card.mesh.rotation.x += card.rx;
        card.mesh.rotation.y += card.ry;

        // Mouse parallax on whole scene
        card.mesh.position.x += mouse.x * 0.01 * (i % 3 === 0 ? 1 : -0.5);
        card.mesh.position.y += mouse.y * 0.01 * (i % 2 === 0 ? 1 : -0.5);

        // Wrap around edges so cards never disappear
        if (card.mesh.position.x > 10) card.mesh.position.x = -10;
        if (card.mesh.position.x < -10) card.mesh.position.x = 10;
        if (card.mesh.position.y > 7) card.mesh.position.y = -7;
        if (card.mesh.position.y < -7) card.mesh.position.y = 7;
        if (card.mesh.position.z > 2) card.mesh.position.z = -6;
        if (card.mesh.position.z < -6) card.mesh.position.z = 2;
      });

      // Animate lights
      pointLight1.position.x = Math.sin(t * 0.3) * 6;
      pointLight1.position.y = Math.cos(t * 0.2) * 6;
      pointLight2.position.x = Math.cos(t * 0.25) * 6;
      pointLight2.position.y = Math.sin(t * 0.35) * 6;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      cards.forEach((c) => {
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
      });
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}