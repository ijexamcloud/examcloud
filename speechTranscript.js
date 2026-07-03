(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.createSpeechTranscriptController = factory().createSpeechTranscriptController;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function cleanSegment(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function joinSegments(left, right) {
    const a = cleanSegment(left);
    const b = cleanSegment(right);
    if (!a) return b;
    if (!b) return a;
    return a + ' ' + b;
  }

  function createSpeechTranscriptController(seedText) {
    let baseText = cleanSegment(seedText);
    let segments = [];

    function rebuild() {
      let finalText = baseText;
      let interimParts = [];

      for (const segment of segments) {
        const transcript = cleanSegment(segment.transcript);
        if (!transcript) continue;
        if (segment.isFinal) {
          finalText = joinSegments(finalText, transcript);
        } else {
          interimParts.push(transcript);
        }
      }

      return {
        finalText,
        interimText: cleanSegment(interimParts.join(' ')),
      };
    }

    return {
      applyResults(nextSegments, startIndex) {
        const safeStart = Number.isInteger(startIndex) && startIndex >= 0 ? startIndex : 0;
        const normalized = (nextSegments || []).map((segment) => ({
          isFinal: Boolean(segment && segment.isFinal),
          transcript: cleanSegment(segment && segment.transcript),
        }));
        segments.splice(safeStart, segments.length - safeStart, ...normalized);
        return this.getDisplayText();
      },

      rebaseFromText(nextText) {
        baseText = cleanSegment(nextText);
        segments = [];
        return baseText;
      },

      commitInterim() {
        baseText = this.getDisplayText();
        segments = [];
        return baseText;
      },

      clear() {
        baseText = '';
        segments = [];
      },

      getFinalText() {
        return rebuild().finalText;
      },

      getInterimText() {
        return rebuild().interimText;
      },

      getDisplayText() {
        const state = rebuild();
        return joinSegments(state.finalText, state.interimText);
      },
    };
  }

  return {
    createSpeechTranscriptController,
  };
});
