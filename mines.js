const readline = require("readline");

const States = {PLAYING: 0, WIN: 1, DEAD: 2};
const COLOURS = {
	"1": "\x1b[34m",
	"2": "\x1b[32m",
	"3": "\x1b[31m",
	"4": "\x1b[36m",
	"5": "\x1b[33m",
	"6": "\x1b[35m",
	"7": "\x1b[39m",
	"8": "\x1b[39m",
};

let width = 10;
let height = 10;
let mines = 10;
let cursor = {x: 0, y: 0};
let field = [];
let state;
let left;
let mined;

async function init() {
	print("\x1b[2J\x1b[H");

	const read = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	width = +await new Promise(resolve => read.question("width? ", answer => resolve(answer)));
	height = +await new Promise(resolve => read.question("height? ", answer => resolve(answer)));
	mines = +await new Promise(resolve => read.question("mines? ", answer => resolve(answer)));

	width = Math.min(Math.max(width, 10), 30);
	height = Math.min(Math.max(height, 10), 30);
	mines = Math.min(Math.max(mines, 1), width * height - 1);

	read.close();

	for (let y = 0; y < height; y++) {
		field[y] = [];
		for (let x = 0; x < width; x++) {
			field[y][x] = {};
		}
	}

	readline.createInterface({
		input: process.stdin,
	});

	readline.emitKeypressEvents(process.stdin);
	process.stdin.setRawMode(true);
	process.stdin.on("keypress", (chunk, key) => {
		if (key.ctrl && key.name === "c") {
			print("", true);
			process.exit();
		} else {
			onKey(key);
		}
	});

	reset();
}

function reset() {
	state = States.PLAYING;
	mined = false;

	cursor.x = 0;
	cursor.y = 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			field[y][x].flip = false;
			field[y][x].hidden = true;
			field[y][x].flag = false;
			field[y][x].value = 0;
		}
	}

	draw();
}

function setMines(fx, fy) {
	left = Math.max(width * height - mines, 1);
	let mine = 0;
	while (mine < Math.min(mines, width * height - 1)) {
		let x = Math.floor(Math.random() * width);
		let y = Math.floor(Math.random() * height);
		if ((x !== fx || y !== fy) && field[y][x].value !== "*") {
			field[y][x].value = "*";
			addNumber(x - 1, y - 1);
			addNumber(x - 1, y    );
			addNumber(x - 1, y + 1);
			addNumber(x    , y - 1);
			addNumber(x    , y + 1);
			addNumber(x + 1, y - 1);
			addNumber(x + 1, y    );
			addNumber(x + 1, y + 1);
			mine++;
		}
	}

	mined = true;
}

function addNumber(x, y) {
	if (x < 0 || x >= width || y < 0 || y >= height) return;
	if (field[y][x].value === "*") return;
	field[y][x].value += 1;
}

let keying = false;
async function onKey(key) {
	if (state === States.DEAD || state === States.WIN) {
		if (key.name === "z") {
			reset();
		}
		return;
	}

	if (keying) return;
	keying = true;
	let {x, y} = cursor;
	switch (key.name) {
		case "k":
		case "up":
			y--;
			break;
		case "j":
		case "down":
			y++;
			break;
		case "h":
		case "left":
			x--;
			break;
		case "l":
		case "right":
			x++;
			break;
		case "z":
			flip(x, y);
			for (let i = 0; i < height; i++) {
				for (let j = 0; j < width; j++) {

					let one = field[i][j];
					if (one.flip && one.hidden) {
						one.hidden = false;
						if (checkVisible(j, i)) {
							draw();
							await sleep(0);
						}
					}
				}
			}
			break;
		case "x":
			flag(x, y);
	}

	x = Math.max(Math.min(x, width - 1), 0);
	y = Math.max(Math.min(y, height - 1), 0);

	cursor.x = x;
	cursor.y = y;

	keying = false;
	draw();
}

function flag(x, y) {
	if (x < 0 || x >= width || y < 0 || y >= height) return;
	const one = field[y][x];
	if (!one.hidden) return;
	one.flag = !one.flag;
}

