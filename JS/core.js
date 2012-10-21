var TG = new Function();
TG.Engines = new Function();
//TODO: Set up core.js to write the includes to the page so default.htm only has to include core.js.
TG.Engines.GlobalVars = GV1();
TG.Engines.Input = InputV1();
TG.Engines.Action = MoveV1();
TG.Engines.Debug = DebugFull();
TG.Engines.Render = RenderCanvasV1();
TG.Engines.Animation = Animation;
TG.Engines.AI = AI1;
TG.Engines.Generate = Generator;
TG.Engines.Relationships = Relationships;
TG.Engines.Game = GameCore();

