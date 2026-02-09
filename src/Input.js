export class Input {
    constructor() {
        this.codes = { 37: "left", 38: "up", 39: "right", 65: "left", 68: "right", 87: "up", 32: "up", 16: "shift" };
        this.keys = {};

        document.addEventListener("keydown", this.handler.bind(this));
        document.addEventListener("keyup", this.handler.bind(this));

        // Mobile controls with haptic feedback
        let buttons = { "btn-left": "left", "btn-right": "right", "btn-jump": "up", "btn-dash": "shift" };
        for (let name in buttons) {
            let el = document.getElementById(name);
            if (el) {
                el.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    this.keys[buttons[name]] = true;
                    el.style.opacity = '1';
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(15);
                });
                el.addEventListener("touchend", (e) => {
                    e.preventDefault();
                    this.keys[buttons[name]] = false;
                    el.style.opacity = '0.6';
                });
            }
        }
    }

    handler(event) {
        if (this.codes.hasOwnProperty(event.keyCode)) {
            let down = event.type === "keydown";
            this.keys[this.codes[event.keyCode]] = down;
            event.preventDefault();
        }
    }

    unregister() {
        window.removeEventListener("keydown", this.handler);
        window.removeEventListener("keyup", this.handler);
    }
}
