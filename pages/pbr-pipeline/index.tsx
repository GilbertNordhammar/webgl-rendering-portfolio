import React, { useEffect, useState, useReducer, useCallback } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Vector4, Matrix4, Light, Scene, Camera, Object3D, Material } from "three"
import { loadShaderCode, loadTexture, loadMesh } from "@lib/resourceLoader"
import { PBRShaderMaterial } from "@lib/pbr"
import VectorFields from "@components/VectorFields"
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const MAX_DIRECTIONAL_LIGHTS = 1
const MAX_POINT_LIGHTS = 4

let g_Scene: THREE.Scene;
let g_Camera: THREE.PerspectiveCamera;
let g_Renderer: THREE.WebGLRenderer;

class RenderObject {
  constructor(params: { sceneObject: THREE.Object3D, materials: Array<PBRShaderMaterial> }) {
    this.sceneObject = params.sceneObject
    this.materials = params.materials
  }

  sceneObject: THREE.Object3D
  materials: Array<PBRShaderMaterial>
}
let g_CurrentRenderObject: RenderObject
const setCurrentRenderObject = (renderObject: RenderObject) => {
  if (g_CurrentRenderObject)
    g_Scene.remove(g_CurrentRenderObject.sceneObject)
  g_Scene.add(renderObject.sceneObject)
  g_CurrentRenderObject = renderObject
}

const g_Sun = new THREE.DirectionalLight(0xFFFFFF, 1)
const g_AmbientLight = new THREE.AmbientLight(0xFFFFFF, 0.2)
const g_Pointlights: THREE.PointLight[] = []
const g_DirectionalLights: THREE.DirectionalLight[] = []

const g_PointlightsMeshes: THREE.Mesh[] = []

let g_VertexShader
let g_FragmentShader

interface MeshAlternative {
  name: string,
  load: () => Promise<{ object: THREE.Object3D, materials: Array<PBRShaderMaterial> }>
}

const g_Meshes: Array<MeshAlternative> = [
  {
    name: "Sphere",
    load: async () => {
      const pbrMaterial = new PBRShaderMaterial({
        vertexShader: g_VertexShader,
        fragmentShader: g_FragmentShader,
      })

      const materialName = "ocean-rock"

      // if (uploadTextures["lastMaterial"] == materialName)
      //   return;
      // uploadTextures["lastMaterial"] = materialName

      pbrMaterial.albedoMap = await loadTexture(`pbr/${materialName}/albedo.png`, true)
      pbrMaterial.metalnessMap = await loadTexture(`pbr/${materialName}/metallic.png`, true)
      pbrMaterial.normalMap = await loadTexture(`pbr/${materialName}/normal.png`, true)
      pbrMaterial.roughnessMap = await loadTexture(`pbr/${materialName}/roughness.png`, true)
      pbrMaterial.ambientOcclusionMap = await loadTexture(`pbr/${materialName}/ao.png`, false)

      let geometry = new THREE.SphereGeometry(10, 32, 32);
      geometry.computeTangents()
      const mesh = new THREE.Mesh(geometry, pbrMaterial);

      return { object: mesh, materials: [pbrMaterial] }
    }
  },
  {
    name: "Dog House",
    load: async () => {
      const meshGroup = await loadMesh("meshes/dog_house/doghouse0908.gltf")
      const inPBRMaterial = new PBRShaderMaterial({
        vertexShader: g_VertexShader,
        fragmentShader: g_FragmentShader,
      })
      const outPBRMaterials: Array<PBRShaderMaterial> = []

      modifyMeshes({ object: meshGroup, inPBRMaterial, outPBRMaterials, scale: new Vector3(20, 20, 20) })
      return { object: meshGroup["scene"], materials: outPBRMaterials }
    }
  }
]

const g_PBRMaterialNames = ["ocean-rock", "rusted-metal"]
const g_defaultPBRMaterialName = g_PBRMaterialNames[0]

