import { Mesh } from 'ogl';
import { Vec3 } from 'ogl/src/math/Vec3.js';
import { Quat } from 'ogl/src/math/Quat.js';
import { Mat4 } from 'ogl/src/math/Mat4.js';
import { Raycast } from 'ogl/src/extras/Raycast.js';
import { parseAnimation } from '../formats/AnimationParser.js';
import { fetchAnimation } from '../assetLoader.js';
import { BaseRenderer } from './BaseRenderer.js';
import {
    SimpleAnimationMixer, AnimationClip,
    QuaternionTrack, LoopOnce,
} from './AnimationMixer.js';

/**
 * Intermediate renderer for LEGO models with animation support.
 * Extends BaseRenderer with animation caching, raycasting, and keyframe utilities.
 */
export class AnimatedRenderer extends BaseRenderer {
    constructor(canvas, rendererOptions) {
        super(canvas, rendererOptions);
        this._lastTime = 0;
        this.mixer = null;
        this.currentAction = null;
        this.animationCache = new Map();
        this.raycaster = new Raycast();
        this._queuedClickAnim = null;
    }

    // ─── Animation Utilities ─────────────────────────────────────────

    async fetchAnimationByName(animName) {
        if (this.animationCache.has(animName)) {
            return this.animationCache.get(animName);
        }
        const buffer = await fetchAnimation(animName);
        if (!buffer) return null;
        const animData = parseAnimation(buffer);
        this.animationCache.set(animName, animData);
        return animData;
    }

    stopAnimation() {
        if (this.currentAction) {
            this.currentAction.stop();
            this.currentAction = null;
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }
    }

    /**
     * Recursively collect all unique keyframe times from the animation tree.
     */
    collectKeyframeTimes(node, timesSet) {
        const data = node.data;
        for (const key of data.translationKeys) timesSet.add(key.time);
        for (const key of data.rotationKeys) timesSet.add(key.time);
        for (const key of data.scaleKeys) timesSet.add(key.time);
        for (const key of data.morphKeys) timesSet.add(key.time);
        for (const child of node.children) {
            this.collectKeyframeTimes(child, timesSet);
        }
    }

    /**
     * Evaluate rotation keyframes at a given time.
     * Returns a Mat4 rotation matrix.
     */
    evaluateRotation(keys, time) {
        const { before, after } = this.getBeforeAndAfter(keys, time);
        const toQuat = (key) => new Quat(-key.x, key.y, key.z, key.w);

        if (!after) {
            if (before.flags & 0x01) {
                return new Mat4().fromQuaternion(toQuat(before));
            }
            return new Mat4();
        }

        if ((before.flags & 0x01) || (after.flags & 0x01)) {
            const beforeQ = toQuat(before);

            if (after.flags & 0x04) {
                return new Mat4().fromQuaternion(beforeQ);
            }

            const afterQ = toQuat(after);
            if (after.flags & 0x02) {
                afterQ.set(-afterQ[0], -afterQ[1], -afterQ[2], -afterQ[3]);
            }

            const t = (time - before.time) / (after.time - before.time);
            const result = new Quat().copy(beforeQ).slerp(afterQ, t);
            return new Mat4().fromQuaternion(result);
        }

        return new Mat4();
    }

    /**
     * Interpolate translation or scale keyframes at a given time.
     */
    interpolateVertex(keys, time, isTranslation) {
        const { before, after } = this.getBeforeAndAfter(keys, time);

        const toVec = (key) => isTranslation
            ? new Vec3(-key.x, key.y, key.z)
            : new Vec3(key.x, key.y, key.z);

        if (!after) {
            if (isTranslation && !(before.flags & 0x01)) {
                if (Math.abs(before.x) < 1e-5 && Math.abs(before.y) < 1e-5 && Math.abs(before.z) < 1e-5) {
                    return null;
                }
            }
            return toVec(before);
        }

        if (isTranslation && !(before.flags & 0x01) && !(after.flags & 0x01)) {
            const bNonZero = Math.abs(before.x) > 1e-5 || Math.abs(before.y) > 1e-5 || Math.abs(before.z) > 1e-5;
            const aNonZero = Math.abs(after.x) > 1e-5 || Math.abs(after.y) > 1e-5 || Math.abs(after.z) > 1e-5;
            if (!bNonZero && !aNonZero) return null;
        }

        const t = (time - before.time) / (after.time - before.time);
        const a = toVec(before);
        const b = toVec(after);
        return new Vec3(
            a[0] + t * (b[0] - a[0]),
            a[1] + t * (b[1] - a[1]),
            a[2] + t * (b[2] - a[2]),
        );
    }

    getBeforeAndAfter(keys, time) {
        let idx = keys.findIndex(k => k.time > time);
        if (idx < 0) idx = keys.length;
        const before = keys[Math.max(0, idx - 1)];
        return { before, after: keys[idx] || null };
    }

