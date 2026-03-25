import { Renderer, Camera, Transform, Mesh, Geometry, Program, Texture } from 'ogl';
import { Orbit } from 'ogl/src/extras/Orbit.js';
import { Vec3 } from 'ogl/src/math/Vec3.js';
import { Quat } from 'ogl/src/math/Quat.js';
import { LAMBERT_VERTEX, LAMBERT_FRAGMENT, LIGHT_UNIFORMS } from './LambertShader.js';

/**
 * Base renderer providing shared OGL setup, texture creation,
 * geometry building, and animation loop for LEGO model viewers.
 */
export class BaseRenderer {
    constructor(canvas, rendererOptions = {}) {
        this.canvas = canvas;
        this.animating = false;
        this.modelGroup = null;
        this.textures = new Map();

        const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;

        this.glRenderer = new Renderer({
            canvas,
            antialias: true,
            alpha: true,
            dpr,
            width: canvas.width / dpr,
            height: canvas.height / dpr,
            ...rendererOptions
        });
        this.gl = this.glRenderer.gl;

        // Transparent clear
        this.gl.clearColor(0, 0, 0, 0);

        this.scene = new Transform();

        this.camera = new Camera(this.gl, { fov: 45, near: 0.1, far: 100 });

        this.controls = null;
        this._didDrag = false;
    }

    setupControls(target) {
        // Orbit requires a DOM element — skip in worker/offscreen contexts
        if (typeof document === 'undefined') return;

        // OGL's Orbit stores autoRotate in a closure that can't be mutated.
        // We disable it in OGL and drive auto-rotation ourselves.
        this._orbit = new Orbit(this.camera, {
            element: this.canvas,
            target: new Vec3(target[0], target[1], target[2]),
            enableZoom: true,
            enablePan: true,
            ease: 0.15,
            inertia: 0.85,
            autoRotate: false,
            autoRotateSpeed: 1.0,
        });

        // Wrap with mutable autoRotate
        this.controls = {
            target: this._orbit.target,
            autoRotate: true,
            autoRotateSpeed: 4.0,
            forcePosition: () => this._orbit.forcePosition(),
            remove: () => this._orbit.remove(),
            update: () => {
                if (this.controls.autoRotate) {
                    // Rotate camera around target by a small angle per frame
                    const angle = ((2 * Math.PI) / 60 / 60) * this.controls.autoRotateSpeed;
                    const q = new Quat().fromAxisAngle(new Vec3(0, 1, 0), -angle);
                    const offset = new Vec3().copy(this.camera.position).sub(this.controls.target);
                    offset.applyQuaternion(q);
                    this.camera.position.copy(this.controls.target).add(offset);
                    this._orbit.forcePosition();
                }
                this._orbit.update();
            },
        };

        this._onPointerDown = (e) => {
            this._didDrag = false;
            this._pointerStart = { x: e.clientX, y: e.clientY };
            // Stop auto-rotate on user interaction
            this.controls.autoRotate = false;
        };
        this._onPointerMove = (e) => {
            if (!this._pointerStart) return;
            const dx = e.clientX - this._pointerStart.x;
            const dy = e.clientY - this._pointerStart.y;
            if (dx * dx + dy * dy > 9) this._didDrag = true;
        };

        this.canvas.addEventListener('pointerdown', this._onPointerDown);
        this.canvas.addEventListener('pointermove', this._onPointerMove);

        this._initialAutoRotate = true;
        this._savedCameraPos = new Vec3().copy(this.camera.position);
        this._savedTarget = new Vec3().copy(this.controls.target);
    }

    resetView() {
        if (!this.controls) return;
        this.camera.position.copy(this._savedCameraPos);
        this.controls.target.copy(this._savedTarget);
        this.controls.forcePosition();
        this.controls.autoRotate = this._initialAutoRotate;
    }

    wasDragged() {
        return this._didDrag;
    }

