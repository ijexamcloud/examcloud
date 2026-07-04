(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }

  const exports = factory();
  root.createOverlaySettingsStore = exports.createOverlaySettingsStore;
  root.buildOverlayPayload = exports.buildOverlayPayload;
  root.buildOverlayRenderStyle = exports.buildOverlayRenderStyle;
  root.matchShortcut = exports.matchShortcut;
  root.shouldHandleShortcut = exports.shouldHandleShortcut;
  root.BUILT_IN_PRESETS = exports.BUILT_IN_PRESETS;
  root.FONT_OPTIONS = exports.FONT_OPTIONS;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const FONT_OPTIONS = [
    { value: 'IBM Plex Mono, monospace', label: 'IBM Plex Mono' },
    { value: 'Outfit, sans-serif', label: 'Outfit' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
  ];

  const BUILT_IN_PRESETS = {
    'center-top': {
      id: 'center-top',
      name: 'Center Top',
      posX: 35,
      posY: 8,
      width: 30,
      height: 'auto',
      fontSize: 18,
    },
    'top-left': {
      id: 'top-left',
      name: 'Top Left',
      posX: 5,
      posY: 8,
      width: 30,
      height: 'auto',
      fontSize: 18,
    },
    'bottom-right': {
      id: 'bottom-right',
      name: 'Bottom Right',
      posX: 60,
      posY: 72,
      width: 30,
      height: 'auto',
      fontSize: 18,
    },
  };

  const DEFAULT_PRESET = BUILT_IN_PRESETS['center-top'];
  const LAYOUT_PRESET_CUSTOM_ID = 'custom';
  const EDITABLE_TAG_NAMES = {
    INPUT: true,
    TEXTAREA: true,
    SELECT: true,
  };
  const SAFE_EDITABLE_SHORTCUT_ACTIONS = {
    'toggle-dictation': true,
  };

  function buildDefaultState() {
    return {
      text: '',
      posX: DEFAULT_PRESET.posX,
      posY: DEFAULT_PRESET.posY,
      width: DEFAULT_PRESET.width,
      height: DEFAULT_PRESET.height,
      fontSize: DEFAULT_PRESET.fontSize,
      fontFamily: 'IBM Plex Mono, monospace',
      bold: false,
      italic: false,
      underline: false,
      textColor: '#00ff00',
      textOpacity: '1',
      boxColor: '#000000',
      boxOpacity: '0.7',
      display: 'none',
      layoutPresetId: DEFAULT_PRESET.id,
      selectedPresetId: DEFAULT_PRESET.id,
    };
  }

  function findPresetById(presetId, customPresets) {
    return listBuiltInPresets()
      .concat(customPresets || [])
      .find(function (preset) {
        return preset.id === presetId;
      }) || null;
  }

  function sanitizePreset(preset, customPresets) {
    if (!preset) {
      return DEFAULT_PRESET;
    }

    if (typeof preset === 'string') {
      return findPresetById(preset, customPresets) || DEFAULT_PRESET;
    }

    return preset;
  }

  function listBuiltInPresets() {
    return Object.values(BUILT_IN_PRESETS);
  }

  function matchesPreset(state, preset) {
    return (
      state.posX === preset.posX &&
      state.posY === preset.posY &&
      state.width === preset.width &&
      state.height === preset.height &&
      state.fontSize === preset.fontSize
    );
  }

  function resolveLayoutPresetId(state, customPresets) {
    const presets = listBuiltInPresets().concat(customPresets || []);
    const matchedPreset = presets.find(function (preset) {
      return matchesPreset(state, preset);
    });

    return matchedPreset ? matchedPreset.id : LAYOUT_PRESET_CUSTOM_ID;
  }

  function patchTouchesLayout(patch) {
    return (
      Object.prototype.hasOwnProperty.call(patch, 'posX') ||
      Object.prototype.hasOwnProperty.call(patch, 'posY') ||
      Object.prototype.hasOwnProperty.call(patch, 'width') ||
      Object.prototype.hasOwnProperty.call(patch, 'height') ||
      Object.prototype.hasOwnProperty.call(patch, 'fontSize')
    );
  }

  function buildOverlayPayload(state, sessionToken, timestamp) {
    const nextState = state || buildDefaultState();

    return {
      text: nextState.text,
      x: nextState.posX + '%',
      y: nextState.posY + '%',
      w: nextState.width + '%',
      h: nextState.height === 'auto' ? 'auto' : nextState.height + 'px',
      tCol: nextState.textColor,
      tOp: nextState.textOpacity,
      bCol: nextState.boxColor,
      bOp: nextState.boxOpacity,
      fSize: nextState.fontSize + 'px',
      fontFamily: nextState.fontFamily,
      fontWeight: nextState.bold ? '700' : '400',
      fontStyle: nextState.italic ? 'italic' : 'normal',
      textDecoration: nextState.underline ? 'underline' : 'none',
      display: nextState.display,
      sessionToken: sessionToken,
      ts: timestamp,
    };
  }

  function buildOverlayRenderStyle(settings) {
    const nextSettings = settings || {};

    return {
      width: '100%',
      boxSizing: 'border-box',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      wordBreak: 'normal',
      lineHeight: '1.5',
      padding: '8px 10px',
      fontFamily: nextSettings.fontFamily || 'IBM Plex Mono, monospace',
      fontSize: String(nextSettings.fontSize || 18) + 'px',
    };
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    return !!EDITABLE_TAG_NAMES[String(target.tagName || '').toUpperCase()];
  }

  function matchShortcut(event) {
    const nextEvent = event || {};
    const code = nextEvent.code;
    const ctrlKey = !!nextEvent.ctrlKey;
    const altKey = !!nextEvent.altKey;
    const shiftKey = !!nextEvent.shiftKey;
    const metaKey = !!nextEvent.metaKey;

    if (metaKey) {
      return null;
    }

    if (ctrlKey && shiftKey && code === 'KeyH') return 'toggle-visibility';
    if (altKey && shiftKey && code === 'ArrowUp') return 'font-size-up';
    if (altKey && shiftKey && code === 'ArrowDown') return 'font-size-down';
    if (altKey && shiftKey && code === 'ArrowLeft') return 'width-down';
    if (altKey && shiftKey && code === 'ArrowRight') return 'width-up';
    if (ctrlKey && code === 'Space') return 'toggle-dictation';
    if (ctrlKey && code === 'Backspace') return 'clear-text';
    if (ctrlKey && code === 'KeyZ') return 'undo';
    if (altKey && code === 'ArrowLeft') return 'move-left';
    if (altKey && code === 'ArrowRight') return 'move-right';
    if (altKey && code === 'ArrowUp') return 'move-up';
    if (altKey && code === 'ArrowDown') return 'move-down';

    return null;
  }

  function shouldHandleShortcut(event) {
    const nextEvent = event || {};
    const action = matchShortcut(nextEvent);

    if (!action) {
      return false;
    }

    if (!isEditableTarget(nextEvent.target)) {
      return true;
    }

    return !!SAFE_EDITABLE_SHORTCUT_ACTIONS[action];
  }

  function createOverlaySettingsStore(seed) {
    const initialSeed = seed || {};
    let customPresets = Array.isArray(initialSeed.customPresets)
      ? initialSeed.customPresets.map(function (preset) {
          return { ...preset };
        })
      : [];
    let state = {
      ...buildDefaultState(),
      ...initialSeed,
    };
    delete state.customPresets;
    state.layoutPresetId = resolveLayoutPresetId(state, customPresets);
    state.selectedPresetId = initialSeed.selectedPresetId || state.layoutPresetId;

    return {
      getState() {
        return { ...state };
      },

      update(patch) {
        const nextPatch = patch || {};
        state = {
          ...state,
          ...nextPatch,
        };
        if (patchTouchesLayout(nextPatch)) {
          state.layoutPresetId = resolveLayoutPresetId(state, customPresets);
        }
        return { ...state };
      },

      selectPreset(presetId) {
        state = {
          ...state,
          selectedPresetId: presetId,
        };
        return { ...state };
      },

      applyPreset(preset) {
        const nextPreset = sanitizePreset(preset, customPresets);
        state = {
          ...state,
          posX: nextPreset.posX,
          posY: nextPreset.posY,
          width: nextPreset.width,
          height: nextPreset.height,
          fontSize: nextPreset.fontSize,
          layoutPresetId: nextPreset.id,
          selectedPresetId: nextPreset.id,
        };
        return { ...state };
      },

      applySelectedPreset() {
        return this.applyPreset(state.selectedPresetId);
      },

      createCustomPreset(name) {
        return {
          id: 'custom-' + Date.now(),
          name: String(name || '').trim() || 'Custom Preset',
          posX: state.posX,
          posY: state.posY,
          width: state.width,
          height: state.height,
          fontSize: state.fontSize,
        };
      },

      saveCustomPreset(preset) {
        const nextPreset = sanitizePreset(preset, customPresets);
        customPresets = customPresets
          .filter(function (item) {
            return item.id !== nextPreset.id;
          })
          .concat({ ...nextPreset });
        state.layoutPresetId = resolveLayoutPresetId(state, customPresets);
        state.selectedPresetId = nextPreset.id;
        return customPresets.map(function (item) {
          return { ...item };
        });
      },

      deleteCustomPreset(presetId) {
        customPresets = customPresets.filter(function (item) {
          return item.id !== presetId;
        });
        state.layoutPresetId = resolveLayoutPresetId(state, customPresets);
        if (state.selectedPresetId === presetId) {
          state.selectedPresetId = state.layoutPresetId;
        }
        return customPresets.map(function (item) {
          return { ...item };
        });
      },

      listPresets() {
        return listBuiltInPresets()
          .concat(customPresets)
          .map(function (preset) {
            return { ...preset };
          });
      },

      toPersistedSnapshot() {
        return {
          text: state.text,
          posX: state.posX,
          posY: state.posY,
          width: state.width,
          height: state.height,
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
          bold: state.bold,
          italic: state.italic,
          underline: state.underline,
          textColor: state.textColor,
          textOpacity: state.textOpacity,
          boxColor: state.boxColor,
          boxOpacity: state.boxOpacity,
          display: state.display,
          layoutPresetId: state.layoutPresetId,
          selectedPresetId: state.selectedPresetId,
        };
      },
    };
  }

  return {
    createOverlaySettingsStore,
    buildOverlayPayload,
    buildOverlayRenderStyle,
    matchShortcut,
    shouldHandleShortcut,
    BUILT_IN_PRESETS,
    FONT_OPTIONS,
  };
});