function flip(x, y) {
	if (x < 0 || x >= width || y < 0 || y >= height) return;

	if (!mined) setMines(x, y);

	const one = field[y][x];
	if (one.flag || !one.hidden) return;
	if (one.flip) return;
	one.flip = true;

	if (one.value === "*") {
		one.hidden = false;
		state = States.DEAD;
		return;
	}

	left--;
	if (left <= 0) {
		state = States.WIN;
		return;
	}

	if (one.value === 0) {
		flip(x - 1, y - 1);
		flip(x    , y - 1);
		flip(x + 1, y - 1);
		flip(x - 1, y    );
		flip(x + 1, y    );
		flip(x - 1, y + 1);
		flip(x    , y + 1);
		flip(x + 1, y + 1);
	}
}

async function sleep(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}

function checkVisible(x, y) {
	let columns = process.stdout.columns - 2 || 24;
	let rows = process.stdout.rows - 2 || 13;

	let offX = cursor.x - Math.floor(columns * 0.25) + 1;
	offX = Math.max(Math.min(offX, Math.ceil(width - columns * 0.5) + 1), 0);
	let offY = cursor.y - Math.floor(rows * 0.5) + 1;
	offY = Math.max(Math.min(offY, height - rows + 1), 0);

	if (y < offY || y - offY >= rows) return false;
	if (x < offX || (x - offX) * 2 + 2 > columns) return false;
	return true;
}

function draw() {
	let columns = process.stdout.columns - 2 || 24;
	let rows = process.stdout.rows - 2 || 13;

	print(`\r\x1b[${height + 2}A`);
	let half = Math.min(width, columns * 0.5);
	for (let i = 0; i < width * 2; i++) {
		if (i >= columns) continue;
		if (i === half - 1 || i === half - 0.5) {
			print(" ");
			switch (state) {
				case States.DEAD:
					print("X(");
					break;
				case States.PLAYING:
					if (keying) print(":O");
					else print (":)");
					break;
				case States.WIN:
					print("B)");
					break;
			}
		} else {
			print(" ");
		}
	}
	print("", true);

	let offX = cursor.x - Math.floor(columns * 0.25) + 1;
	offX = Math.max(Math.min(offX, Math.ceil(width - columns * 0.5) + 1), 0);
	let offY = cursor.y - Math.floor(rows * 0.5) + 1;
	offY = Math.max(Math.min(offY, height - rows + 1), 0);

	if (offY === 0) {
		for (let i = 0; i < width + 2; i++) {
			if (i * 2 > columns) continue;
			print("██");
		}
		print("", true);
	}

	for (let y = 0 + (offY > 0? offY - 1: 0); y < height; y++) {
		if (y - offY >= rows) continue;
		for (let x = -1 + offX; x <= width; x++) {
			if ((x - offX) * 2 + 2 > columns) continue;

			if (x === -1) {
				print("██");
				continue;
			} else if (x === width) {
				print("██");
				continue;
			}

			let {hidden, flag, value} = field[y][x];
			if (x === cursor.x && y === cursor.y) {
				if (hidden) {
					if (flag) {
						print("\x1b[101m P\x1b[0m");
					} else {
						print("\x1b[105m░░\x1b[0m");
					}
				} else if (value === 0) {
					print(`\x1b[105m  \x1b[0m`);
				} else {
					print(`\x1b[105m${value.toString().padStart(2, " ")}\x1b[0m`);
				}
			} else {
				if (hidden) {
					if (flag) {
						print("\x1b[91m P\x1b[0m");
					} else {
						print("░░");
					}
				} else if (value === 0) {
					print("  ");
				} else {
					print(COLOURS[+value]);
					print(value.toString().padStart(2, " "));
					print("\x1b[0m");
				}
			}
		}
		if (y - offY >= rows - 1) continue;
		print("", true);
	}
	if (height - offY <= rows - 1) {
		for (let i = 0; i < width + 2; i++) {
			if (i * 2 > columns) continue;
			print("██");
		}
	}
}

function print(string, newLine) {
	process.stdout.write(string);
	if (newLine) process.stdout.write("\n");
}

init();