    /**
     * Create an OGL texture from parsed palette-indexed texture data.
     */
    createTexture(textureData) {
        const w = textureData.width;
        const h = textureData.height;
        const canvas = typeof document !== 'undefined'
            ? document.createElement('canvas')
            : new OffscreenCanvas(w, h);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const imageData = ctx.createImageData(w, h);
        for (let i = 0; i < textureData.pixels.length; i++) {
            const colorIdx = textureData.pixels[i];
            const color = textureData.palette[colorIdx] || { r: 0, g: 0, b: 0 };
            imageData.data[i * 4 + 0] = color.r;
            imageData.data[i * 4 + 1] = color.g;
            imageData.data[i * 4 + 2] = color.b;
            imageData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);

        const texture = new Texture(this.gl, {
            image: canvas,
            minFilter: this.gl.NEAREST,
            magFilter: this.gl.NEAREST,
            wrapS: this.gl.REPEAT,
            wrapT: this.gl.REPEAT,
            generateMipmaps: false,
            flipY: false,
        });
        return texture;
    }

    /**
     * Build the texture lookup map from an array of texture data objects.
     */
    loadTextures(textures, overwrite = true) {
        if (!textures) return;
        for (const tex of textures) {
            if (!tex.name) continue;
            const key = tex.name.toLowerCase();
            if (overwrite || !this.textures.has(key)) {
                this.textures.set(key, this.createTexture(tex));
            }
        }
    }

    /**
     * Create an OGL Program (shader material) for a mesh.
     * @param {object} mesh - Mesh data with properties (textureName, color)
     * @param {number[]|null} fallbackColor - [r, g, b] normalized, or null
     * @returns {Program}
     */
    createMeshProgram(mesh, fallbackColor = null) {
        const meshTexName = mesh.properties?.textureName?.toLowerCase();
        if (meshTexName && this.textures.has(meshTexName)) {
            return this._createLambertProgram({
                tMap: { value: this.textures.get(meshTexName) },
                uUseTexture: { value: 1 },
                uColor: { value: [1, 1, 1] },
                uOpacity: { value: 1 },
            });
        }

        const meshColor = mesh.properties?.color;
        const color = meshColor
            ? [meshColor.r / 255, meshColor.g / 255, meshColor.b / 255]
            : (fallbackColor || [0.5, 0.5, 0.5]);

        return this._createLambertProgram({
            tMap: { value: this._emptyTexture() },
            uUseTexture: { value: 0 },
            uColor: { value: color },
            uOpacity: { value: 1 },
        });
    }

    /**
     * Create a Lambert-shaded Program with the given extra uniforms.
     */
    _createLambertProgram(extraUniforms, opts = {}) {
        return new Program(this.gl, {
            vertex: LAMBERT_VERTEX,
            fragment: LAMBERT_FRAGMENT,
            uniforms: {
                ...LIGHT_UNIFORMS,
                ...extraUniforms,
            },
            cullFace: false,  // DoubleSide
            ...opts,
        });
    }

    _emptyTextureCache = null;
    _emptyTexture() {
        if (!this._emptyTextureCache) {
            this._emptyTextureCache = new Texture(this.gl, {
                image: new Uint8Array([255, 255, 255, 255]),
                width: 1,
                height: 1,
                generateMipmaps: false,
            });
        }
        return this._emptyTextureCache;
    }

    /**
     * Create a single OGL Geometry from mesh data.
     */
    createGeometry(mesh, lod) {
        if (!mesh.polygonIndices || mesh.polygonIndices.length === 0) {
            return null;
        }

        const hasTexture = mesh.textureIndices && mesh.textureIndices.length > 0;

        const vertexIndicesPacked = [];
        for (const poly of mesh.polygonIndices) {
            vertexIndicesPacked.push(poly.a, poly.b, poly.c);
        }

        const textureIndicesFlat = [];
        if (hasTexture) {
            for (const texPoly of mesh.textureIndices) {
                textureIndicesFlat.push(texPoly.a, texPoly.b, texPoly.c);
            }
        }

        const meshVertices = [];
        const meshNormals = [];
        const meshUvs = [];
        const indices = [];

        for (let i = 0; i < vertexIndicesPacked.length; i++) {
            const packed = vertexIndicesPacked[i];

            if ((packed & 0x80000000) !== 0) {
                indices.push(meshVertices.length);

                const gv = packed & 0xFFFF;
                const v = lod.vertices[gv] || { x: 0, y: 0, z: 0 };
                meshVertices.push(-v.x, v.y, v.z);

                const gn = (packed >>> 16) & 0x7fff;
                const n = lod.normals[gn] || { x: 0, y: 1, z: 0 };
                meshNormals.push(-n.x, n.y, n.z);

                if (hasTexture && lod.textureVertices && lod.textureVertices.length > 0) {
                    const tex = textureIndicesFlat[i];
                    const uv = lod.textureVertices[tex] || { u: 0, v: 0 };
                    meshUvs.push(uv.u, 1 - uv.v);
                }
            } else {
                indices.push(packed & 0xFFFF);
            }
        }

        // Reverse face winding
        for (let i = 0; i < indices.length; i += 3) {
            const temp = indices[i];
            indices[i] = indices[i + 2];
            indices[i + 2] = temp;
        }

        const attrs = {
            position: { size: 3, data: new Float32Array(meshVertices) },
            normal: { size: 3, data: new Float32Array(meshNormals) },
            index: { data: new Uint32Array(indices) },
        };

        if (hasTexture && meshUvs.length > 0) {
            attrs.uv = { size: 2, data: new Float32Array(meshUvs) };
        }

        return new Geometry(this.gl, attrs);
    }

