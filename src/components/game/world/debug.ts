
/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @description  This is a modified version of the original code from Kevin Lee
 */

/**
 * @author       Kevin Lee (https://github.com/InfiniteLee)
 * @copyright    Copyright (c) 2019 Kevin Lee; Project Url: https://github.com/InfiniteLee/ammo-debug-drawer
 * @license      {@link https://github.com/InfiniteLee/ammo-debug-drawer/blob/master/LICENSE|MPL-2.0}
 */

/**
 * An implementation of the btIDebugDraw interface in Ammo.js, for debug rendering of Ammo shapes
 */

import {
  LineBasicMaterial,
  StaticDrawUsage,
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Vector3,
  Scene
} from 'three';

const AmmoDebugConstants = {
  NoDebug: 0,
  DrawWireframe: 1,
  DrawAabb: 2,
  DrawFeaturesText: 4,
  DrawContactPoints: 8,
  NoDeactivation: 16,
  NoHelpText: 32,
  DrawText: 64,
  ProfileTimings: 128,
  EnableSatComparison: 256,
  DisableBulletLCP: 512,
  EnableCCD: 1024,
  DrawConstraints: 1 << 11, //2048
  DrawConstraintLimits: 1 << 12, //4096
  FastWireframe: 1 << 13, //8192
  DrawNormals: 1 << 14, //16384
  DrawOnTop: 1 << 15, //32768
  MAX_DEBUG_DRAW_MODE: 0xffffffff
}

interface DebugOptions {
  debugDrawMode?: number;
  maxBufferSize?: number;
}

/**
 * An implementation of the btIDebugDraw interface in Ammo.js, for debug rendering of Ammo shapes
 * @class AmmoDebugDrawer
 * @param {Enmat} enmat
 * @param {THREE.Scene} scene
 * @param {Ammo.btDiscreteDynamicsWorld} world
 * @param {object} [options]
 */
class AmmoDebugDrawer {
  private enmat: Enmat;
  private scene: Scene;
  private physics: Ammo.btDiscreteDynamicsWorld;
  private options: DebugOptions;
  private debugDrawMode: number;
  private geometry: BufferGeometry;
  private mesh: LineSegments;
  private enabled: boolean;
  private debugDrawer: any;
  private index: number;
  private warnedOnce = false;

  constructor(enmat: Enmat, scene: Scene, physics: Ammo.btDiscreteDynamicsWorld, options: DebugOptions = {}) {
    this.enmat = enmat;
    this.scene = scene;
    this.physics = physics;
    this.options = options;
    this.debugDrawMode = options.debugDrawMode || AmmoDebugConstants.DrawWireframe;
    const drawOnTop = !!(this.debugDrawMode & AmmoDebugConstants.DrawOnTop);
    const maxBufferSize = options.maxBufferSize || 1000000;

    this.geometry = new BufferGeometry();
    const vertices = new Float32Array(maxBufferSize * 3);
    const colors = new Float32Array(maxBufferSize * 3);

    this.geometry.setAttribute('position', new BufferAttribute(vertices, 3).setUsage(StaticDrawUsage));
    this.geometry.setAttribute('color', new BufferAttribute(colors, 3).setUsage(StaticDrawUsage));

    this.index = 0;

    const material = new LineBasicMaterial({
      vertexColors: true,
      depthTest: !drawOnTop
    });

    this.mesh = new LineSegments(this.geometry, material);
    if (drawOnTop) this.mesh.renderOrder = 999;
    this.mesh.frustumCulled = false;

    this.enabled = false;

    // Initialize your debugDrawer methods
    this.debugDrawer = new this.enmat.ammo.DebugDrawer();
    this.debugDrawer.drawLine = this.drawLine.bind(this);
    this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this);
    this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this);
    this.debugDrawer.draw3dText = this.draw3dText.bind(this);
    this.debugDrawer.setDebugMode = this.setDebugMode.bind(this);
    this.debugDrawer.getDebugMode = this.getDebugMode.bind(this);

    this.physics.setDebugDrawer(this.debugDrawer);
  }

  enable() {
    this.enabled = true;
    this.scene.add(this.mesh);
  }

  disable() {
    this.enabled = false;
    this.scene.remove(this.mesh);
  }

  update() {
    if (!this.enabled) return;

    if (this.index !== 0) {
      if (this.geometry.attributes.position) this.geometry.attributes.position.needsUpdate = true;
      if (this.geometry.attributes.color) this.geometry.attributes.color.needsUpdate = true;
    }

    this.index = 0;
    this.physics.debugDrawWorld();
    this.geometry.setDrawRange(0, this.index);
  }

  // Implement the drawLine method
  drawLine(from: number, to: number, color: number) {
    const heap = this.enmat.ammo.HEAPF32;
    const r = Number(heap[(color + 0) / 4]);
    const g = Number(heap[(color + 4) / 4]);
    const b = Number(heap[(color + 8) / 4]);

    const fromX = Number(heap[(from + 0) / 4]);
    const fromY = Number(heap[(from + 4) / 4]);
    const fromZ = Number(heap[(from + 8) / 4]);

    this.geometry.attributes.position?.setXYZ(this.index, fromX, fromY, fromZ);
    this.geometry.attributes.color?.setXYZ(this.index++, r, g, b);

    const toX = Number(heap[(to + 0) / 4]);
    const toY = Number(heap[(to + 4) / 4]);
    const toZ = Number(heap[(to + 8) / 4]);
    this.geometry.attributes.position?.setXYZ(this.index, toX, toY, toZ);
    this.geometry.attributes.color?.setXYZ(this.index++, r, g, b);
  }

  // Implement the drawContactPoint method
  drawContactPoint(pointOnB: number, normalOnB: number, distance: number, lifeTime: number, color: number) {
    const heap = this.enmat.ammo.HEAPF32;

    const r = Number(heap[(color + 0) / 4]);
    const g = Number(heap[(color + 4) / 4]);
    const b = Number(heap[(color + 8) / 4]);

    const x = Number(heap[(pointOnB + 0) / 4]);
    const y = Number(heap[(pointOnB + 4) / 4]);
    const z = Number(heap[(pointOnB + 8) / 4]);

    this.geometry.attributes.position?.setXYZ(this.index, x, y, z);
    this.geometry.attributes.color?.setXYZ(this.index++, r, g, b);

    const dx = Number(heap[(normalOnB + 0) / 4]) * distance;
    const dy = Number(heap[(normalOnB + 4) / 4]) * distance;
    const dz = Number(heap[(normalOnB + 8) / 4]) * distance;
    this.geometry.attributes.position?.setXYZ(this.index, x + dx, y + dy, z + dz);
    this.geometry.attributes.color?.setXYZ(this.index++, r, g, b);
  }

  // Implement the reportErrorWarning method
  reportErrorWarning(warningString: string) {
    if (this.enmat.ammo.hasOwnProperty('Pointer_stringify')) {
      console.warn(Ammo.Pointer_stringify(warningString));
    } else if (!this.warnedOnce) {
      this.warnedOnce = true;
      console.warn("Cannot print warningString, please rebuild Ammo.js using 'debug' flag");
    }
  }

  // Implement the draw3dText method
  draw3dText(location: Vector3, textString: string) {
    console.warn('TODO: draw3dText');
  }

  // Implement the setDebugMode method
  setDebugMode(debugMode: number) {
    this.debugDrawMode = debugMode;
  }

  // Implement the getDebugMode method
  getDebugMode(): number {
    return this.debugDrawMode;
  }
}

export default AmmoDebugDrawer;
