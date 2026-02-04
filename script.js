// 3D Model Viewer for Bulkstein Island
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('model-container');
    const placeholder = container.querySelector('.model-placeholder');

    // Three.js setup
    let scene, camera, renderer, model, controls;
    let autoRotate = true;
    let isInteracting = false;

    function init() {
        // Scene
        scene = new THREE.Scene();

        // Camera
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        camera.position.set(0, 2, 5);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0x6666ff, 0.3);
        backLight.position.set(-5, 5, -5);
        scene.add(backLight);

        // Orbit Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.minDistance = 2;
            controls.maxDistance = 10;
            controls.enablePan = false;
            controls.autoRotate = false; // We'll handle auto-rotate manually

            controls.addEventListener('start', function() {
                isInteracting = true;
            });

            controls.addEventListener('end', function() {
                // Resume auto-rotate after 3 seconds of inactivity
                setTimeout(() => {
                    isInteracting = false;
                }, 3000);
            });
        }

        // Load GLB model
        loadModel();

        // Remove placeholder and add canvas
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        container.appendChild(renderer.domElement);

        // Handle resize
        window.addEventListener('resize', onWindowResize);

        // Start animation loop
        animate();
    }

    function loadModel() {
        const loader = new THREE.GLTFLoader();

        // Try to load the island model
        loader.load(
            'test1.glb', // Path to your GLB model
            function(gltf) {
                model = gltf.scene;

                // Center and scale the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                // Center the model
                model.position.x = -center.x;
                model.position.y = -center.y;
                model.position.z = -center.z;

                // Scale to fit
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.5 / maxDim;
                model.scale.setScalar(scale);

                // Enable shadows
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Rotate model to face camera (front view, more to the left)
                model.rotation.y = Math.PI * -0.5;

                scene.add(model);

                // Adjust camera - eye level, looking below so model appears higher, shifted left
                camera.position.set(-1.2, 0.8, 2.5);
                if (controls) {
                    controls.target.set(0, -1.2, 0);
                    controls.update();
                }

                console.log('Model loaded successfully!');
            },
            function(xhr) {
                // Progress callback
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    console.log('Loading: ' + Math.round(percentComplete) + '%');
                }
            },
            function(error) {
                console.log('Model not found or error loading. Place your .glb file at models/island.glb');
                console.error(error);

                // Show placeholder message
                if (placeholder) {
                    placeholder.style.display = 'flex';
                    placeholder.innerHTML = `
                        <span>3D Island Model</span>
                        <span class="model-hint">Place island.glb in /models folder</span>
                    `;
                }
            }
        );
    }

    function onWindowResize() {
        if (!camera || !renderer) return;

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Auto-rotate when not interacting
        if (model && !isInteracting) {
            model.rotation.y += 0.003; // Slow rotation
        }

        if (controls) {
            controls.update();
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    // Initialize if Three.js is loaded
    if (typeof THREE !== 'undefined') {
        init();
    } else {
        console.error('Three.js not loaded');
        if (placeholder) {
            placeholder.innerHTML = `
                <span>3D Viewer Error</span>
                <span class="model-hint">Three.js failed to load</span>
            `;
        }
    }
});
