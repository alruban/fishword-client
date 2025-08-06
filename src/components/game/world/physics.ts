import {
  Object3D,
  BufferGeometry,
  Float32BufferAttribute
} from 'three';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull';

type Enmat = {
  ammo: typeof Ammo
  createConvexHullShape: (object: Object3D) => Ammo.btConvexHullShape,
  createConvexGeom: (object: Object3D) => BufferGeometry,
}

export default class AmmoWrapper {
  static initialise(callback = (enmat: Enmat) => { }) {
    import('ammo.js').then(async (ammoModule) => {
      const ammo = await ammoModule.default();

      const createConvexGeom = (object: Object3D): BufferGeometry => {
        // Compute the 3D convex hull...
        const hull = new ConvexHull().setFromObject(object);
        const faces = hull.faces;
        const vertices: number[] = [];
        const normals: number[] = [];

        for (let i = 0; i < faces.length; i++) {
          const face = faces[i];
          if (!face) continue;

          let edge = face.edge;

          do {
            const point = edge.head().point;
            vertices.push(point.x, point.y, point.z);
            normals.push(face.normal.x, face.normal.y, face.normal.z);
            edge = edge.next;
          } while (edge !== face.edge);
        }

        const geom = new BufferGeometry();
        geom.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geom.setAttribute('normal', new Float32BufferAttribute(normals, 3));

        return geom;
      }

      const createConvexHullShape = (object: Object3D): Ammo.btConvexHullShape => {
        const geometry = createConvexGeom(object);
        const tempVec = new ammo.btVector3(0, 0, 0);
        const shape = new ammo.btConvexHullShape();

        let coords = geometry.attributes.position?.array;
        if (coords instanceof Float32Array) {
          for (let i = 0; i < coords.length; i += 3) {
            if (i + 2 < coords.length) {
              tempVec.setValue(coords[i] as number, coords[i + 1] as number, coords[i + 2] as number);
              let lastOne = (i >= (coords.length - 3));
              shape.addPoint(tempVec, lastOne);
            }
          }
        }

        return shape;
      }

      const enmat = {
        ammo: ammo,
        createConvexHullShape: createConvexHullShape,
        createConvexGeom: createConvexGeom
      }

      callback(enmat);
    })

    .catch(error => {
      console.error('Failed to load Ammo.js:', error);
    });
  }
}
