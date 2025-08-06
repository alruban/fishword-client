import Entity from "./entity";

export default class Component {
  name!: string;
  parent!: Entity;

  initialise(): void { }

  setParent(parent: Entity): void {
    this.parent = parent;
  }

  getComponent(name: string): Component | undefined {
    return this.parent.getComponent(name) as Component | undefined;
  }

  findEntity(name: string): Entity | undefined {
    return this.parent.findEntity(name);
  }

  broadcast(message: { topic: string; [key: string]: any }): void {
    this.parent.broadcast(message);
  }

  update(deltaTime: number): void { }

  physicsUpdate(deltaTime: number): void { }

  dispose(): void {}
}