const init = async () => {
  g_Camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100)
  g_Camera.position.z = 40

  g_VertexShader = await loadShaderCode("pbr-pipeline/vert.glsl")
  g_FragmentShader = await loadShaderCode("pbr-pipeline/frag.glsl")

  g_Renderer = new THREE.WebGLRenderer({ antialias: true })
  g_Renderer.setSize(window.innerWidth, window.innerHeight)
  g_Renderer.setAnimationLoop(animation)

  g_Scene = new THREE.Scene()

  // Adding lights
  g_Scene.add(g_AmbientLight)

  addLight(g_Sun, g_Scene)

  const pointlight = new THREE.PointLight(0xFFFFFF, 1, 100)
  pointlight.position.set(12, 2, 0)
  addLight(pointlight, g_Scene)

  const { object, materials } = await g_Meshes[0].load()
  setCurrentRenderObject(new RenderObject({ sceneObject: object, materials }))
  console.log(g_CurrentRenderObject)
}

const modifyMeshes = (params: { object: THREE.Object3D, inPBRMaterial: PBRShaderMaterial, outPBRMaterials?: Array<PBRShaderMaterial>, scale?: Vector3 }) => {
  const { object, inPBRMaterial } = params

  if (params.object instanceof THREE.Mesh) {
    const mesh = params.object as THREE.Mesh
    mesh.geometry.computeTangents()
    if (params.scale)
      mesh.scale.set(params.scale.x, params.scale.y, params.scale.z)

    const newMaterial = new PBRShaderMaterial()
    newMaterial.vertexShader = inPBRMaterial.vertexShader
    newMaterial.fragmentShader = inPBRMaterial.fragmentShader
    newMaterial.copyPBRProperties(mesh.material as THREE.MeshStandardMaterial)
    mesh.material = newMaterial
    if (params.outPBRMaterials)
      params.outPBRMaterials.push(newMaterial)
  }

  const children = object["scene"] ? object["scene"].children : object.children
  children.forEach(object => modifyMeshes({ ...params, object }))
}

