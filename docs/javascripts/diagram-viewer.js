(function () {
  "use strict";

  var ICONS = {
    in: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z",
    out: "M19 13H5v-2h14v2Z",
    fit: "M4 9V4h5v2H6v3H4m11-5h5v5h-2V6h-3V4M4 15h2v3h3v2H4v-5m14 0h2v5h-5v-2h3v-3Z",
    full: "M5 5h6v2H7v4H5V5m8 0h6v6h-2V7h-4V5m4 8h2v6h-6v-2h4v-4M5 13h2v4h4v2H5v-6Z"
  };

  function svg(path) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="' + path + '"/></svg>';
  }

  function button(action, label) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "fiapx-diagram__button";
    el.dataset.action = action;
    el.title = label;
    el.setAttribute("aria-label", label);
    el.innerHTML = svg(ICONS[action]);
    return el;
  }

  function enhance(host) {
    if (!host || host.dataset.fiapxDiagram === "true" || !host.parentNode) {
      return;
    }

    host.dataset.fiapxDiagram = "true";

    var root = document.createElement("div");
    root.className = "fiapx-diagram";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "Diagrama");

    var stage = document.createElement("div");
    stage.className = "fiapx-diagram__stage";
    stage.tabIndex = 0;

    var bar = document.createElement("div");
    bar.className = "fiapx-diagram__bar";

    var hint = document.createElement("p");
    hint.className = "fiapx-diagram__hint";
    hint.textContent = "Use os controles para ampliar, reduzir, ajustar ou abrir em tela cheia.";

    var actions = document.createElement("div");
    actions.className = "fiapx-diagram__actions";
    actions.appendChild(button("out", "Reduzir"));
    actions.appendChild(button("in", "Ampliar"));
    actions.appendChild(button("fit", "Ajustar"));
    actions.appendChild(button("full", "Tela cheia"));

    host.parentNode.insertBefore(root, host);
    stage.appendChild(host);
    bar.appendChild(hint);
    bar.appendChild(actions);
    root.appendChild(stage);
    root.appendChild(bar);

    var scale = 1;

    function apply(next) {
      scale = Math.max(0.5, Math.min(2.5, next));
      host.style.transform = "scale(" + scale + ")";
      host.style.transformOrigin = "top left";
      host.style.width = (100 / scale) + "%";
    }

    actions.addEventListener("click", function (event) {
      var target = event.target.closest("[data-action]");
      if (!target) {
        return;
      }

      if (target.dataset.action === "in") {
        apply(scale * 1.2);
      } else if (target.dataset.action === "out") {
        apply(scale / 1.2);
      } else if (target.dataset.action === "fit") {
        host.removeAttribute("style");
        scale = 1;
      } else if (document.fullscreenElement === root) {
        document.exitFullscreen();
      } else if (root.requestFullscreen) {
        root.requestFullscreen();
      }
    });
  }

  window.fiapxDiagram = { enhance: enhance };
})();
