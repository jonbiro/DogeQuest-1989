export class Input {
    constructor() {
        this.codes = {
            ArrowLeft: "left",
            ArrowUp: "up",
            ArrowRight: "right",
            KeyA: "left",
            KeyD: "right",
            KeyW: "up",
            Space: "up",
            ShiftLeft: "shift",
            ShiftRight: "shift"
        };
        this.keys = {};
        this.buttonCleanups = [];
        this.boundHandler = this.handler.bind(this);
        this.boundReset = this.reset.bind(this);

        document.addEventListener("keydown", this.boundHandler);
        document.addEventListener("keyup", this.boundHandler);
        window.addEventListener("blur", this.boundReset);

        // Pointer events support touch, pen, and mouse without sticky controls.
        const buttons = { "btn-left": "left", "btn-right": "right", "btn-jump": "up", "btn-dash": "shift" };
        for (const [name, action] of Object.entries(buttons)) {
            const el = document.getElementById(name);
            if (el) {
                const press = (event) => {
                    event.preventDefault();
                    this.keys[action] = true;
                    el.style.opacity = '1';

                    if (el.setPointerCapture && event.pointerId !== undefined) {
                        el.setPointerCapture(event.pointerId);
                    }
                    if (navigator.vibrate) navigator.vibrate(15);
                };
                const release = (event) => {
                    event.preventDefault();
                    this.keys[action] = false;
                    el.style.opacity = '0.6';
                };
                const keyboardActivate = (event) => {
                    if (event.detail !== 0) return;
                    this.keys[action] = true;
                    window.setTimeout(() => {
                        this.keys[action] = false;
                    }, 120);
                };

                el.addEventListener("pointerdown", press);
                el.addEventListener("pointerup", release);
                el.addEventListener("pointercancel", release);
                el.addEventListener("click", keyboardActivate);
                this.buttonCleanups.push(() => {
                    el.removeEventListener("pointerdown", press);
                    el.removeEventListener("pointerup", release);
                    el.removeEventListener("pointercancel", release);
                    el.removeEventListener("click", keyboardActivate);
                });
            }
        }
    }

    handler(event) {
        const action = this.codes[event.code];
        if (action) {
            this.keys[action] = event.type === "keydown";
            event.preventDefault();
        }
    }

    reset() {
        this.keys = {};
    }

    unregister() {
        document.removeEventListener("keydown", this.boundHandler);
        document.removeEventListener("keyup", this.boundHandler);
        window.removeEventListener("blur", this.boundReset);
        this.buttonCleanups.forEach(cleanup => cleanup());
        this.buttonCleanups = [];
        this.reset();
    }
}
