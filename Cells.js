Cells = Object.create(null);
Cells.time = 0;
Cells.times = 0;
Cells.NONUMBER = 0x80; //-1
Cells.init = function (options, cells, canvasEl, GameEndCB) {
	if (!canvasEl instanceof HTMLCanvasElement) {
		throw new TypeError();
	}
	Cells.utils.checkOptions(options, cells);
	Cells.canvas = canvasEl;
	Cells.ctx = canvasEl.getContext('2d');
	Cells.left = canvasEl.getBoundingClientRect().left;
	Cells.top = canvasEl.getBoundingClientRect().top;
	Cells.height = options.height;
	Cells.width = options.width;
	Cells.cellSize = options.cellSize;
	Cells.fontSize = options.fontSize;
	Cells.stateColors = options.stateColors;
	Cells.fontColors = options.fontColors;
	Cells.gridColor  = options.gridColor;
	Cells.correctNrColor = options.correctNrColor;
	Cells.thumbnailCellSize = options.thumbnailCellSize;
	Cells.lastState = 0;
	Cells.GameStarted = false;
	Cells.GameEnded = false;
	Cells.GameEndCB = GameEndCB;
	Cells.cells = new Int8Array(Cells.width*Cells.height);
	for (var i=0;i<Cells.width;i++) {
		for (var j=0;j<Cells.height;j++) {
			Cells.cells[i*Cells.height+j] = cells[j][i];
		}
	}
	
	canvasEl.height = Cells.height * Cells.cellSize;
	canvasEl.width  = Cells.width  * Cells.cellSize;
	Cells.ctx.font = Cells.fontSize + 'px "Lucida Console", "Courier New", monospace';
	Cells.drawBoard(false);
	Cells.drawBoard(true);
	canvasEl.addEventListener("contextmenu", function(e){e.preventDefault();});
	canvasEl.addEventListener("mousedown", Cells.click);
	document.addEventListener("mouseup", Cells.mouseup);
	document.addEventListener("scroll", function (evt) {
		Cells.left = Cells.canvas.getBoundingClientRect().left;
		Cells.top = Cells.canvas.getBoundingClientRect().top;
	});
};
Cells.getState = function (x, y) {
	if (x < 0 || y < 0 || x >= Cells.width || y >= Cells.height) {
		return 2; //Cells.StateUNSET;
	}
	return (Cells.cells[x*Cells.height+y] & 0x30) >> 4;
};
Cells.getNr = function (x, y) {
	return Cells.cells[x*Cells.height+y] < 0? -1 : Cells.cells[x*Cells.height+y] & 0xF;
};
Cells.getPos = function (x ,y) {
	return {x:x*Cells.cellSize, y:y*Cells.cellSize};
};
Cells.isCorrect = function (x, y) {
	if (Cells.getNr(x, y) === -1) {
		return true;
	}
	var s1 = 0;
	for (var i=x-1;i<=x+1;i++) {
		for (var j=y-1;j<=y+1;j++) {
			if (Cells.getState(i , j) === 0) {
				return false;
			}
			if (Cells.getState(i , j) === 1) {
				s1++;
			}
		}
	}
	return s1 === Cells.getNr(x, y);
};
Cells.isSolved = function () {
	for (var i=0; i<Cells.width; i++) {
		for (var j=0; j<Cells.height; j++) {
			if (!Cells.isCorrect(i ,j)) {
				return false;
			}
		}
	}
	return true;
};
Cells.incState = function (x, y) {
	//MAGIC:
	Cells.cells[x*Cells.height+y] ^= (~Cells.cells[x*Cells.height+y])>>1&0x10;
	Cells.cells[x*Cells.height+y] ^= (~Cells.cells[x*Cells.height+y])<<1&0x20;
};
Cells.decState = function (x, y) {
	//MAGIC:
	Cells.cells[x*Cells.height+y] ^= (~Cells.cells[x*Cells.height+y])<<1&0x20;
	Cells.cells[x*Cells.height+y] ^= (~Cells.cells[x*Cells.height+y])>>1&0x10;
};
Cells.setState = function (x, y, s) {
	Cells.cells[x*Cells.height+y] &= 0xCF;
	Cells.cells[x*Cells.height+y] |= s << 4;
};
Cells.fill = function (x, y, fillNeighbours) {
	if (fillNeighbours === undefined) fillNeighbours = true;
	if (x < 0 || y < 0 || x >= Cells.width || y >= Cells.height) {
		return;
	}
	var l = Cells.getPos(x, y)["x"],
		t = Cells.getPos(x, y)["y"];
	Cells.ctx.save();
	Cells.ctx.clearRect(l, t, Cells.cellSize, Cells.cellSize);
	Cells.ctx.fillStyle = Cells.stateColors[Cells.getState(x, y)];
	Cells.ctx.fillRect(l, t, Cells.cellSize, Cells.cellSize);
	Cells.ctx.strokeRect(l, t, Cells.cellSize, Cells.cellSize);
	Cells.ctx.restore();
	Cells.drawNr(x, y);
	
	
	if (fillNeighbours) { //used to update color of number of all neighbours
		for (var i=x-1;i<=x+1;i++) {
			for (var j=y-1;j<=y+1;j++) {
				Cells.fill(i, j, false);
			}
		}
	}
	
	//Cells.drawBoard(false);
};
Cells.drawNr = function (x, y) {
	var nr = Cells.getNr(x ,y);
	if (nr === -1) {
		return;
	}
	var p = Cells.getPos(x, y);
	var xp = p.x + Cells.cellSize/2 - Cells.fontSize/3,
		yp = p.y + Cells.cellSize/2 + Cells.fontSize/3;
	Cells.ctx.save();
	if (Cells.isCorrect(x, y)) {
		Cells.ctx.fillStyle = Cells.correctNrColor;
	} else {
		Cells.ctx.fillStyle = Cells.fontColors[Cells.getState(x, y)];
	}
	Cells.ctx.fillText(nr.toString(), xp, yp);
	Cells.ctx.restore();
};
Cells.drawBoard = function (drawNr) {
	var b = Cells.height * Cells.cellSize;
	var l = Cells.width  * Cells.cellSize;
	Cells.ctx.strokeStyle = Cells.gridColor;
	for (var i=0; i <= l; i += Cells.cellSize) {
		Cells.ctx.moveTo(i, 0);
		Cells.ctx.lineTo(i, b);
	}
	for (var i=0; i <= b; i += Cells.cellSize) {
		Cells.ctx.moveTo(0, i);
		Cells.ctx.lineTo(l, i);
	}
	Cells.ctx.stroke();
	if (drawNr) {
		for (var x=0; x<Cells.width; x++) {
			for (var y=0; y<Cells.height; y++) {
				Cells.drawNr(x, y);
			}
		}
	}
};
Cells.endGame = function (cb) {
	Cells.canvas.removeEventListener("mousedown", Cells.click);
	Cells.canvas.removeEventListener("mouseup", Cells.mouseup);
	document.removeEventListener("mouseup", Cells.mouseup);
	Cells.GameEnded = true;
	//alert("Gewonnen!");
	if (cb) {
		cb(Cells.thumbnail());
	}
}
Cells.click = function (evt) {
	Cells.GameStarted = true;
	Cells.canvas.addEventListener("mousemove", Cells.mousemove);
	var x = ((evt.clientX - Cells.left)/Cells.cellSize)|0, 
		y = ((evt.clientY - Cells.top )/Cells.cellSize)|0;
	if (evt.button === 2) {
		Cells.decState(x, y);
	} else {
		Cells.incState(x, y);
	}
	Cells.lastState = Cells.getState(x, y);
	Cells.fill(x, y);
	//Cells.drawBoard(false);
};
Cells.mouseup = function (evt) {
	Cells.canvas.removeEventListener("mousemove", Cells.mousemove);
	if (Cells.isSolved()) {
		Cells.endGame(Cells.GameEndCB);
	}
};
Cells.mousemove = function (evt) {
	var x = ((evt.clientX - Cells.left)/Cells.cellSize)|0, 
		y = ((evt.clientY - Cells.top )/Cells.cellSize)|0;
	if (Cells.getState(x, y) !== Cells.lastState) {
		Cells.setState(x, y, Cells.lastState);
		Cells.fill(x, y);
		//Cells.drawBoard(false);
	}
};

