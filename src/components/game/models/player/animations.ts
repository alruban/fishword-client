import { AnimationClip, AnimationMixer } from 'three';

import Component from '../../world/component';
import { LoadedAsset } from '../../../../world';
import { Input } from '../../interface/input';

export default class PlayerAnimations extends Component {
  public name: string = "PlayerAnimations";

  private asset: LoadedAsset;
  private input: Input;
  private mixer!: AnimationMixer;

  constructor(asset: LoadedAsset, input: Input) {
    super();

    this.asset = asset;
    this.input = input;

    this.mixer = new AnimationMixer(this.asset.scene);
  }

  initialise(): void {

    if (this.asset.animations.length > 0) {
      this.asset.animations.forEach((clip: AnimationClip) => {
        const action = this.mixer.clipAction(clip);
        action.play();
      });
    }
  }

  async update(deltaTime: number): Promise<void> {
    // this.asset.animations.forEach((clip: AnimationClip) => {
    //   const action = this.mixer.clipAction(clip);

    //   if (
    //     Boolean(this.input.getKeyDown("KeyW"))       || // Forward
    //     Boolean(this.input.getKeyDown("KeyS"))       || // Backward
    //     Boolean(this.input.getKeyDown("KeyD"))       || // Left
    //     Boolean(this.input.getKeyDown("KeyA"))       || // Right
    //     Boolean(this.input.getKeyDown("Space"))      || // Up
    //     Boolean(this.input.getKeyDown("ShiftLeft"))     // Down
    //   ) {
    //     action.play();
    //   } else {
    //     action.stop();
    //   }
    // });

    this.mixer.update(deltaTime);
  }
}
