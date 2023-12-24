import { GameObject } from './GameObject.js';
import { Snake } from './Snake.js';
import { Cell } from './Cell.js';

export class GameMap extends GameObject {
    constructor(ctx, parent){
        super();
        this.ctx = ctx;
        this.parent = parent;
        this.L = 0;
        this.rows = 15;
        this.cols = 16; // make sure the sum of rows and cols of beginPoint of two snakes are odd and even respectively
        this.inner_walls_count = 20;
        this.walls = [];
        this.status = [];
        this.snakes = [
            new Snake({id: 0, r: this.rows - 2, c: 1, color: "#EF8683"}, this),
            new Snake({id: 1, r: 1, c: this.cols - 2, color: "#5F5FF6"}, this)
        ];
    }
    // checking connectivity from (sx, sy) to (tx, ty)
    floodFill(st, sx, sy, tx, ty){
        if(sx === tx && sy === ty) return true;
        st[sx][sy] = true;
        let dx = [0, 0, 1, -1], dy = [1, -1, 0, 0];
        for(let i = 0; i < 4; i++){
            let nx = sx + dx[i], ny = sy + dy[i];
            if(!st[nx][ny] && this.floodFill(st, nx, ny, tx, ty)) return true;
        }
        return false;
    }
    createWalls(){
        for(let i = 0; i < this.rows; i++){
            this.status[i] = [];
            for(let j = 0; j < this.cols; j++){
                this.status[i][j] = false;
            }
        }
        for(let i = 0; i < this.cols; i++){
            this.status[0][i] = this.status[this.rows - 1][i] = true;
            this.walls.push(new Cell(0, i));
            this.walls.push(new Cell(this.rows - 1, i));
        }
        for(let i = 0; i < this.rows; i++){
            this.status[i][0] = this.status[i][this.cols - 1] = true;
            this.walls.push(new Cell(i, 0));
            this.walls.push(new Cell(i, this.cols - 1));
        }
        // create symmetric random inner walls 
        for(let i = 0; i < this.inner_walls_count / 2; i++){
            for(let j = 0; j < 1000; j++){
                const r = parseInt(Math.random() * (this.rows - 2) + 1);
                const c = parseInt(Math.random() * (this.cols - 2) + 1);
                if(this.status[r][c] || this.status[this.rows - 1 - r][this.cols - 1 - c]) continue;
                if (r === this.rows - 2 && c === 1 || r === 1 && c === this.cols - 2) continue;
                this.status[r][c] = true;
                this.status[this.rows - 1 - r][this.cols - 1 - c] = true;
                this.walls.push(new Cell(r, c));
                this.walls.push(new Cell(this.rows - 1 - r, this.cols - 1 - c));
                break;
            }
        }
        const cp_status = JSON.parse(JSON.stringify(this.status));
        if(!this.floodFill(cp_status, this.rows - 2, 1, 1, this.cols - 2)) return false;
        return true;
    }

    checkReady(){ // check if two snakes are ready to next round
        for(let snake of this.snakes){
            if(snake.status !== 0) return false;
            if(snake.direction === -1) return false;
        }
        return true;
    }
    addEventListener(){
        this.ctx.canvas.focus(); // focus on canvas to receive keyboard event
        const [snake1, snake2] = this.snakes;
        this.ctx.canvas.addEventListener("keydown", (e) => {
            if(e.key === "w"){
                snake1.direction = 0;
            }else if(e.key === "s"){
                snake1.direction = 1;
            }else if(e.key === "a"){
                snake1.direction = 2;
            }else if(e.key === "d"){
                snake1.direction = 3;
            }else if(e.key === "ArrowUp"){
                snake2.direction = 0;
            }else if(e.key === "ArrowDown"){
                snake2.direction = 1;
            }else if(e.key === "ArrowLeft"){
                snake2.direction = 2;
            }else if(e.key === "ArrowRight"){
                snake2.direction = 3;
            }
        });
    }
    start(){
        for(let i = 0; i < 1000; i++){
            if(this.createWalls()) break;
        }
        this.addEventListener();
    }
    // check if the nextCell is valid (not wall or snake body) 
    checkValidCell(cell){  // called in the nextStep() of Snake Object 
        for(const wall of this.walls){ // "of" for values and "in" for index in array 
            if(wall.r === cell.r && wall.c === cell.c) return false;
        }
        for(const snake of this.snakes){
            let k = snake.cells.length;
            if (!snake.checkLengthIncrease()) k -= 1;
            for(let i = 0; i < k; i++){
                if(snake.cells[i].r === cell.r && snake.cells[i].c === cell.c) return false;
            }
        }
        return true;
    }
    update() {
        this.L = parseInt(Math.min(this.parent.clientWidth / this.cols, this.parent.clientHeight / this.rows));
        this.ctx.canvas.width = this.L * this.cols;
        this.ctx.canvas.height = this.L * this.rows;
        const color_even = "#AAD751", color_odd = "#A2D149";
        for(let i = 0; i < this.rows; i++){
            for(let j = 0; j < this.cols; j++){
                if(this.status[i][j]){
                    this.ctx.fillStyle = "#B37226";
                }else{
                    this.ctx.fillStyle = (i + j) % 2 ? color_even : color_odd;
                }
                this.ctx.fillRect(j * this.L, i * this.L, this.L, this.L);
            }
        }

        if(this.checkReady()){
            for(let snake of this.snakes){
                snake.nextStep();
            }
        }
    }
}