    /**
     * Compute axis-aligned bounding box of a Transform hierarchy.
     * Returns { min: Vec3, max: Vec3, center: Vec3, size: Vec3 }.
     */
    computeBoundingBox(transform) {
        const min = new Vec3(Infinity, Infinity, Infinity);
        const max = new Vec3(-Infinity, -Infinity, -Infinity);

        // Ensure world matrices are up to date
        transform.updateMatrixWorld(true);

        transform.traverse((node) => {
            if (!(node instanceof Mesh) || !node.geometry) return;
            const posAttr = node.geometry.attributes.position;
            if (!posAttr) return;

            const data = posAttr.data;
            const wm = node.worldMatrix;

            for (let i = 0; i < data.length; i += 3) {
                // Transform vertex to world space
                const x = data[i], y = data[i + 1], z = data[i + 2];
                const wx = wm[0] * x + wm[4] * y + wm[8] * z + wm[12];
                const wy = wm[1] * x + wm[5] * y + wm[9] * z + wm[13];
                const wz = wm[2] * x + wm[6] * y + wm[10] * z + wm[14];

                if (wx < min[0]) min[0] = wx;
                if (wy < min[1]) min[1] = wy;
                if (wz < min[2]) min[2] = wz;
                if (wx > max[0]) max[0] = wx;
                if (wy > max[1]) max[1] = wy;
                if (wz > max[2]) max[2] = wz;
            }
        });

        const center = new Vec3(
            (min[0] + max[0]) / 2,
            (min[1] + max[1]) / 2,
            (min[2] + max[2]) / 2,
        );
        const size = new Vec3(
            max[0] - min[0],
            max[1] - min[1],
            max[2] - min[2],
        );
        return { min, max, center, size };
    }

    centerAndScaleModel(scaleFactor) {
        if (!this.modelGroup) return;

        const { center, size } = this.computeBoundingBox(this.modelGroup);

        const maxDim = Math.max(size[0], size[1], size[2]);
        if (maxDim > 0) {
            const scale = scaleFactor / maxDim;
            this.modelGroup.scale.set(scale, scale, scale);
            this.modelGroup.position.set(
                -center[0] * scale,
                -center[1] * scale,
                -center[2] * scale,
            );
        } else {
            this.modelGroup.position.set(-center[0], -center[1], -center[2]);
        }
    }

    clearModel() {
        if (this.modelGroup) {
            this.scene.removeChild(this.modelGroup);
            this.modelGroup = null;
        }

        this.textures.clear();
    }

    start() {
        this.animating = true;
        this.animate();
    }

    stop() {
        this.animating = false;
    }

    animate = () => {
        if (!this.animating) return;
        requestAnimationFrame(this.animate);

        this.updateAnimation();

        this.glRenderer.render({ scene: this.scene, camera: this.camera });
    }

    /**
     * Override in subclasses for custom animation logic.
     */
    updateAnimation() {
        this.controls?.update();
    }

    resize(width, height) {
        this.camera.perspective({ aspect: width / height });
        this.glRenderer.setSize(width, height);
    }

    dispose() {
        this.animating = false;
        if (this.controls) {
            this.controls.remove();
            this.canvas.removeEventListener('pointerdown', this._onPointerDown);
            this.canvas.removeEventListener('pointermove', this._onPointerMove);
        }
        this.clearModel();
    }
}
