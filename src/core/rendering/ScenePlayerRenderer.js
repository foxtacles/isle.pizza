/**
 * Multi-actor scene renderer for scene animation playback.
 *
 * Directly applies animation transforms per-frame, matching the backend's
 * AnimUtils::ApplyTree → LegoROI::ApplyAnimationTransformation pipeline.
 * No decompose/recompose round-trip — matrices are set directly on OGL Transforms.
 */

import { Transform, Mesh } from 'ogl';
import { Vec3 } from 'ogl/src/math/Vec3.js';
import { Quat } from 'ogl/src/math/Quat.js';
import { Mat4 } from 'ogl/src/math/Mat4.js';
import { ActorInfoInit, ActorLODs, ActorLODFlags } from '../savegame/actorConstants.js';
import { LegoColors } from '../savegame/constants.js';
import { BaseRenderer } from './BaseRenderer.js';
import { resolveLods, buildGlobalPartsMap, buildPartsMap } from '../formats/WdbParser.js';

const ANIM_NODE_TO_PART = (() => {
    const m = {};
    const MAP = { 'body':'BODY','infohat':'INFOHAT','infogron':'INFOGRON','head':'HEAD',
        'arm-lft':'ARM-LFT','arm-rt':'ARM-RT','claw-lft':'CLAW-LFT','claw-rt':'CLAW-RT',
        'leg-lft':'LEG-LFT','leg-rt':'LEG-RT' };
    for (const [k, v] of Object.entries(MAP)) m[v.toLowerCase()] = `part_${k}`;
    return m;
})();

function trimLODSuffix(n) { let s=n; while(s.length>1&&((s[s.length-1]>='0'&&s[s.length-1]<='9')||s[s.length-1]==='_')) s=s.slice(0,-1); return s; }
function stripStar(n) { return n.startsWith('*')?n.slice(1):n; }


export class ScenePlayerRenderer extends BaseRenderer {
    constructor(canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
        super(canvas);
        this._lastTime = 0;
        this._elapsed = 0;
        this._playing = false;
        this._duration = 0;
        this._actorContainers = new Map();
        this._animData = null;
    }

    loadScene(sceneAnimData, participants, wdbBundle) {
        this.clearModel();
        const { wdbParser: parser, wdbData: wdb } = wdbBundle;
        this.loadTextures(wdb.globalTextures);

        this.modelGroup = new Transform();
        this.modelGroup.name = 'sceneRoot';
        this._actorContainers.clear();
        this._duration = sceneAnimData.duration;
        this._parser = parser;
        this._wdb = wdb;
        this._worldPartsMaps = new Map();

        const animData = sceneAnimData.anim;
        this._animData = animData;
        const globalPartsMap = buildGlobalPartsMap(wdb.globalParts);

        // Phase 1: Assemble actors from the actors list
        for (const actor of animData.actors) {
            if (!actor.name) continue;
            const cn = stripStar(actor.name).toLowerCase();
            if (actor.actorType === 2) {
                const ci = this._findCharacterIndex(cn);
                if (ci >= 0) {
                    const parts = this._assembleCharacterParts(ci, globalPartsMap);
                    const pm = new Map();
                    for (const [pn, pg] of parts) { this.modelGroup.addChild(pg); pm.set(pn, pg); }
                    this._actorContainers.set(cn, pm);
                    console.log(`[SP] Character: ${cn} (${parts.length} parts)`);
                }
            } else {
                const tr = trimLODSuffix(cn);
                let g = this._assemblePropHierarchical(tr);
                if (!g && tr !== cn) g = this._assemblePropHierarchical(cn);
                if (g) {
                    g.name = cn;
                    this.modelGroup.addChild(g);
                    console.log(`[SP] Prop: ${cn} (model: ${tr})`);
                } else {
                    console.warn(`[SP] Prop not found: ${cn} (trimmed: ${tr})`);
                }
            }
        }

        // Phase 2: Annotate animation tree nodes with their resolved OGL Transforms
        this._resolveAnimTree(animData.rootNode, this.modelGroup);

        // Phase 3: Create props found in the tree but not yet in the scene
        this._createMissingTreeProps(animData.rootNode);

        // Phase 4: Apply frame 0 to position everything for bounding box
        this._applyFrame(0);

        this.centerAndScaleModel(2.5);
        this.scene.addChild(this.modelGroup);
        this.camera.position.set(3, 1.5, 5);
        this.camera.lookAt([0, 0.3, 0]);
        this.setupControls(new Vec3(0, 0.3, 0));
        if (this.controls) this.controls.autoRotate = false;
        this.glRenderer.render({ scene: this.scene, camera: this.camera });
    }

