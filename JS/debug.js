function DebugFull() {
    this.WriteOutput = function (inOutput) {
        TG.Engines.Render.WriteOutput(inOutput);
    };

    return this;
};