(function (global) {
  function createStore() {
    const state = {
      selectedOp: '+',
      history: [],
      lastResult: null,
      lastZ1: null,
      lastZ2: null
    };

    function setSelectedOp(op) {
      state.selectedOp = op;
    }

    function setResult(z1, z2, result) {
      state.lastZ1 = z1;
      state.lastZ2 = z2;
      state.lastResult = result;
    }

    function addHistory(entry) {
      state.history.unshift(entry);
      if (state.history.length > 20) state.history.pop();
    }

    function clearHistory() {
      state.history = [];
    }

    return {
      state,
      setSelectedOp,
      setResult,
      addHistory,
      clearHistory
    };
  }

  global.ComplexStore = {
    createStore
  };
})(window);