    /**
     * Walk the animation tree and annotate each node.data with _transform
     * pointing to the resolved OGL Transform. Uses parent context to handle
     * duplicate names (e.g. BIRDBEAK under both BIRD and BIRD01).
     */
    _resolveAnimTree(animNode, parentOGL) {
        const raw = animNode.data?.name;
        if (!raw) {
            for (const c of animNode.children) this._resolveAnimTree(c, parentOGL);
            return;
        }

        const cn = stripStar(raw).toLowerCase();
        let matched = null;

        // 1. Character body part?
        const partName = ANIM_NODE_TO_PART[cn];
        if (partName) {
            for (const ch of this.modelGroup.children) {
                if (ch.name === partName) { matched = ch; break; }
            }
        }

        // 2. Child of parent OGL Transform? (handles duplicate names via context)
        // Matches backend FindChildROI which searches direct children of the prop root.
        if (!matched && parentOGL) {
            for (const ch of parentOGL.children) {
                if (ch.name === cn && !(ch instanceof Mesh)) { matched = ch; break; }
            }
        }

        // 3. Direct child of modelGroup?
        if (!matched) {
            for (const ch of this.modelGroup.children) {
                if (ch.name === cn && !(ch instanceof Mesh)) { matched = ch; break; }
            }
        }

        animNode.data._transform = matched || null;

        // Backend behavior: the search context only changes at the top level (props/characters
        // that are direct children of modelGroup). For nested sub-parts, the search context
        // stays at the top-level prop so siblings can be found.
        // e.g., CHTRSHLD is under CHTRBODY in the anim tree but under CHPTR in the WDB.
        const nextParent = (matched && matched.parent === this.modelGroup) ? matched : parentOGL;
        for (const c of animNode.children) {
            this._resolveAnimTree(c, nextParent);
        }
    }

    /** Create props for tree nodes that still have no _transform. */
    _createMissingTreeProps(node) {
        const raw = node.data?.name;
        if (raw && !node.data._transform) {
            const cn = stripStar(raw).toLowerCase();
            const tr = trimLODSuffix(cn);
            let g = this._assemblePropHierarchical(tr);
            if (!g && tr !== cn) g = this._assemblePropHierarchical(cn);
            if (g) {
                g.name = cn;
                this.modelGroup.addChild(g);
                node.data._transform = g;
                console.log(`[SP] Tree prop: ${cn} (model: ${tr})`);
                for (const c of node.children) this._resolveAnimTree(c, g);
                return;
            }
        }
        for (const c of node.children) this._createMissingTreeProps(c);
    }

    // ── Prop assembly ──

    _assemblePropHierarchical(name) {
        const { _parser: p, _wdb: w } = this;
        if (!p || !w) return null;
        for (const world of w.worlds || []) {
            for (const model of world.models || []) {
                if (model.name.toLowerCase() !== name) continue;
                try {
                    const md = p.parseModelData(model.dataOffset);
                    if (!md?.roi) continue;
                    if (md.textures) this.loadTextures(md.textures, false);
                    let wp = this._worldPartsMaps.get(world.name);
                    if (!wp) { wp = buildPartsMap(p, world.parts); this._worldPartsMaps.set(world.name, wp); }
                    return this._buildROITree(md.roi, wp);
                } catch (e) { console.warn(`[SP] Prop error (${name}):`, e); }
            }
        }
        const gp = buildGlobalPartsMap(w.globalParts);
        const part = gp.get(name);
        if (part?.lods?.length) { const g = new Transform(); g.name = name; this._addLodMeshes(part.lods, g); return g.children.length ? g : null; }
        return null;
    }

