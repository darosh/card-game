(function (app) {
    function utilSpeak(text, pitch) {
        if (!window.speechSynthesis) {
            return;
        }

        var msg = new SpeechSynthesisUtterance(text);
        msg.pitch = isNaN(pitch) ? 1 : d3.scaleLinear().range([0.9, 1.7])(pitch);
        msg.rate = 1;
        window.speechSynthesis.speak(msg);
    }

    function utilIsFullScreen() {
        return document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            (window.innerHeight === window.screen.height);
    }

    function utilFullScreen(el, off) {
        if (off || utilIsFullScreen()) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        }
    }

    // https://developer.mozilla.org/en-US/docs/Web/Events/resize
    function utilThrottle(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function () {
            if (running) {
                return;
            }
            running = true;
            setTimeout(function () {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            }, 200);
        };
        obj.addEventListener(type, func);
    }

    app.utilSpeak = utilSpeak;
    app.utilIsFullScreen = utilIsFullScreen;
    app.utilFullScreen = utilFullScreen;
    utilThrottle('resize', 'optimizedResize');
})(window.app = window.app || {});
