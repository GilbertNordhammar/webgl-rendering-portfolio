import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Vector4, Matrix4, Light } from "three"
import { loadShaderCode } from "@lib/shaderUtils"
import VectorFields from "@components/VectorFields"

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let mesh: THREE.Mesh;
let material: THREE.ShaderMaterial

const sun = new THREE.DirectionalLight(0xFFFFFF, 1)
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2)

const init = async () => {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10)
  camera.position.z = 1

  scene = new THREE.Scene()
  scene.add(ambientLight)
  scene.add(sun)

  let vertexShader: string = await loadShaderCode("pbr-pipeline/vert.glsl");
  let fragmentShader: string = await loadShaderCode("pbr-pipeline/frag.glsl");

  let modelMatrix = new Matrix4()
  modelMatrix.multiply(camera.modelViewMatrix)

  console.log(THREE.UniformsLib)

  scene.getObjectById
  const uniforms = {
    ...THREE.UniformsLib["lights"],
    directionalLightsCount: { value: 1 },
    sunStrength: { value: 1 }
  }

  material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    lights: true
  });
  material.defines = {
    MAX_DIRECTIONAL_LIGHTS: 1
  }
  material.lights = true;

  let geometry = new THREE.SphereGeometry(0.2, 32, 32);
  mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}

function animation(time) {
  mesh.rotation.x = time / 2000;
  mesh.rotation.y = time / 1000;

  renderer.render(scene, camera);
}

export default function PBRPipeline() {
  useEffect(() => {
    init();
  }, [])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-evenly" }}>
        <VectorFields
          label="Sun Direction"
          dimensions={3}
          vectorType="position"
          inputType="slider"
          defaultValue={new Vector3(1, 0, 0.6)}
          minValue={-1}
          maxValue={1}
          onChange={pos => {
            sun.position.set(pos.x, pos.y, pos.z);
          }}
        />
        <VectorFields
          label="Sun Color"
          dimensions={3}
          vectorType="color"
          inputType="slider"
          defaultValue={new Vector3(1, 1, 1)}
          minValue={0}
          maxValue={1}
          onChange={color => {
            sun.color.set(new THREE.Color(color.x, color.y, color.z))
          }}
        />
        <VectorFields
          label="Sun Strength"
          dimensions={1}
          vectorType="color"
          inputType="slider"
          defaultValue={0.35}
          minValue={0}
          maxValue={1}
          onChange={value => {
            sun.intensity = value.x;
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-evenly", marginTop: "20px" }}>
        <VectorFields
          label="Ambient Color"
          dimensions={3}
          vectorType="color"
          inputType="slider"
          defaultValue={new Vector3(0.1, 0.1, 0.1)}
          minValue={0}
          maxValue={1}
          onChange={color => {
            ambientLight.color.set(new THREE.Color(color.x, color.y, color.z));
          }}
        />
      </div>
    </div>
  )
}