    _buildROITree(roi, pm) {
        const g = new Transform(); g.name = roi.name.toLowerCase();
        this._addLodMeshes(resolveLods(roi, pm), g);
        for (const c of roi.children || []) { const cg = this._buildROITree(c, pm); if (cg) g.addChild(cg); }
        return g;
    }

    _addLodMeshes(lods, g) {
        if (!lods?.length) return;
        const lod = lods[lods.length - 1];
        for (const m of lod.meshes) { const geo = this.createGeometry(m, lod); if (geo) g.addChild(new Mesh(this.gl, { geometry: geo, program: this.createMeshProgram(m) })); }
    }

    // ── Character ──

    _findCharacterIndex(n) { for (let i = 0; i < ActorInfoInit.length; i++) if (ActorInfoInit[i].name.toLowerCase() === n) return i; return -1; }

    _assembleCharacterParts(ci, gpm) {
        const info = ActorInfoInit[ci]; const res = [];
        for (let i = 0; i < 10; i++) {
            const lod = ActorLODs[i+1]; const part = info.parts[i];
            let pn; if (i===0||i===1) { if (!part.partNameIndices||!part.partNames) continue; pn = part.partNames[part.partNameIndices[part.partNameIndex]]; } else { pn = lod.parentName; }
            if (!pn) continue; const pd = gpm.get(pn.toLowerCase()); if (!pd) continue;
            const pg = new Transform(); const fn = `part_${lod.name}`; pg.name = fn;
            if (pd.lods?.length) this._cpM(pd.lods[pd.lods.length-1], lod, part, i, pg);
            pg.position.set(-lod.position[0], lod.position[1], lod.position[2]);
            res.push([fn, pg]);
        }
        return res;
    }

    _cpM(lod, aLOD, part, pi, g) {
        const uT=(aLOD.flags&ActorLODFlags.USE_TEXTURE)!==0, uC=(aLOD.flags&ActorLODFlags.USE_COLOR)!==0;
        let rn=null; if(part.nameIndices&&part.names) rn=part.names[part.nameIndices[part.nameIndex]];
        let pC=null,pT=null;
        const bd=pi===0&&part.partNameIndices&&part.partNameIndices[part.partNameIndex]===0;
        if(uT&&!bd){const tn=rn?.toLowerCase();if(tn&&this.textures.has(tn)) pT=this.textures.get(tn);}
        if((uC||bd)&&!pT){const ce=LegoColors[rn]||LegoColors['lego white'];if(ce) pC=[ce.r/255,ce.g/255,ce.b/255];}
        for(const m of lod.meshes){const geo=this.createGeometry(m,lod);if(!geo) continue;let mt=null;const mtn=m.properties?.textureName?.toLowerCase();if(mtn&&this.textures.has(mtn)) mt=this.textures.get(mtn);let pr;if(pT&&m.properties?.textureName) pr=this.createTexturedProgram(pT);else if(mt) pr=this.createTexturedProgram(mt);else if(pC) pr=this.createColoredProgram(pC);else{let c=null;if(m.properties?.useAlias&&m.properties?.materialName){const a=LegoColors[m.properties.materialName.toLowerCase()];if(a) c=[a.r/255,a.g/255,a.b/255];}if(!c){const mc=m.properties?.color||{r:128,g:128,b:128};c=[mc.r/255,mc.g/255,mc.b/255];}pr=this.createColoredProgram(c);}g.addChild(new Mesh(this.gl,{geometry:geo,program:pr}));}
    }

    // ── Playback ──

    play() { this._playing = true; this._lastTime = performance.now(); if (!this.animating) this.start(); }
    pause() { this._playing = false; }
    get playing() { return this._playing; }
    get elapsed() { return this._elapsed * 1000; }
    get duration() { return this._duration; }
    get finished() { return this._duration > 0 && this._elapsed * 1000 >= this._duration; }
    start() { this.animating = true; this._lastTime = performance.now(); this._animate(); }