const addLight = (
  light: THREE.PointLight | THREE.DirectionalLight,
  scene: THREE.Scene
) => {
  let tooManyLights = false;

  if (light instanceof THREE.PointLight) {
    if (g_Pointlights.length + 1 <= MAX_POINT_LIGHTS) {
      g_Pointlights.push(light)

      const geometry = new THREE.SphereGeometry(1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(light.position)
      scene.add(sphere)
      g_PointlightsMeshes.push(sphere)
    }
    else {
      tooManyLights = true;
      console.log(`Too many pointlights! Maximum amount is ${MAX_POINT_LIGHTS}`)
    }
  }
  else if (light instanceof THREE.DirectionalLight) {
    if (g_DirectionalLights.length + 1 <= MAX_DIRECTIONAL_LIGHTS) {
      g_DirectionalLights.push(light)
    }
    else {
      tooManyLights = true;
      console.log(`Too many directional lights! Maximum amount is ${MAX_DIRECTIONAL_LIGHTS}`)
    }
  }

  if (!tooManyLights)
    scene.add(light)
}

const movePointLight = (index: number, position: Vector3) => {
  g_Pointlights[index].position.copy(position)
  g_PointlightsMeshes[index].position.copy(position)
}

const rotateAround = (rotatee: Object3D, origin: Vector3, up: Vector3, mouseMovement: Vector2) => {
  const originalDist = rotatee.position.distanceTo(origin)

  const right = new Vector3
  right.crossVectors(rotatee.getWorldDirection(origin), new Vector3(0, 1, 0))
  right.multiplyScalar(mouseMovement.x)

  rotatee.position.add(right)
  rotatee.position.y += mouseMovement.y;
  rotatee.lookAt(origin)

  const movement = new Vector3()
  movement.copy(rotatee.getWorldDirection(origin))
  movement.multiplyScalar(-originalDist)

  rotatee.position.copy(origin)
  rotatee.position.add(movement)
}

const animation = (time) => {
  g_Pointlights.forEach((pointLight, index) => {
    const pos = new Vector3(pointLight.position.x, Math.sin(time / 1000) * 10, pointLight.position.z)
    movePointLight(index, pos)
  })

  g_CurrentRenderObject?.materials.forEach(material => {
    material.uniforms.viewMatrixInverse = { value: g_Camera.matrixWorld }
    material.uniforms.pointLightsCount.value = g_Pointlights.length
    material.uniforms.directionalLightsCount.value = g_DirectionalLights.length
  })

  g_Renderer.render(g_Scene, g_Camera);
}

export default function PBRPipeline() {
  const [initialized, setInitialized] = useState(false)
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const onCanvasContainerReady = useCallback(node => {
    if (node && !initialized) {
      init().then(() => {
        node.appendChild(g_Renderer.domElement)

        setInitialized(true)
        forceUpdate()
      })
    }
  }, []);

  useEffect(() => {
    let altDown = false;
    let rotateCamera = false;
    window.addEventListener('mousemove', e => {
      if (!rotateCamera || !altDown)
        return

      const xDir = e.movementX > 0 ? -1 : 1;
      const yDir = e.movementY > 0 ? -1 : 1;
      const movement = new Vector2(xDir * 5, 0);
      rotateAround(g_Camera, g_CurrentRenderObject.sceneObject.position, new Vector3(0, 1, 0), movement)
    });
    window.addEventListener('mousedown', e => {
      if (altDown) {
        document.body.requestPointerLock();
        rotateCamera = true;
      }
    });
    window.addEventListener('mouseup', e => {
      document.exitPointerLock();
      rotateCamera = false;
    });
    window.addEventListener("keydown", e => {
      if (e.key == "Alt" && !altDown)
        altDown = true;
    })
    window.addEventListener("keyup", e => {
      altDown = false;
    })
  }, [])

  const page = <div>
    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
      <Dropdown options={g_PBRMaterialNames} value={g_defaultPBRMaterialName} onChange={materialName => {
        // uploadTextures(materialName.value)
      }} />
      <Dropdown
        options={g_Meshes.map((mesh, i) => ({ label: mesh.name, value: i.toString() }))}
        value={g_Meshes[0].name}
        onChange={entry => {
          g_Meshes[Number(entry.value)].load().then(({ object, materials }) => {
            setCurrentRenderObject(new RenderObject({ sceneObject: object, materials }))
          })
        }}
      />
      <VectorFields
        label="Sun Direction"
        dimensions={3}
        vectorType="position"
        inputType="slider"
        defaultValue={new Vector3(0, 1, 0)}
        minValue={-1}
        maxValue={1}
        onChange={pos => {
          g_Sun.position.set(pos.x, pos.y, pos.z);
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
          g_Sun.color.set(new THREE.Color(color.x, color.y, color.z))
        }}
      />
      <VectorFields
        label="Sun Intensity"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={0.35}
        minValue={0}
        maxValue={1}
        onChange={value => {
          g_Sun.intensity = value.x;
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
          g_AmbientLight.color.set(new THREE.Color(color.x, color.y, color.z));
        }}
      />
      <VectorFields
        label="Pointlight Intensity"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={200}
        minValue={0}
        maxValue={500}
        onChange={value => {
          g_Pointlights.forEach(light => light.intensity = value.x)
        }}
      />
    </div>
    <div style={{ display: "flex", justifyContent: "space-evenly", marginTop: "20px" }}>
      <VectorFields
        label="Metalness"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={0}
        minValue={0}
        maxValue={1}
        onChange={value => {
          g_CurrentRenderObject.materials.forEach(material => {
            material.metalnessScale = value.x
          })

        }}
      />
      <VectorFields
        label="Roughness"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={0.25}
        minValue={0}
        maxValue={1}
        onChange={value => {
          g_CurrentRenderObject.materials.forEach(material => {
            material.roughnessScale = value.x
          })
        }}
      />
    </div>
  </div>

  return (
    <div>
      {initialized && page}
      <div ref={onCanvasContainerReady} />
    </div>

  )
}
