// Slim Three.js re-export — only the modules this project actually uses.
// Importing from here (via the resolve alias) lets Rollup tree-shake the
// rest of Three.js away, since every unused module stays out of the graph.

export { Scene } from 'three/src/scenes/Scene.js';
export { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
export { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
export { AmbientLight } from 'three/src/lights/AmbientLight.js';
export { DirectionalLight } from 'three/src/lights/DirectionalLight.js';
export { CanvasTexture } from 'three/src/textures/CanvasTexture.js';
export { Color } from 'three/src/math/Color.js';
export { MeshLambertMaterial } from 'three/src/materials/MeshLambertMaterial.js';
export { BufferGeometry } from 'three/src/core/BufferGeometry.js';
export { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
export { Box3 } from 'three/src/math/Box3.js';
export { Ray } from 'three/src/math/Ray.js';
export { Plane } from 'three/src/math/Plane.js';
export { Spherical } from 'three/src/math/Spherical.js';
export { MathUtils } from 'three/src/math/MathUtils.js';
export { Controls } from 'three/src/extras/Controls.js';
export { Vector3 } from 'three/src/math/Vector3.js';
export { Vector2 } from 'three/src/math/Vector2.js';
export { Mesh } from 'three/src/objects/Mesh.js';
export { Group } from 'three/src/objects/Group.js';
export { Clock } from 'three/src/core/Clock.js';
export { Raycaster } from 'three/src/core/Raycaster.js';
export { Quaternion } from 'three/src/math/Quaternion.js';
export { Matrix4 } from 'three/src/math/Matrix4.js';
export { AnimationClip } from 'three/src/animation/AnimationClip.js';
export { AnimationMixer } from 'three/src/animation/AnimationMixer.js';
export { QuaternionKeyframeTrack } from 'three/src/animation/tracks/QuaternionKeyframeTrack.js';
export { VectorKeyframeTrack } from 'three/src/animation/tracks/VectorKeyframeTrack.js';
export { BooleanKeyframeTrack } from 'three/src/animation/tracks/BooleanKeyframeTrack.js';
// Only re-export the constants our app code uses directly.
// Three.js internal modules import their own constants directly from constants.js.
export {
  DoubleSide,
  LoopOnce,
  LinearFilter,
  NearestFilter,
  RepeatWrapping,
  MOUSE,
  TOUCH,
} from 'three/src/constants.js';