    _animate() {
        if (!this.animating) return;
        requestAnimationFrame(() => this._animate());
        const now = performance.now(); const dt = (now - this._lastTime) / 1000; this._lastTime = now;
        if (this._playing) {
            this._elapsed += dt;
            if (this._elapsed * 1000 >= this._duration) { this._elapsed = this._duration / 1000; this._playing = false; }
            this._applyFrame(this._elapsed * 1000);
        }
        this.controls?.update();
        this.glRenderer.render({ scene: this.scene, camera: this.camera });
    }

    // ── Direct frame application (mirrors backend ApplyTree → ApplyAnimationTransformation) ──

    _applyFrame(timeMs) {
        if (!this._animData) return;
        const root = this._animData.rootNode;
        const id = new Mat4();
        // Map of OGL Transform → its animation world matrix, for computing relative matrices
        this._animWorldMap = new Map();
        // Backend ApplyTree starts from root's children, passing the rebase matrix.
        // We pass identity — centering is handled by modelGroup transform.
        for (const c of root.children) this._applyNode(c, timeMs, id);
    }

    /**
     * Mirrors LegoROI::ApplyAnimationTransformation.
     *
     * For OGL transforms that are direct children of modelGroup (characters, top-level props),
     * we set the full animation world matrix directly.
     *
     * For sub-parts within a hierarchical prop (e.g. jail doors under jail, helicopter blades
     * under helicopter), we compute a RELATIVE matrix: inv(parentAnimWorld) * childAnimWorld.
     * This way OGL's parent-child composition produces the correct final world transform.
     */
    _applyNode(node, time, parentMat) {
        const d = node.data; if (!d) return;

        // Build local transform: Scale → Rotation → Translation
        // Matches CreateLocalTransform in legoanim.cpp:742
        let localMat = new Mat4();
        if (d.scaleKeys.length) {
            const s = this._iv(d.scaleKeys, time);
            if (s) localMat.scale(s);
            if (d.rotationKeys.length) localMat = this._er(d.rotationKeys, time).multiply(localMat);
        } else if (d.rotationKeys.length) {
            localMat = this._er(d.rotationKeys, time);
        }
        if (d.translationKeys.length) {
            const v = this._ivT(d.translationKeys, time);
            if (v) { localMat[12] += v[0]; localMat[13] += v[1]; localMat[14] += v[2]; }
        }

        // World = parent * local (matches roi->m_local2world.Product(mat, p_matrix))
        const worldMat = new Mat4().copy(parentMat).multiply(localMat);

        const tgt = d._transform;
        if (tgt) {
            let useMat;
            if (tgt.parent === this.modelGroup) {
                // Direct child of modelGroup: use animation world matrix
                useMat = worldMat;
            } else {
                // Sub-part within a prop: compute matrix relative to OGL parent
                // so that OGL's parent.worldMatrix * child.matrix = child.animWorldMatrix
                const parentAnimWorld = this._animWorldMap.get(tgt.parent);
                if (parentAnimWorld) {
                    const inv = new Mat4().copy(parentAnimWorld).inverse();
                    useMat = inv.multiply(worldMat);
                } else {
                    // OGL parent not animated — use world matrix directly
                    useMat = worldMat;
                }
            }

            for (let i = 0; i < 16; i++) tgt.matrix[i] = useMat[i];
            tgt.matrixAutoUpdate = false;
            tgt.worldMatrixNeedsUpdate = true;

            // Store this target's animation world matrix for sub-parts
            this._animWorldMap.set(tgt, worldMat);

            // Visibility from morph keys (matches GetVisibility in legoanim.cpp:937)
            if (d.morphKeys.length) {
                const r = this._findKeys(d.morphKeys, time);
                tgt.visible = (r.n === 0) ? true : d.morphKeys[r.i].visible;
            }

        }

        // Recurse — always pass worldMat, matching backend behavior for unresolved nodes
        for (const c of node.children) this._applyNode(c, time, worldMat);
    }

    // ── Keyframe evaluation (matches backend FindKeys / GetRotation / GetTranslation / GetScale) ──

