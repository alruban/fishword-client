import { AmbientLight, DirectionalLight, Scene } from 'three';
import Component from '../world/component';

export default class Lighting extends Component {
  private scene: Scene;

  constructor(scene: Scene) {
    super();

    this.scene = scene;
  }

  initialise() {
    // Ambient light
    const ambientLight = new AmbientLight(0xffffff, 0.5); // soft white light
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1); // position the light
    this.scene.add(directionalLight);
  }
}
