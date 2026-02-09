export class Input {
    constructor() {
        this.keys = Object.create(null);
        this.codes = {
            37: "left", 38: "up", 39: "right",
            87: "up", 65: "left", 68: "right",
            32: "up", 16: "shift"
        };

        this.handler = this.handler.bind(this);

        window.addEventListener("keydown", this.handler);
        window.addEventListener("keyup", this.handler);

        // Mobile Touch Handlers
        this.setupTouch('btn-left', 'left');
        this.setupTouch('btn-right', 'right');
        this.setupTouch('btn-jump', 'up');
        this.setupTouch('btn-dash', 'shift');
    }

    setupTouch(id, keyName) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const setKey = (state) => {
            this.keys[keyName] = state;
        };

        btn.addEventListener('touchstart', (e) => { e.preventDefault(); setKey(true); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); setKey(false); });
        btn.addEventListener('mousedown', (e) => { setKey(true); });
        btn.addEventListener('mouseup', (e) => { setKey(false); });
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
