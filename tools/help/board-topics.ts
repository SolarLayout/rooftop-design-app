// The topics of the help in V2, as board 11 lists them ("The topics", approved D111): each topic's key, its title as the
// screen names its section, and its summary, the sheet's first line. The gate holds every topic to them, word for word.
// From `docs/design/mockups/build_v2_help.py`, TOPICS.

export const BOARD_TOPICS: Readonly<Record<string, { title: string; summary: string }>> = {
  // Find
  "find.tool.find-the-roof": { title: "Find the roof", summary: "Search an address, paste coordinates or a maps link, then outline the roof on the map." },
  "find.tool.corners": { title: "Outline by its corners", summary: "Click each corner of the roof, then the first corner again to close the outline." },
  "find.tool.rectangle": { title: "Draw a rectangle", summary: "Drag from one corner of the roof to the opposite one, then turn it to fit." },
  "find.tool.detect": { title: "Detect the building", summary: "Click inside the building to get its outline, then drag the corners onto the roof." },
  "find.tool.move-the-roof": { title: "Move or turn the roof", summary: "Drag the roof to move it, or its round handle to turn it. Its obstacles move with it." },
  "find.tool.box": { title: "Add a box", summary: "Drag over a stair room or a plant room, then type its height above the roof." },
  "find.tool.tank": { title: "Add a tank", summary: "Drag from the middle of a round tank to its edge, then type its height." },
  // Not on board 11: the Tree tool had no how-to until issue 238, item 3.
  "find.tool.tree": { title: "Add a tree", summary: "Drag from the middle of a tree to the edge of its crown, then type its height." },
  "find.tool.wall": { title: "Add a wall", summary: "Click each point of the wall, end on the last one, then type its height." },
  "find.tool.building": { title: "Add a building beside the roof", summary: "Outline a building next to the roof and type its height, so its shadow on the roof counts." },
  "find.tool.move-an-obstacle": { title: "Move, turn or remove an obstacle", summary: "Select an obstacle on the map, then drag it, turn it by its handle, or remove it." },
  "find.section.edges": { title: "Edges", summary: "Type a length you measured to correct one edge of the outline." },
  "find.section.place": { title: "Place", summary: "Set where a roof entered by hand stands: search for it, or type its latitude and longitude." },
  "find.section.shape": { title: "Shape", summary: "Type the roof's length and width, or its corners in metres." },
  "app.section.roof-type": { title: "Roof type", summary: "Choose how the modules sit: rows facing south, rows facing east and west, or flush on a slope." },
  "app.section.obstacles": { title: "Obstacles", summary: "Add what stands on the roof with its height, so modules keep clear of it and its shade counts." },
  // Roof
  "studio.section.outline": { title: "Outline", summary: "Where the roof is, its size and its corners. Edit the corners in Plan." },
  "studio.section.edges-and-access": { title: "Edges and access", summary: "Set the parapet height and the strips kept free of modules at the edges and round obstacles." },
  // Array
  "studio.section.module": { title: "Module", summary: "Choose the module. Its size sets the layout; its ratings set the strings and the energy." },
  "studio.section.mounting": { title: "Mounting", summary: "Set the modules' tilt, their orientation, and how many stand in each row's height." },
  "studio.section.spacing": { title: "Spacing", summary: "How far apart the rows stand so they do not shade each other in the shade-free hours." },
  "studio.section.shade-free-hours": { title: "Shade-free hours", summary: "Set the hours of the design day in which rows and obstacles must not shade the modules." },
  // Board 11 says "21 December has the longest shadows": untrue south of the equator (#238, 25).
  "studio.section.design-day": { title: "Design day", summary: "The day the rows are spaced for. The winter solstice has the longest shadows." },
  // The Sun view
  "studio.section.shade-over-the-year": { title: "Shade over the year", summary: "How much energy shade costs in a year, by its cause: rows and obstacles, strings, the horizon." },
  "studio.section.on-the-roof": { title: "On the roof", summary: "Choose what the Sun view draws: the sun's arc, its shade-free hours, shadow outlines, the shade map." },
  "studio.section.shade-map": { title: "Shade map", summary: "Each module coloured by its loss to shade over the year, to see where shade costs most." },
  "studio.section.the-sun-at-the-time": { title: "The sun at the time", summary: "Where the sun stands at the time on the timeline: how high, and from which direction." },
  // Strings
  "studio.section.options": { title: "Options", summary: "Choose how the modules are wired to the inverter. The best option comes first." },
  "studio.section.inverter": { title: "Inverter", summary: "Choose the inverter the strings are sized for, from the library or your own file (OND)." },
  "studio.section.system-voltage": { title: "System voltage", summary: "The highest DC voltage of the system. It caps the modules in a string; it starts from your country." },
  // Board 11 lists it as "Modules a string"; the screen (#218) and the voice's table (plan/v2/voice.md §6) say "Modules per string".
  "studio.section.modules-per-string": { title: "Modules per string", summary: "How many modules one string can hold at your system voltage, and what limits it." },
  "studio.section.mppt-loading": { title: "MPPT loading", summary: "The strings on each input of the inverter, and their current against its limit." },
};
