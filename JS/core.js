var TG = new Function();
TG.Engines = new Function();

TG.Engines.GlobalVars = GV1();
TG.Engines.Input = InputV1();
TG.Engines.Action = MoveV1();
TG.Engines.Debug = DebugFull();
TG.Engines.Render = RenderCanvasV1();
TG.Engines.Generate = Generator;
TG.Engines.Game = GameCore();

