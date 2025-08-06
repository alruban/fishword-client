import { Vector3, Quaternion } from 'three';
import Component from './component';
import EntityManager from './entityManager';

type EventHandler = (msg: any) => void;

export default class Entity {
  public name: string | null;
  public components: { [key: string]: Component };
  public id: null | number = null;
  public position: Vector3;
  public rotation: Quaternion;
  private parent:  null | EntityManager;
  private eventHandlers: { [topic: string]: EventHandler[] };

  constructor() {
    this.name = null;
    this.components = {};
    this.position = new Vector3();
    this.rotation = new Quaternion();
    this.parent = null;
    this.eventHandlers = {};
  }

  get Name(): string | null {
    return this.name;
  }

  get Position(): Vector3 {
    return this.position;
  }

  get Rotation(): Quaternion {
    return this.rotation;
  }

  addComponent(component: Component): void {
    component.setParent(this);
    this.components[component.name] = component;
  }

  setParent(parent: null | EntityManager): void {
    this.parent = parent;
  }

  setName(name: string): void {
    this.name = name;
  }

  getComponent(name: string): Component | undefined {
    return this.components[name];
  }

  setPosition(position: Vector3): void {
    this.position.copy(position);
  }

  setRotation(rotation: Quaternion): void {
    this.rotation.copy(rotation);
  }

  findEntity(name: string): Entity | undefined {
    return this.parent?.get(name);
  }

  registerEventHandler(handler: EventHandler, topic: string): void {
    if (!this.eventHandlers.hasOwnProperty(topic)) {
      this.eventHandlers[topic] = [];
    }

    this.eventHandlers[topic]?.push(handler);
  }

  broadcast(message: { topic: string; [key: string]: any }): void {
    if (!this.eventHandlers.hasOwnProperty(message.topic)) return;

    const e = this.eventHandlers[message.topic];
    if (!e) return;

    for (const handler of e) {
      handler(message);
    }
  }

  physicsUpdate(world: any, timeStep: number): void {
    for (let k in this.components) {
      this.components[k]?.physicsUpdate(timeStep);
    }
  }

  update(timeElapsed: number): void {
    for (let k in this.components) {
      this.components[k]?.update(timeElapsed);
    }
  }
}