Cells.thumbnail = function () {
	var canvas = document.createElement("canvas");
	canvas.id = "thumbnail";
	var ctx = canvas.getContext('2d');
	var tw = Cells.width * Cells.thumbnailCellSize,
		th = Cells.height * Cells.thumbnailCellSize;
	canvas.width = tw;
	canvas.height = th;
	var ts = Cells.thumbnailCellSize;
	for (var x=0; x<Cells.width; x++) {
		for (var y=0; y<Cells.height; y++) {
			ctx.fillStyle = Cells.stateColors[Cells.getState(x, y)];
			ctx.fillRect(x*ts, y*ts, ts, ts);
		}
	}
	return canvas;
};

Cells.importGame = function (width, height, cells) {
	if (!(Cells.utils.isInt(width) && width > 0 &&
		Cells.utils.isInt(height) && height > 0)) {
		throw new TypeError();
	}
	Cells.width = width;
	Cells.height = height;
	Cells.left = Cells.canvas.getBoundingClientRect().left;
	Cells.top = Cells.canvas.getBoundingClientRect().top;
	Cells.lastState = 0;
	Cells.cells = new Int8Array(Cells.width*Cells.height);
	for (var i=0;i<Cells.width;i++) {
		for (var j=0;j<Cells.height;j++) {
			Cells.cells[i*Cells.height+j] = cells[j][i];
		}
	}
	Cells.canvas.height = Cells.height * Cells.cellSize;
	Cells.canvas.width  = Cells.width  * Cells.cellSize;
	Cells.ctx.font = Cells.fontSize + 'px "Lucida Console", "Courier New", monospace';
	Cells.drawBoard(false);
	Cells.drawBoard(true);
	if (Cells.GameEnded) {
		Cells.canvas.addEventListener("mousedown", Cells.click);
		document.addEventListener("mouseup", Cells.mouseup);
	}
	Cells.GameStarted = false;
	Cells.GameEnded = false;
};
Cells.importProgress = function (width, height, cells, states) {
	Cells.importGame(width, height, cells);
	Cells.GameStarted = true;
	for (var x=0;x<width;x++) {
		for (var y=0;y<height;y++) {
			Cells.setState(x, y, states[y][x]);
		}
	}
	for (var y=0;y<Cells.height;y++) {
		for (var x=0;x<Cells.width;x++) {
			Cells.fill(x, y, false);
		}
	}
	//Cells.drawBoard(false);
};
Cells.exportProgress = function () {
	var exp = Object.create(null);
	exp.width  = Cells.width;
	exp.height = Cells.height;
	exp.cells  = new Array(Cells.height);
	exp.states = new Array(Cells.height);
	var nr = 0;
	for (var y=0;y<Cells.height;y++) {
		exp.cells[y]  = new Array(Cells.width);
		exp.states[y] = new Array(Cells.width);
		for (var x=0;x<Cells.width;x++) {
			nr = Cells.getNr(x, y);
			exp.cells[y][x] = nr === -1 ? Cells.NONUMBER : nr;
			exp.states[y][x] = Cells.getState(x, y);
		}
	}
	return exp;
};

Cells.utils = Object.create(null);
Cells.utils.checkOptions = function (opt, cells) {
	if (Cells.utils.isInt(opt.height) && opt.height > 0 &&
	Cells.utils.isInt(opt.width) && opt.width > 0 &&
	Cells.utils.isInt(opt.cellSize) &&
	Cells.utils.isInt(opt.fontSize) &&
	Array.isArray(opt.stateColors) && opt.stateColors.length === 3 &&
	Array.isArray(opt.fontColors)  && opt.fontColors.length  === 3 &&
	Array.isArray(cells)  && cells.length === opt.width )
		return;
	throw new TypeError();
};
Cells.utils.isInt = function (n) {
	return typeof n === "number" && n === n|0;
}