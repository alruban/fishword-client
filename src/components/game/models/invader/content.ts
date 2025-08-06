import { Mesh, RepeatWrapping, TextureLoader } from 'three';
import Component from '../../world/component';
import { LoadedAsset, World } from '../../../../world';

export default class InvaderContent extends Component {
  public name: string = "InvaderContent";

  private asset: LoadedAsset;
  private world: World;
  private storage: PlayerStorage;

  private currentFaceBase64!: string;

  constructor(asset: LoadedAsset, world: World, storage: PlayerStorage) {
    super();

    this.asset = asset;
    this.world = world;
    this.storage = storage;
  }

  initialise(): void {
    this.handleFace();
  }

  async update() {
    const base64Face = this.world.players[this.storage.state.id]?.state.face as string;
    if (base64Face !== this.currentFaceBase64) this.setNewFace(base64Face);
  }

  handleFace() {
    const base64Face = this.world.players[this.storage.state.id]?.state.face as string;
    this.currentFaceBase64 = base64Face;
    this.setNewFace(base64Face);
  }

  setNewFace(base64: string) {
    this.currentFaceBase64 = base64;

    // No need to create a Blob, just use the base64 string directly
    const textureLoader = new TextureLoader();
    const image = new Image();
    image.src = `data:image/jpeg;base64,${base64}`;
    image.onload = () => {
      const texture = textureLoader.load(image.src);
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.y = -1; // Flip texture
      texture.offset.y = 1; // Offset the texture to align it correctly

      this.asset.scene.traverse((child: any) => {
        if ((child as Mesh).isMesh) {
          // Apply the texture to the specific mesh/material
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });
    };
  }
}
