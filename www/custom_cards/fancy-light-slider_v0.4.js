import "https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/10.0.0/nouislider.min.js";

const minRange = 0;
const maxRange = 255;

class FancySliderCard extends HTMLElement {
  // Whenever the state changes, a new `hass` object is set. Use this to
  // update your content.

  set hass(hass) {
    // Initialize the content if it's not there yet.
    if (!this.content) {
      let repeatedHtml = "";

      this.config.entities.map((entity) => {
        const state = hass.states[entity];
        if (!state) return "";

        repeatedHtml =
          repeatedHtml +
          `<div style="display: flex;">
            ${
              this.config.showTitle
                ? `<div style="margin: 18px; width:100px;" >${state?.attributes.friendly_name}</div>`
                : ""
            }
            <div
              class="Range"
              style="padding: 18px;"
              data-js="${entity}"
            ></div>
          </div>`;
      });

      this.innerHTML = `
          <ha-card style="padding: 20px;">
            <div>
              <div style="display: flex;">
              ${
                this.config.showIcon
                  ? `<svg height=50 width=50 fill=#666 xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 512 512"><path d="M256.011,16H256A160.035,160.035,0,0,0,117.132,255.516a161.029,161.029,0,0,0,55.644,57.149A23.857,23.857,0,0,1,184,332.98v4.4A23.977,23.977,0,0,0,174.131,376a23.943,23.943,0,0,0,0,32A23.977,23.977,0,0,0,184,446.624V456a40.045,40.045,0,0,0,40,40h64a40.045,40.045,0,0,0,40-40v-9.376A23.977,23.977,0,0,0,337.869,408a23.943,23.943,0,0,0,0-32A23.977,23.977,0,0,0,328,337.376v-4.4a23.955,23.955,0,0,1,11.568-20.523A159.891,159.891,0,0,0,416,176C416,87.782,344.229,16.006,256.011,16ZM192,352H320a8,8,0,0,1,0,16H192a8,8,0,0,1,0-16Zm40-96h-8a8,8,0,1,1,8-8Zm16,16h16v64H248Zm80,120a8.009,8.009,0,0,1-8,8H192a8,8,0,0,1,0-16H320A8.009,8.009,0,0,1,328,392Zm-40,88H224a24.027,24.027,0,0,1-24-24v-8H312v8A24.027,24.027,0,0,1,288,480Zm32-48H192a8,8,0,0,1,0-16H320a8,8,0,0,1,0,16Zm11.2-133.183a39.85,39.85,0,0,0-19.2,34.16V336H280V272h8a24,24,0,1,0-24-24v8H248v-8a24,24,0,1,0-24,24h8v64H200v-3.02a39.95,39.95,0,0,0-18.891-33.973A143.982,143.982,0,0,1,256,32h.011C335.406,32.006,400,96.6,400,176A143.156,143.156,0,0,1,331.2,298.817ZM280,256v-8a8,8,0,1,1,8,8Z"/><path d="M256,48h-8a8,8,0,0,0,0,16h8A112.127,112.127,0,0,1,368,176v8a8,8,0,0,0,16,0v-8A128.145,128.145,0,0,0,256,48Z"/></svg>`
                  : ""
              }
              <h3 style="margin: 20px; margin-left: 80px">Lights</h3>
            </div>
            
            ${repeatedHtml}
           </div>
          </ha-card>
        `;

      this.config.entities.forEach((entity) => {
        this.configureSlider(entity, hass);
      });
    }
  }

  configureSlider = (entity_id, hass) => {
    const content = this.querySelector(`[data-js="${entity_id}"]`);
    if (!content) return;
    const style = document.createElement("style");
    style.textContent = this.styles();
    content.appendChild(style);

    noUiSlider.create(content, {
      range: {
        min: [minRange],
        max: [maxRange],
      },
      start: 0,
      orientation: "horizontal",
      direction: "ltr",
      behaviour: "drag",
      pips: {
        mode: "range",
        density: 2,
      },
    });

    content.noUiSlider.on("slide", () => {
      this.setMarkers(entity_id);
    });

    content.noUiSlider.on("set", () => {
      const serviceData = {
        entity_id,
        brightness: parseInt(content.noUiSlider.get()),
      };

      hass.callService("light", "turn_on", serviceData);
    });

    const stateObj = hass.states[entity_id];

    content.noUiSlider.set(stateObj.attributes?.brightness || 0);
    this.setMarkers(entity_id);
  };

  mapRange(value, low1, high1, low2, high2) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  }

  /**
   * Set the state of the markers
   */
  setMarkers(entity_id) {
    this.content = this.querySelector(`[data-js="${entity_id}"]`);
    const pips = this.content.querySelectorAll(".noUi-marker");

    const currentValue = this.content.noUiSlider.get();
    const mappedValue = Math.round(
      this.mapRange(currentValue, minRange, maxRange, 0, pips.length - 1)
    );

    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.remove("noUi-marker--is-current");
      pips[i].classList.remove("noUi-marker--is-inRange");
    }

    for (let i = 0; i < mappedValue; i++) {
      pips[i].classList.add("noUi-marker--is-inRange");
    }

    pips[mappedValue].classList.add("noUi-marker--is-current");
  }

  // The user supplied configuration. Throw an exception and Lovelace will
  // render an error card.
  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    const defaultConfig = {
      showIcon: true,
      showTitle: true,
    };
    this.config = { ...defaultConfig, ...config };
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 12;
  }

  styles() {
    return `
    .Range {
      margin-top: 0px;
      height: 0px;
      width: 60%;
    }
    
    /**
     * Restyle the range slider
     */
    
    .noUi-target {
      width: 60%;
    }
    
    .noUi-base {
      margin-left: 5px;
    }
    
    .noUi-pips-horizontal {
      left: 0;
      right: auto;
      height: 100%;
      width: 100%;
      padding: 10px 0px;
    }

    
    .noUi-handle {
      left: -3px;
      top: 0;
      height: 40px;
      width: 40px;
      border: none;
      border-radius: 50%;
      background: transparent; 
      // background: #fe9996;
      transform: translateX(-50%) translateY(0%);
      box-shadow: none;
    
      // &::before {
      //   display: none;
      // }
    
      // &::after {
      //   position: absolute;
      //   top: 13px;
      //   right: 3px;
      //   width: 0;
      //   height: 0;
      //   border-style: solid;
      //   border-width: 5px 7px 0 7px;
      //   border-color: #fe9996 transparent transparent transparent;
      //   background: transparent;
      //   transform: translateX(-50%) translateY(100%);
      //   content: "";
      // }
    }
    
    .noUi-value {
      display: none;
    }
    
    .noUi-marker,
    .noUi-marker-large {
      width: 2px;
      height: 10px;
      margin-top: -1px;
      background: #e4dfd3;
      transform-origin: left;
      transition: 0.2s transform ease;
    }
    
    /**
     * Modifiers to highlight the markers
     */
    
    .noUi-marker--is-inRange,
    .noUi-marker--is-current {
      background: var(--primary-color);
    }
    
    .noUi-marker--is-current {
      transform: scaleY(2);
    }
    
    /**
     * Resets and presentational style
     */
    
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    
    html,
    body {
      height: 100%;
      width: 100%;
    }
    
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /**
     * Default style from noUiSlider, but removed all unused styles
     */
    
    .noUi-base {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    }
    
    .noUi-target,
    .noUi-target * {
      touch-action: none;
      user-select: none;
      box-sizing: border-box;
    }
    
    .noUi-target {
      position: relative;
      direction: ltr;
    }
    
    .noUi-origin {
      position: absolute;
      right: 0;
      top: 0;
      left: 0;
      bottom: 0;
    }
    
    .noUi-handle {
      position: relative;
      z-index: 1;
    }
    
    .noUi-state-tap .noUi-origin {
      transition: left 0.3s, top 0.3s;
    }
    
    .noUi-state-drag * {
      cursor: inherit !important;
    }
    
    .noUi-pips,
    .noUi-marker {
      position: absolute;
    }
    `;
  }
}

customElements.define("fancy-light-slider", FancySliderCard);