    /** Matches FindKeys in legoanim.cpp:960. n=0: no-op, n=1: use key[i], n=2: interpolate keys[i]..keys[i+1] */
    _findKeys(keys, t) {
        if (keys.length === 0) return { n: 0 };
        if (t < keys[0].time) return { n: 0 };
        if (t > keys[keys.length - 1].time) return { n: 1, i: keys.length - 1 };
        let idx = 0;
        for (let j = 0; j < keys.length - 1; j++) {
            if (t >= keys[j + 1].time) { idx = j + 1; continue; }
            break;
        }
        if (t === keys[idx].time) return { n: 1, i: idx };
        if (idx < keys.length - 1) return { n: 2, i: idx };
        return { n: 0 };
    }

    /** Matches GetRotation in legoanim.cpp:843. Returns Mat4 rotation matrix.
     *  Matches ActorRenderer: negate quaternion X to match vertex X-negation in BaseRenderer. */
    _er(keys, t) {
        const r = this._findKeys(keys, t);
        const Q = k => new Quat(-k.x, k.y, k.z, k.w);
        if (r.n === 0) return new Mat4();
        if (r.n === 1) return (keys[r.i].flags & 1) ? new Mat4().fromQuaternion(Q(keys[r.i])) : new Mat4();
        const b = keys[r.i], a = keys[r.i + 1];
        if ((b.flags & 1) || (a.flags & 1)) {
            const bQ = Q(b);
            if (a.flags & 4) return new Mat4().fromQuaternion(bQ);
            const aQ = Q(a);
            if (a.flags & 2) aQ.set(-aQ[0], -aQ[1], -aQ[2], -aQ[3]);
            return new Mat4().fromQuaternion(new Quat().copy(bQ).slerp(aQ, (t - b.time) / (a.time - b.time)));
        }
        return new Mat4();
    }

    /** Matches GetTranslation in legoanim.cpp:779. Returns Vec3 or null. Checks IsActive flag.
     *  Matches ActorRenderer: negate X to match vertex X-negation in BaseRenderer. */
    _ivT(keys, t) {
        const r = this._findKeys(keys, t);
        if (r.n === 0) return null;
        if (r.n === 1) {
            if (!(keys[r.i].flags & 1)) return null;
            return new Vec3(-keys[r.i].x, keys[r.i].y, keys[r.i].z);
        }
        const b = keys[r.i], a = keys[r.i + 1];
        if (!(b.flags & 1) && !(a.flags & 1)) return null;
        const f = (t - b.time) / (a.time - b.time);
        const x = b.x + f * (a.x - b.x), y = b.y + f * (a.y - b.y), z = b.z + f * (a.z - b.z);
        return new Vec3(-x, y, z);
    }

    /** Matches GetScale in legoanim.cpp:906. Returns Vec3 or null. No active check (backend doesn't check for scale). */
    _iv(keys, t) {
        const r = this._findKeys(keys, t);
        if (r.n === 0) return null;
        if (r.n === 1) return new Vec3(keys[r.i].x, keys[r.i].y, keys[r.i].z);
        const b = keys[r.i], a = keys[r.i + 1];
        const f = (t - b.time) / (a.time - b.time);
        return new Vec3(b.x + f * (a.x - b.x), b.y + f * (a.y - b.y), b.z + f * (a.z - b.z));
    }

    // ── Debug ──

    _dumpTree(n, d = 0) { const dd=n.data;if(dd?.name){console.log(`[SP]${'  '.repeat(d)}${dd.name} [T:${dd.translationKeys.length} R:${dd.rotationKeys.length} S:${dd.scaleKeys.length} M:${dd.morphKeys.length}] ${dd._transform?'✓ →'+dd._transform.name:'✗'}`);}for(const c of n.children) this._dumpTree(c,d+1); }
    _dumpSG(n, d = 0) { if(!(n instanceof Mesh)) console.log(`[SP]${'  '.repeat(d)}${n.name||'(anon)'} (${n.children?.length||0} ch)`);for(const c of n.children||[]) this._dumpSG(c,d+1); }

    // ── Cleanup ──

    clearModel() {
        this._animData = null;
        this._actorContainers.clear(); this._elapsed = 0; this._playing = false; this._parser = null; this._wdb = null; this._worldPartsMaps = null;
        super.clearModel();
    }
    dispose() { this.animating = false; this.clearModel(); super.dispose(); }
}
