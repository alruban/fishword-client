// three-extensions.d.ts
import { type Object3D } from 'three';

declare module 'three' {
  export interface Object3D {
    isMesh?: boolean | undefined;

  }

  export namespace ShaderChunk {
    let global: string;
    let skybox: string;
    let ocean: string;
    let parallax: string;
  }
}
