import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Jacket from "./assets/cloth_jacket.glb"; 

let container = document.getElementById("threeContainer");
let textureSelector = document.getElementById("imageSelector");
let colorSelector = document.getElementById("colorPicker");
let shadowToggleButton = document.getElementById("toggleShadow");
let glossyToggleButton = document.getElementById("toggleGlossy");
// let resetButton = document.getElementById("resetPosition");

let camera, scene, renderer, orbitControls, mesh, material;
let shadowEnabled = true;  // Default shadow setting 
let glossyEnabled = false; // Default glossy setting
let model;
var cameraPos

const init = () => {

  scene = new THREE.Scene();
   
  camera = new THREE.PerspectiveCamera(
    20,
    container.clientWidth / container.clientHeight,
    1e-5,
    1e10
  );
  scene.add(camera);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 5, 2);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 20;
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.4;
  ground.receiveShadow = true;
  scene.add(ground);

  renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  renderer.setClearColor(0xffffff);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.07;
  orbitControls.autoRotate = true;

  const loader = new GLTFLoader();
   cameraPos = new THREE.Vector3(-0.2, 0.4, 8);

  loader.load(Jacket, (gltf) => {
    model = gltf.scene;
    model.updateMatrixWorld();

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    orbitControls.maxDistance = size.length() * 50;

    model.position.sub(center);
    camera.position.copy(center).add(size.multiply(cameraPos));
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    //   console.log(obj)
      if (obj.isMesh && obj.name === "defaultMaterial001") {
        material = obj.material;
        mesh = obj;

        textureSelector.addEventListener("input", (e) => {
          material.map = convertImageToTexture(e.target.value);
        });
      } else if (obj.isMesh && obj.name === "defaultMaterial") {
        colorSelector.addEventListener("input", (e) => {
          obj.material.color.set(e.target.value);
        });
      }
    });

    scene.add(model);
    onWindowResize();
  });

  shadowToggleButton.addEventListener("click", () => {
    shadowEnabled = !shadowEnabled;
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = shadowEnabled;
        obj.receiveShadow = shadowEnabled;
      }
    });
    // console.log("Shadow Enabled:", shadowEnabled);
  });

  glossyToggleButton.addEventListener("click", () => {
    glossyEnabled = !glossyEnabled;
    if (material) {
      material.shininess = glossyEnabled ? 50 : 5;
      material.roughness = 0;
      material.needsUpdate = true;
    }
    console.log("Glossy Enabled:", glossyEnabled);
  });

//   resetButton.addEventListener("click", () => {
//     if (model) {
//       model.position.set(0, 0, 0);
//       model.rotation.set(0, 0, 0);
//       camera.position.set(0, 2, 3); // Reset camera position
//       orbitControls.target.set(0, 0, 0); // Reset target
//     }
//   });
};

const convertImageToTexture = (path) => {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(path);
  tex.encoding = THREE.sRGBEncoding;
  tex.flipY = false;
  return tex;
};

const onWindowResize = () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
};

const animate = () => {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
};

window.addEventListener("resize", onWindowResize);

init();
animate();
