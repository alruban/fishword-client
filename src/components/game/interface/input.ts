export class Input {
  private _keyMap: { [key: string]: number } = {};
  private _touchCount: number = 0;
  private events: any[] = [];

  constructor() {
    this.addKeyDownListener(this._onKeyDown.bind(this));
    this.addKeyUpListener(this._onKeyUp.bind(this));
  }

  private _addEventListener(element: HTMLElement | Document, type: string, callback: EventListener, options: AddEventListenerOptions = {}) {
    element.addEventListener(type, callback, options);
    this.events.push({ element, type, callback, options });
  }

  addKeyDownListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'keydown', callback, { passive: false });
  }

  addKeyUpListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'keyup', callback, { passive: false });
  }

  addMouseMoveListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'mousemove', callback, { passive: false });
  }

  addMouseLeaveListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'mouseleave', callback, { passive: false });
  }

  addMouseWheelListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'mousewheel', callback, { passive: false });
  }

  addClickListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'click', callback, { passive: false });
  }

  addMouseDownListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'mousedown', callback, { passive: false });
  }

  addMouseUpListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'mouseup', callback, { passive: false });
  }

  addTouchStartListener(callback: EventListener, target = document as Document | HTMLElement) {
    const wrappedCallback: any = (event: TouchEvent) => {
      this._touchCount = event.touches.length;
      callback(event);
    };

    this._addEventListener(target, 'touchstart', wrappedCallback, { passive: false });
  }

  addTouchMoveListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'touchmove', callback, { passive: false });
  }

  addTouchEndListener(callback: EventListener, target = document as Document | HTMLElement) {
    const wrappedCallback: any = (event: TouchEvent) => {
      this._touchCount = event.touches.length; // Update touch count
      callback(event);
    };

    this._addEventListener(target, 'touchend', wrappedCallback);
  }

  addContextMenuListener(callback: EventListener, target = document as Document | HTMLElement) {
    this._addEventListener(target, 'contextmenu', callback, { passive: false });
  }

  // New method to check for two active touches
  private _onKeyDown: EventListener = (event: Event) => {
    if (event instanceof KeyboardEvent) {
      this._keyMap[event.code] = 1;
    }
  }

  private _onKeyUp: EventListener = (event: Event) => {
    if (event instanceof KeyboardEvent) {
      this._keyMap[event.code] = 0;
    }
  }

  /**
   * Checks if the current device supports touch events.
   * @returns {boolean} true if the device is a touch device, false otherwise.
   */
  isTouchDevice(): boolean {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  getKeyDown(code: string): number {
    return this._keyMap[code] ?? 0;
  }

  getTouchCount(): number {
    return this._touchCount ?? 0
  }

  clearEventListeners() {
    this.events.forEach(e => {
      e.element.removeEventListener(e.type, e.callback);
    });

    this.events = [];
    this.addKeyDownListener(this._onKeyDown.bind(this));
    this.addKeyUpListener(this._onKeyUp.bind(this));
  }
}

