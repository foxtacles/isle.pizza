import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { visualizer } from 'rollup-plugin-visualizer';
import siteConfig from './site.config.js';
import path from 'path';

const buildTime = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');

/**
 * Vite plugin that strips unused Three.js modules to reduce bundle size.
 * This project only uses MeshLambertMaterial with no shadows, XR, or PBR —
 * so we can safely stub out large chunks of the shader/material system.
 */
function threeMinifierPlugin() {
  const threeDir = path.resolve('node_modules/three/src/');

  // GLSL shader chunks that are NEVER used by MeshLambertMaterial, MeshBasicMaterial,
  // or the depth/shadow/distance internal shaders. Safe to replace with empty strings.
  const emptyGlslChunks = new Set([
    'lights_physical_pars_fragment',
    'lights_physical_fragment',
    'transmission_pars_fragment',
    'transmission_fragment',
    'iridescence_fragment',
    'iridescence_pars_fragment',
    'cube_uv_reflection_fragment',
    'envmap_physical_pars_fragment',
    'lights_phong_pars_fragment',
    'lights_phong_fragment',
    'lights_toon_pars_fragment',
    'lights_toon_fragment',
    'gradientmap_pars_fragment',
    'clearcoat_pars_fragment',
    'clearcoat_normal_fragment_maps',
    'clearcoat_normal_fragment_begin',
    'metalnessmap_fragment',
    'metalnessmap_pars_fragment',
    'roughnessmap_fragment',
    'roughnessmap_pars_fragment',
    'tonemapping_pars_fragment',
    'map_particle_fragment',
    'map_particle_pars_fragment',
    // Shadow-related chunks - we don't use shadows. These are included by Lambert
    // via #include but are guarded by #ifdef USE_SHADOWMAP which is never set.
    'shadowmap_pars_fragment',
    'shadowmap_pars_vertex',
    'shadowmap_vertex',
    'shadowmask_pars_fragment',
    // Packing - only needed for shadow depth encoding
    'packing',
    // Alpha hash - not used (guarded by USE_ALPHAHASH)
    'alphahash_pars_fragment',
    'alphahash_fragment',
    // Clipping planes - not used (guarded by NUM_CLIPPING_PLANES)
    'clipping_planes_fragment',
    'clipping_planes_pars_fragment',
    'clipping_planes_pars_vertex',
    'clipping_planes_vertex',
    // Bump/normal mapping - not used (guarded by USE_BUMPMAP/USE_NORMALMAP)
    'bumpmap_pars_fragment',
    'normalmap_pars_fragment',
    'normal_fragment_maps',
    // Environment mapping - not used (guarded by USE_ENVMAP)
    'envmap_fragment',
    'envmap_pars_fragment',
    'envmap_pars_vertex',
    'envmap_vertex',
    'envmap_common_pars_fragment',
    // Batching - not used (guarded by USE_BATCHING)
    'batching_pars_vertex',
    'batching_vertex',
    // Morph targets - not used (guarded by USE_MORPHTARGETS)
    'morphcolor_vertex',
    'morphtarget_pars_vertex',
    'morphtarget_vertex',
    'morphnormal_vertex',
    // AO map - not used (guarded by USE_AOMAP)
    'aomap_fragment',
    'aomap_pars_fragment',
    // Skinning - not used (guarded by USE_SKINNING)
    'skinning_pars_vertex',
    'skinning_vertex',
    'skinbase_vertex',
    // Dithering - not used
    'dithering_pars_fragment',
    'dithering_fragment',
    // Light map - not used (guarded by USE_LIGHTMAP)
    'lights_fragment_maps',
    'lightmap_pars_fragment',
    // Displacement map - not used
    'displacementmap_pars_vertex',
    'displacementmap_vertex',
    // Emissive map - not used
    'emissivemap_fragment',
    'emissivemap_pars_fragment',
    // Specular map - not used
    'specularmap_fragment',
    'specularmap_pars_fragment',
    // Log depth buffer - not used
    'logdepthbuf_fragment',
    'logdepthbuf_pars_fragment',
    'logdepthbuf_pars_vertex',
    'logdepthbuf_vertex',
    // Fog - not used
    'fog_fragment',
    'fog_pars_fragment',
    'fog_pars_vertex',
    'fog_vertex',
    // Instancing - not used
    'instancing_pars_vertex',
    'instancing_vertex',
    'instancing_color_pars_vertex',
    'instancing_color_vertex',
    // Skinning normals - not used
    'skinnormal_vertex',
    // Morph instance - not used
    'morphinstance_vertex',
    // World position - only needed for envmap/shadowmap which we don't use
    'worldpos_vertex',
  ]);

  // ShaderLib template files for unused material types
  const emptyShaderLibTemplates = new Set([
    'meshphysical',
    'meshphong',
    'meshtoon',
    'meshmatcap',
    'meshnormal',
    'sprite',
    'linedashed',
    'points',
    'cube',
    'equirect',
    'backgroundCube',
    'depth',
    'distance',
    'shadow',
    'background',
  ]);

  return {
    name: 'three-minifier',
    enforce: 'pre',

    resolveId(source, importer) {
      if (!importer || !importer.includes('three/src')) return null;

      // Stub WebXRManager with a no-op implementation
      if (source.includes('webxr/WebXRManager')) {
        return '\0three-stub:WebXRManager';
      }

      // Stub WebGLShadowMap
      if (source.includes('webgl/WebGLShadowMap')) {
        return '\0three-stub:WebGLShadowMap';
      }

      // Stub PMREMGenerator
      if (source.includes('extras/PMREMGenerator')) {
        return '\0three-stub:PMREMGenerator';
      }

      // Stub DFGLUTData (PBR lookup table)
      if (source.includes('DFGLUTData')) {
        return '\0three-stub:DFGLUTData';
      }

      // Stub WebGLCubeMaps (not used - no cube textures)
      if (source.includes('webgl/WebGLCubeMaps')) {
        return '\0three-stub:WebGLCubeMaps';
      }

      // Stub WebGLCubeUVMaps (not used - no IBL)
      if (source.includes('webgl/WebGLCubeUVMaps')) {
        return '\0three-stub:WebGLCubeUVMaps';
      }

      // Stub WebGLMorphtargets (not used - keyframe animation only)
      if (source.includes('webgl/WebGLMorphtargets')) {
        return '\0three-stub:WebGLMorphtargets';
      }

      // Stub TextureUtils (PMREMGenerator helper)
      if (source.includes('extras/TextureUtils')) {
        return '\0three-stub:TextureUtils';
      }

      // Stub DirectionalLightShadow (eliminates LightShadow + OrthographicCamera)
      if (source.includes('DirectionalLightShadow')) {
        return '\0three-stub:DirectionalLightShadow';
      }

      // Stub LightShadow base class
      if (source.includes('LightShadow') && !source.includes('DirectionalLightShadow')) {
        return '\0three-stub:LightShadow';
      }

      // Stub WebGLBackground (eliminates BoxGeometry + PlaneGeometry + ShaderMaterial for backgrounds)
      if (source.includes('webgl/WebGLBackground')) {
        return '\0three-stub:WebGLBackground';
      }

      // Stub WebGLOutput (eliminates tone mapping pipeline + OrthographicCamera)
      if (source.includes('webgl/WebGLOutput')) {
        return '\0three-stub:WebGLOutput';
      }

      // Stub geometries pulled in only by background (BoxGeometry, PlaneGeometry)
      if (source.includes('geometries/BoxGeometry') || source.includes('geometries/PlaneGeometry')) {
        return '\0three-stub:EmptyGeometry';
      }

      // Stub OrthographicCamera (only used by shadows/output/PMREM which are all stubbed)
      if (source.includes('cameras/OrthographicCamera')) {
        return '\0three-stub:OrthographicCamera';
      }

      // Stub RenderTarget (not used - no off-screen rendering)
      if (source.includes('core/RenderTarget')) {
        return '\0three-stub:RenderTarget';
      }

      // Stub DataArrayTexture and Data3DTexture (not used)
      if (source.includes('textures/DataArrayTexture') || source.includes('textures/Data3DTexture')) {
        return '\0three-stub:DataTexture';
      }

      // Stub DepthTexture (not used - no render targets)
      if (source.includes('textures/DepthTexture')) {
        return '\0three-stub:DepthTexture';
      }

      // Stub unused math: Frustum (only used by shadows), Triangle (only Raycaster needs it - keep)
      if (source.includes('math/Frustum')) {
        return '\0three-stub:Frustum';
      }

      // Stub ShaderMaterial (only used by background + depth/distance)
      if (source.includes('materials/ShaderMaterial') && !source.includes('RawShaderMaterial')) {
        return '\0three-stub:ShaderMaterial';
      }

      // Stub WebGLClipping (no clipping planes used)
      if (source.includes('webgl/WebGLClipping')) {
        return '\0three-stub:WebGLClipping';
      }

      // Stub WebGLUniformsGroups (only used for UBOs with ShaderMaterial)
      if (source.includes('webgl/WebGLUniformsGroups')) {
        return '\0three-stub:WebGLUniformsGroups';
      }

      // Stub CubeTexture (no cube maps used)
      if (source.includes('textures/CubeTexture') && !source.includes('Loader')) {
        return '\0three-stub:CubeTexture';
      }

      // Stub MeshBasicMaterial (pulled in by ShaderLib but we only use Lambert)
      if (source.includes('materials/MeshBasicMaterial')) {
        return '\0three-stub:MeshBasicMaterial';
      }

      // Stub MeshDepthMaterial and MeshDistanceMaterial (shadow-only)
      if (source.includes('materials/MeshDepthMaterial') || source.includes('materials/MeshDistanceMaterial')) {
        return '\0three-stub:ShadowMaterial';
      }

      return null;
    },

    load(id) {
      // Handle GLSL chunk stubs
      if (id.includes('three/src/renderers/shaders/ShaderChunk/') && id.endsWith('.glsl.js')) {
        const chunkName = path.basename(id, '.glsl.js');
        if (emptyGlslChunks.has(chunkName)) {
          return "export default '';";
        }
      }

      // Handle ShaderLib template stubs
      if (id.includes('three/src/renderers/shaders/ShaderLib/') && id.endsWith('.glsl.js')) {
        const templateName = path.basename(id, '.glsl.js');
        if (emptyShaderLibTemplates.has(templateName)) {
          return "export const vertex = ''; export const fragment = '';";
        }
      }

      // Stub modules
      if (id === '\0three-stub:WebXRManager') {
        return `
class WebXRManager {
  constructor() {
    this.enabled = false;
    this.isPresenting = false;
    this.cameraAutoUpdate = true;
  }
  getCamera() { return null; }
  updateCamera() {}
  setAnimationLoop() {}
  addEventListener() {}
  removeEventListener() {}
  dispose() {}
  setFramebufferScaleFactor() {}
  setReferenceSpaceType() {}
  getReferenceSpace() { return null; }
  getSession() { return null; }
  hasDepthSensing() { return false; }
  getDepthSensingMesh() { return null; }
  setFoveation() {}
}
export { WebXRManager };`;
      }

      if (id === '\0three-stub:WebGLShadowMap') {
        return `
class WebGLShadowMap {
  constructor() {
    this.enabled = false;
    this.autoUpdate = true;
    this.needsUpdate = false;
    this.type = 1; // PCFShadowMap
  }
  render() {}
  dispose() {}
}
export { WebGLShadowMap };`;
      }

      if (id === '\0three-stub:PMREMGenerator') {
        return `
class PMREMGenerator {
  constructor() {}
  fromScene() { return null; }
  fromEquirectangular() { return null; }
  fromCubemap() { return null; }
  compileCubemapShader() {}
  compileEquirectangularShader() {}
  dispose() {}
}
export { PMREMGenerator };`;
      }

      if (id === '\0three-stub:DFGLUTData') {
        return `export function getDFGLUT() { return null; }`;
      }

      if (id === '\0three-stub:WebGLCubeMaps') {
        return `
function WebGLCubeMaps(renderer) {
  return { get(t) { return t; }, dispose() {} };
}
export { WebGLCubeMaps };`;
      }

      if (id === '\0three-stub:WebGLCubeUVMaps') {
        return `
function WebGLCubeUVMaps(renderer) {
  return { get(t) { return t; }, dispose() {} };
}
export { WebGLCubeUVMaps };`;
      }

      if (id === '\0three-stub:WebGLMorphtargets') {
        return `
function WebGLMorphtargets(gl, capabilities, textures) {
  return { update() {} };
}
export { WebGLMorphtargets };`;
      }

      if (id === '\0three-stub:TextureUtils') {
        return `export function decompress() { return null; } export function getByteLength() { return 0; }`;
      }

      if (id === '\0three-stub:DirectionalLightShadow') {
        return `
class DirectionalLightShadow {
  constructor() {
    this.camera = null; this.bias = 0; this.normalBias = 0; this.radius = 1;
    this.mapSize = { x: 512, y: 512, width: 512, height: 512, set() { return this; }, copy() { return this; }, clone() { return Object.assign({}, this); } };
    this.map = null; this.autoUpdate = true; this.needsUpdate = false;
  }
  getViewportCount() { return 1; }
  updateMatrices() {}
  getViewport() { return { x: 0, y: 0, z: 512, w: 512 }; }
  getFrameExtents() { return { x: 1, y: 1 }; }
  dispose() {}
  toJSON() { return {}; }
  clone() { return new DirectionalLightShadow(); }
  copy() { return this; }
}
export { DirectionalLightShadow };`;
      }

      if (id === '\0three-stub:LightShadow') {
        return `
class LightShadow {
  constructor() {
    this.camera = null;
    this.bias = 0;
    this.normalBias = 0;
    this.radius = 1;
    this.blurSamples = 8;
    this.mapSize = { x: 512, y: 512, width: 512, height: 512, set() { return this; }, copy() { return this; }, clone() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } };
    this.map = null;
    this.mapPass = null;
    this.matrix = null;
    this.autoUpdate = true;
    this.needsUpdate = false;
  }
  getViewportCount() { return 1; }
  getFrustum() { return null; }
  updateMatrices() {}
  getViewport() { return { x: 0, y: 0, z: 512, w: 512 }; }
  getFrameExtents() { return { x: 1, y: 1 }; }
  dispose() {}
  toJSON() { return {}; }
  clone() { return new LightShadow(); }
  copy() { return this; }
}
export { LightShadow };`;
      }

      if (id === '\0three-stub:WebGLBackground') {
        return `
function WebGLBackground(renderer, cubemaps, cubeuvmaps, state, objects, alpha, premultipliedAlpha) {
  let clearColor = { r: 0, g: 0, b: 0, isColor: true, getHex() { return 0; }, copy(c) { this.r=c.r; this.g=c.g; this.b=c.b; return this; }, set() { return this; }, clone() { return Object.assign({}, this); } };
  let clearAlpha = alpha ? 0 : 1;
  return {
    getClearColor() { return clearColor; },
    setClearColor(color, alpha) { clearColor.copy(color); if (alpha !== undefined) clearAlpha = alpha; },
    getClearAlpha() { return clearAlpha; },
    setClearAlpha(a) { clearAlpha = a; },
    render(scene) {},
    addToRenderList() {},
    dispose() {}
  };
}
export { WebGLBackground };`;
      }

      if (id === '\0three-stub:WebGLOutput') {
        return `
function WebGLOutput() {
  this.setSize = function() {};
  this.setEffects = function() {};
  this.begin = function() { return false; };
  this.hasRenderPass = function() { return false; };
  this.end = function() {};
  this.isCompositing = function() { return false; };
  this.dispose = function() {};
}
export { WebGLOutput };`;
      }

      if (id === '\0three-stub:EmptyGeometry') {
        return `
class EmptyGeometry { constructor() {} dispose() {} }
export { EmptyGeometry as BoxGeometry, EmptyGeometry as PlaneGeometry };`;
      }

      if (id === '\0three-stub:OrthographicCamera') {
        return `
class OrthographicCamera {
  constructor() { this.isOrthographicCamera = true; }
}
export { OrthographicCamera };`;
      }

      if (id === '\0three-stub:RenderTarget') {
        return `
class RenderTarget {
  constructor(w, h, o) {
    this.isRenderTarget = true;
    this.width = w || 1;
    this.height = h || 1;
    this.depth = 1;
    this.scissor = { x: 0, y: 0, z: w || 1, w: h || 1 };
    this.scissorTest = false;
    this.viewport = { x: 0, y: 0, z: w || 1, w: h || 1 };
    this.texture = null;
    this.depthBuffer = true;
    this.stencilBuffer = false;
    this.depthTexture = null;
    this.textures = [];
    this.samples = 0;
  }
  setSize() { return this; }
  clone() { return new RenderTarget(); }
  copy() { return this; }
  dispose() {}
}
export { RenderTarget };`;
      }

      if (id === '\0three-stub:DataTexture') {
        return `
class DataArrayTexture { constructor() { this.isDataArrayTexture = true; } }
class Data3DTexture { constructor() { this.isData3DTexture = true; } }
export { DataArrayTexture, Data3DTexture };`;
      }

      if (id === '\0three-stub:DepthTexture') {
        return `
class DepthTexture { constructor() { this.isDepthTexture = true; } dispose() {} }
export { DepthTexture };`;
      }

      if (id === '\0three-stub:Frustum') {
        return `
class Frustum {
  constructor() { this.planes = []; }
  setFromProjectionMatrix() { return this; }
  intersectsObject() { return true; }
  intersectsSphere() { return true; }
  containsPoint() { return true; }
  clone() { return new Frustum(); }
}
export { Frustum };`;
      }

      if (id === '\0three-stub:WebGLClipping') {
        return `
function WebGLClipping(properties) {
  this.uniform = { value: null, needsUpdate: false };
  this.numPlanes = 0;
  this.numIntersection = 0;
  this.init = function() { return false; };
  this.beginShadows = function() {};
  this.endShadows = function() {};
  this.setGlobalState = function() {};
  this.setState = function() {};
}
export { WebGLClipping };`;
      }

      if (id === '\0three-stub:WebGLUniformsGroups') {
        return `
function WebGLUniformsGroups() {
  return {
    update: function() {},
    bind: function() {},
    dispose: function() {}
  };
}
export { WebGLUniformsGroups };`;
      }

      if (id === '\0three-stub:CubeTexture') {
        return `
class CubeTexture {
  constructor() { this.isCubeTexture = true; this.isRenderTargetTexture = false; }
}
export { CubeTexture };`;
      }

      if (id === '\0three-stub:ShaderMaterial') {
        return `
class ShaderMaterial {
  constructor(p) {
    this.isShaderMaterial = true;
    this.type = 'ShaderMaterial';
    this.uniforms = (p && p.uniforms) || {};
    this.vertexShader = (p && p.vertexShader) || '';
    this.fragmentShader = (p && p.fragmentShader) || '';
    this.defines = {};
    this.side = 0;
    this.transparent = false;
    this.depthWrite = true;
    this.depthTest = true;
    this.blending = 1;
    this.visible = true;
  }
  clone() { return new ShaderMaterial(this); }
  dispose() {}
  onBeforeCompile() {}
  customProgramCacheKey() { return ''; }
}
export { ShaderMaterial };`;
      }

      if (id === '\0three-stub:MeshBasicMaterial') {
        return `
class MeshBasicMaterial {
  constructor(p) {
    this.isMeshBasicMaterial = true;
    this.type = 'MeshBasicMaterial';
    this.color = { r: 1, g: 1, b: 1, isColor: true };
    this.map = null;
    this.envMap = null;
    if (p) Object.assign(this, p);
  }
}
export { MeshBasicMaterial };`;
      }

      if (id === '\0three-stub:ShadowMaterial') {
        return `
class MeshDepthMaterial { constructor() { this.isMeshDepthMaterial = true; } }
class MeshDistanceMaterial { constructor() { this.isMeshDistanceMaterial = true; } }
export { MeshDepthMaterial, MeshDistanceMaterial };`;
      }

      return null;
    },

    transform(code, id) {
      // Strip large unused functions from WebGLTextures.js
      if (id.includes('three/src/renderers/webgl/WebGLTextures.js')) {
        // Replace large unused function bodies with no-ops
        // These functions handle cube textures, render targets, and multisampling
        const stubFunctions = [
          'uploadCubeTexture',
          'setupRenderTarget',
          'setupDepthRenderbuffer',
          'updateMultisampleRenderTarget',
          'setupDepthTexture',
          'setupRenderBufferStorage',
          'setupFrameBufferTexture',
          'deallocateRenderTarget',
          'updateRenderTargetMipmap',
          'rebindTextures',
        ];

        let transformed = code;
        for (const funcName of stubFunctions) {
          // Match the function definition and replace its body
          const regex = new RegExp(
            `(\\tfunction ${funcName}\\s*\\([^)]*\\)\\s*\\{)([\\s\\S]*?)(\\n\\t\\})`,
            'g'
          );
          transformed = transformed.replace(regex, `$1$3`);
        }

        // Also strip the cube/3D/array branches in setTexture2DArray and setTexture3D
        transformed = transformed.replace(
          /\tfunction setTexture2DArray\s*\([^)]*\)\s*\{[\s\S]*?\n\t\}/,
          '\tfunction setTexture2DArray() {}'
        );
        transformed = transformed.replace(
          /\tfunction setTexture3D\s*\([^)]*\)\s*\{[\s\S]*?\n\t\}/,
          '\tfunction setTexture3D() {}'
        );
        transformed = transformed.replace(
          /\tfunction setTextureCube\s*\([^)]*\)\s*\{[\s\S]*?\n\t\}/,
          '\tfunction setTextureCube() {}'
        );

        return transformed;
      }

      // Strip toJSON from Object3D.js (~300 lines of serialization we don't need)
      if (id.includes('three/src/core/Object3D.js')) {
        let transformed = code;
        const search = 'toJSON( meta )';
        const idx = transformed.indexOf(search);
        if (idx !== -1) {
          const braceStart = transformed.indexOf('{', idx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          const sigStart = transformed.lastIndexOf('\t', idx);
          transformed = transformed.substring(0, sigStart) +
            '\ttoJSON() { return {}; }' +
            transformed.substring(pos);
        }
        return transformed;
      }

      // Strip toJSON from Material.js
      if (id.includes('three/src/materials/Material.js')) {
        let transformed = code;
        const search = 'toJSON( meta )';
        const idx = transformed.indexOf(search);
        if (idx !== -1) {
          const braceStart = transformed.indexOf('{', idx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          const sigStart = transformed.lastIndexOf('\t', idx);
          transformed = transformed.substring(0, sigStart) +
            '\ttoJSON() { return {}; }' +
            transformed.substring(pos);
        }
        return transformed;
      }

      // Strip toJSON from BufferGeometry.js and unused methods
      if (id.includes('three/src/core/BufferGeometry.js')) {
        let transformed = code;
        const search = 'toJSON()';
        const idx = transformed.indexOf(search);
        if (idx !== -1) {
          const braceStart = transformed.indexOf('{', idx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          const sigStart = transformed.lastIndexOf('\t', idx);
          transformed = transformed.substring(0, sigStart) +
            '\ttoJSON() { return {}; }' +
            transformed.substring(pos);
        }
        return transformed;
      }

      // Strip toJSON from BufferAttribute.js
      if (id.includes('three/src/core/BufferAttribute.js')) {
        let transformed = code;
        const search = 'toJSON( data )';
        const idx = transformed.indexOf(search);
        if (idx !== -1) {
          const braceStart = transformed.indexOf('{', idx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          const sigStart = transformed.lastIndexOf('\t', idx);
          transformed = transformed.substring(0, sigStart) +
            '\ttoJSON() { return {}; }' +
            transformed.substring(pos);
        }
        return transformed;
      }

      // Strip toJSON from Texture.js
      if (id.includes('three/src/textures/Texture.js')) {
        let transformed = code;
        const search = 'toJSON( meta )';
        const idx = transformed.indexOf(search);
        if (idx !== -1) {
          const braceStart = transformed.indexOf('{', idx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          const sigStart = transformed.lastIndexOf('\t', idx);
          transformed = transformed.substring(0, sigStart) +
            '\ttoJSON() { return {}; }' +
            transformed.substring(pos);
        }
        return transformed;
      }

      // Strip _colorKeywords table from Color.js (huge CSS named colors lookup - not used)
      if (id.includes('three/src/math/Color.js')) {
        let transformed = code;
        // Replace the color keywords object with an empty one
        const kwStart = transformed.indexOf("const _colorKeywords = {");
        if (kwStart !== -1) {
          const kwEnd = transformed.indexOf('};', kwStart) + 2;
          transformed = transformed.substring(0, kwStart) +
            'const _colorKeywords = {};' +
            transformed.substring(kwEnd);
        }
        return transformed;
      }

      // Strip toJSON and serializeImage from Source.js
      if (id.includes('three/src/textures/Source.js')) {
        let transformed = code;
        // Strip toJSON
        const tjIdx = transformed.indexOf('toJSON( meta )');
        if (tjIdx !== -1) {
          const braceStart = transformed.indexOf('{', tjIdx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          const sigStart = transformed.lastIndexOf('\t', tjIdx);
          transformed = transformed.substring(0, sigStart) +
            '\ttoJSON() { return {}; }' +
            transformed.substring(pos);
        }
        // Strip serializeImage function
        const siIdx = transformed.indexOf('function serializeImage');
        if (siIdx !== -1) {
          const braceStart = transformed.indexOf('{', siIdx);
          let depth = 1, pos = braceStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }
          transformed = transformed.substring(0, siIdx) +
            'function serializeImage() { return null; }' +
            transformed.substring(pos);
        }
        return transformed;
      }

      // Strip large unused methods from WebGLRenderer.js
      if (id.includes('three/src/renderers/WebGLRenderer.js')) {
        let transformed = code;

        // Strip renderTransmissionPass using brace counting
        {
          const search = 'function renderTransmissionPass';
          const idx = transformed.indexOf(search);
          if (idx !== -1) {
            const braceStart = transformed.indexOf('{', idx);
            let depth = 1, pos = braceStart + 1;
            while (depth > 0 && pos < transformed.length) {
              if (transformed[pos] === '{') depth++;
              else if (transformed[pos] === '}') depth--;
              pos++;
            }
            transformed = transformed.substring(0, idx) +
              'function renderTransmissionPass() {}' +
              transformed.substring(pos);
          }
        }

        // Strip this.X = function methods for render targets, copy operations
        const thisMethodStubs = [
          'setRenderTarget',
          'readRenderTargetPixels',
          'readRenderTargetPixelsAsync',
          'copyFramebufferToTexture',
          'copyTextureToTexture',
          'initRenderTarget',
          'setRenderTargetTextures',
          'setRenderTargetFramebuffer',
        ];

        for (const methodName of thisMethodStubs) {
          // Match: this.methodName = function(...) { ... };
          // Use a balanced-brace approach via counting
          const searchStr = `this.${methodName} = `;
          const idx = transformed.indexOf(searchStr);
          if (idx === -1) continue;

          // Find the opening brace of the function body
          const fnStart = transformed.indexOf('{', transformed.indexOf('function', idx));
          if (fnStart === -1) continue;

          // Count braces to find matching close
          let depth = 1;
          let pos = fnStart + 1;
          while (depth > 0 && pos < transformed.length) {
            if (transformed[pos] === '{') depth++;
            else if (transformed[pos] === '}') depth--;
            pos++;
          }

          // pos is now right after the closing }
          // Find the ; after it
          const semiIdx = transformed.indexOf(';', pos - 1);
          if (semiIdx === -1) continue;

          // Extract the signature up to the opening brace
          const signature = transformed.substring(idx, fnStart + 1);
          // Replace with a no-op
          if (methodName === 'setRenderTarget') {
            // setRenderTarget(null) needs to work to unbind render targets
            transformed = transformed.substring(0, idx) +
              signature + '\n\t\t\t_currentRenderTarget = null;\n\t\t\t_currentActiveCubeFace = 0;\n\t\t\t_currentActiveMipmapLevel = 0;\n\t\t}' +
              transformed.substring(semiIdx + 1);
          } else if (methodName === 'readRenderTargetPixelsAsync') {
            transformed = transformed.substring(0, idx) +
              signature + ' return Promise.resolve(buffer); }' +
              transformed.substring(semiIdx + 1);
          } else {
            transformed = transformed.substring(0, idx) +
              signature + '}' +
              transformed.substring(semiIdx + 1);
          }
        }

        return transformed;
      }

      // Strip unused material branches from WebGLMaterials.js
      if (id.includes('three/src/renderers/webgl/WebGLMaterials.js')) {
        // Replace refreshUniforms* functions for materials we don't use
        const unusedRefresh = [
          'refreshUniformsPhong',
          'refreshUniformsPhysical',
          'refreshUniformsToon',
          'refreshUniformsMatcap',
          'refreshUniformsNormal',
          'refreshUniformsLine',
          'refreshUniformsDash',
          'refreshUniformsPoints',
          'refreshUniformsSprite',
        ];
        let transformed = code;
        for (const funcName of unusedRefresh) {
          const regex = new RegExp(
            `(function ${funcName}\\s*\\([^)]*\\)\\s*\\{)([\\s\\S]*?)(\\n\\t\\})`,
            'g'
          );
          transformed = transformed.replace(regex, `$1$3`);
        }
        return transformed;
      }

      return null;
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [threeMinifierPlugin(), svelte(), visualizer({ filename: 'dist/stats.json', template: 'raw-data', gzipSize: true })],
  resolve: {
    alias: [
      { find: /^three$/, replacement: path.resolve(__dirname, 'src/core/rendering/three-imports.js') }
    ]
  },
  define: {
    __BUILD_TIME__: mode === 'development' ? null : JSON.stringify(buildTime),
    __RELAY_URL__: JSON.stringify(siteConfig.relayUrl),
    __API_URL__: JSON.stringify(siteConfig.apiUrl)
  },
  worker: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2
      }
    },
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
}));