    // ─── Click Animation ─────────────────────────────────────────────

    queueClickAnimation(animName) {
        this._queuedClickAnim = animName;
    }

    async playQueuedAnimation() {
        if (!this._queuedClickAnim || !this.modelGroup) return;

        const animName = this._queuedClickAnim;
        this._queuedClickAnim = null;

        try {
            const animData = await this.fetchAnimationByName(animName);
            if (!animData || !this.modelGroup) return;

            const tracks = this.buildRotationTracks(animData);
            if (tracks.length === 0) return;

            this.stopAnimation();

            const clip = new AnimationClip('clickAnim', -1, tracks);
            this.mixer = new SimpleAnimationMixer(this.modelGroup);
            const action = this.mixer.clipAction(clip);
            action.setLoop(LoopOnce);
            action.clampWhenFinished = false;
            this.currentAction = action;
            action.play();

            this.mixer.addEventListener('finished', () => {
                this.stopAnimation();
                if (this.controls) this.controls.autoRotate = true;
            });
        } catch (e) {
            // Animation unavailable — ignore
        }
    }

    // ─── Raycast Hit Testing ─────────────────────────────────────────

    getClickedMesh(mouseEvent) {
        if (!this.modelGroup) return false;

        const rect = this.canvas.getBoundingClientRect();
        const mouse = [
            ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1,
            -(((mouseEvent.clientY - rect.top) / rect.height) * 2 - 1),
        ];

        this.raycaster.castMouse(this.camera, mouse);

        const meshes = [];
        this.modelGroup.traverse((child) => {
            if (child instanceof Mesh) meshes.push(child);
        });

        const hits = this.raycaster.intersectMeshes(meshes, { cullFace: false });
        return hits.length > 0;
    }

    // ─── Simple Animation Tree Utilities ─────────────────────────────

    buildRotationTracks(animData) {
        const duration = animData.duration;
        const timesSet = new Set([0]);
        this.collectKeyframeTimes(animData.rootNode, timesSet);
        const times = [...timesSet].filter(t => t <= duration).sort((a, b) => a - b);

        const targetNode = this.findAnimatedNode(animData.rootNode);
        if (!targetNode) return [];

        const quatValues = [];
        const timesSec = [];

        for (const time of times) {
            const mat = this.evaluateNodeChain(animData.rootNode, targetNode, time);
            const position = new Vec3();
            const quaternion = new Quat();
            const scale = new Vec3();
            mat.decompose(quaternion, position, scale);

            timesSec.push(time / 1000);
            quatValues.push(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
        }

        return [
            QuaternionTrack('.quaternion', timesSec, quatValues)
        ];
    }

    findAnimatedNode(node) {
        for (const child of node.children) {
            const found = this.findAnimatedNode(child);
            if (found) return found;
        }
        const d = node.data;
        if (d.translationKeys.length > 0 || d.rotationKeys.length > 0 || d.scaleKeys.length > 0) {
            return node;
        }
        return null;
    }

    evaluateNodeChain(node, targetNode, time) {
        const path = [];
        if (!this.findNodePath(node, targetNode, path)) {
            return new Mat4();
        }

        let mat = new Mat4();
        for (const n of path) {
            const local = this.evaluateLocalTransform(n.data, time);
            mat.multiply(local);
        }
        return mat;
    }

    findNodePath(current, target, path) {
        path.push(current);
        if (current === target) return true;
        for (const child of current.children) {
            if (this.findNodePath(child, target, path)) return true;
        }
        path.pop();
        return false;
    }

    evaluateLocalTransform(data, time) {
        let mat = new Mat4();

        if (data.scaleKeys.length > 0) {
            const scale = this.interpolateVertex(data.scaleKeys, time, false);
            if (scale) mat.scale(scale);
        }

        if (data.rotationKeys.length > 0) {
            const rotMat = this.evaluateRotation(data.rotationKeys, time);
            mat = rotMat.multiply(mat);
        }

        if (data.translationKeys.length > 0) {
            const vertex = this.interpolateVertex(data.translationKeys, time, true);
            if (vertex) {
                mat[12] += vertex[0];
                mat[13] += vertex[1];
                mat[14] += vertex[2];
            }
        }

        return mat;
    }

    // ─── Scene Management ────────────────────────────────────────────

    clearModel() {
        this.stopAnimation();
        super.clearModel();
    }

    start() {
        this.animating = true;
        this._lastTime = performance.now();
        this.animate();
    }

    updateAnimation() {
        const now = performance.now();
        const delta = (now - this._lastTime) / 1000;
        this._lastTime = now;
        if (this.mixer) {
            this.mixer.update(delta);
        }
        this.controls?.update();
    }

    dispose() {
        this.stopAnimation();
        super.dispose();
        this.animationCache.clear();
    }
}
