(function () {
  "use strict";

  var MERMAID_URL = "https://unpkg.com/mermaid@11.16.0/dist/mermaid.esm.min.mjs";
  var ELK_URL = "https://unpkg.com/@mermaid-js/layout-elk@0.2.2/dist/mermaid-layout-elk.esm.min.mjs";

  if (window.mermaid) {
    return;
  }

  var engine = null;
  var config = null;

  function load() {
    if (!engine) {
      engine = Promise.all([import(MERMAID_URL), import(ELK_URL)]).then(function (modules) {
        var mermaid = modules[0].default;
        mermaid.registerLayoutLoaders(modules[1].default);
        if (config) {
          mermaid.initialize(config);
        }
        return mermaid;
      });
    }

    return engine;
  }

  window.mermaid = {
    initialize: function (options) {
      config = Object.assign({}, options, {
        securityLevel: "strict",
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          fontFamily: "Roboto, Arial, sans-serif",
          primaryColor: "#e8f1f8",
          primaryTextColor: "#1f2933",
          primaryBorderColor: "#3f6075",
          lineColor: "#627282",
          secondaryColor: "#eef4f2",
          tertiaryColor: "#fff8e1"
        }
      });

      if (engine) {
        engine.then(function (mermaid) {
          mermaid.initialize(config);
        });
      }
    },

    render: function (id, text, container) {
      return load()
        .then(function (mermaid) {
          return mermaid.render(id, text, container);
        })
        .then(function (result) {
          return {
            svg: result.svg,
            fn: function (shadow) {
              if (result.bindFunctions) {
                result.bindFunctions(shadow);
              }
              if (window.fiapxDiagram && shadow && shadow.host) {
                window.fiapxDiagram.enhance(shadow.host);
              }
            }
          };
        });
    }
  };

  if (document.querySelector("pre.mermaid, .mermaid")) {
    var link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://unpkg.com";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    load();
  }
})();
