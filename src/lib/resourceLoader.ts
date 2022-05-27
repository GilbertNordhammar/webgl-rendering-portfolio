import * as THREE from 'three';
import { Mesh } from 'three';
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { CompareVector3 } from "@lib/math"

export const loadShaderCode = async (path: string): Promise<string> => {
    const response = await fetch(`shaders/${path}`)
    const shader = await response.text()
    return shader
}

export const loadTexture = async (path: string, showErrors: boolean): Promise<THREE.Texture> => {
    try {
        const loading = new Promise<THREE.Texture>((resolve, reject) => {
            const url = `${window.location.origin}/textures/${path}`
            const loader = new THREE.TextureLoader()
            loader.load(
                url,
                tex => {
                    resolve(tex)
                },
                undefined,
                (err) => {
                    reject(err)
                }
            )
        })

        const texture = await loading
        return texture
    }
    catch (e) {
        if (showErrors) console.error(`Couldn't load texture '${path}'`, e)
    }
}

export const loadMesh = async (path: string): Promise<THREE.Group> => {
    try {
        const loading = new Promise<THREE.Group>((resolve, reject) => {
            let meshLoader: OBJLoader | FBXLoader | GLTFLoader
            const fileType = path.split(".").pop().toLowerCase()
            switch (fileType) {
                case "obj":
                    meshLoader = new OBJLoader()
                    break
                case "fbx":
                    meshLoader = new FBXLoader()
                    break;
                case "gltf":
                case "glb":
                    meshLoader = new GLTFLoader()
                    break;
                default:
                    throw "Unsupported mesh file type"
            }

            const url = `${window.location.origin}/${path}`
            meshLoader.load(
                url,
                meshGroup => {
                    resolve(meshGroup)
                },
                undefined,
                err => {
                    console.error(err)
                }
            )
        })

        const meshGroup = await loading
        /* Only gltf/glb seems to get loaded as indexed */
        // makeMeshIndexed(meshGroup)

        return meshGroup
    }
    catch (e) {
        console.log(`Couldn't load mesh '${path}'`, e)
    }
}

// Attempt at converting non-indexed meshes to being indexed
const makeMeshIndexed = (meshGroup: THREE.Group) => {
    meshGroup.children.forEach(child => {
        if (child instanceof Mesh) {
            const mesh = child as THREE.Mesh
            if (mesh.geometry.index)
                return

            const vertexCount = mesh.geometry.attributes.position.count

            const indices = new Array<number>(vertexCount)
            const positions: Array<number> = []
            const normals: Array<number> = []
            const uv: Array<number> = []

            const rawPositions = Array.from(mesh.geometry.attributes.position.array)
            const rawNormals = Array.from(mesh.geometry.attributes.normal.array)
            const rawUV = Array.from(mesh.geometry.attributes.uv.array)

            let count = 0
            let currentIndex = 0
            while (count < vertexCount) {
                let i = 0;
                while (Number.isNaN(rawPositions[i])) {
                    i += 3
                }

                let target: THREE.Vector3
                if (i < rawPositions.length)
                    target = new THREE.Vector3(rawPositions[i], rawPositions[i + 1], rawPositions[i + 2])

                const matchingVertices: Array<number> = []
                while (i < rawPositions.length) {
                    let current = new THREE.Vector3(rawPositions[i], rawPositions[i + 1], rawPositions[i + 2])
                    if (CompareVector3(target, current, 15)) {
                        matchingVertices.push(i)
                        rawPositions[i] = NaN
                    }
                    i += 3
                }

                if (matchingVertices.length > 0) {
                    positions.push(target.x)
                    positions.push(target.y)
                    positions.push(target.z)

                    const i = matchingVertices[0]

                    normals.push(rawNormals[i])
                    normals.push(rawNormals[i + 1])
                    normals.push(rawNormals[i + 2])

                    uv.push(rawUV[i])
                    uv.push(rawUV[i + 1])

                    matchingVertices.forEach(i => {
                        const vertexIndex = i / 3;
                        indices[vertexIndex] = currentIndex
                    })

                    currentIndex++;
                }

                count += matchingVertices.length
            }

            mesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
            mesh.geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3))
            mesh.geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uv), 2))

            mesh.geometry.setIndex(indices)
        }
    })
}