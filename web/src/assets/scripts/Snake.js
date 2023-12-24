import { GameObject } from "./GameObject";
import { Cell } from "./Cell";

export class Snake extends GameObject {
    constructor(info, gamemap){
        super();
        this.id = info.id;
        this.color = info.color;
        this.gamemap = gamemap;
        this.cells = [new Cell(info.r, info.c)]; // cells[0] is the head of snake
        this.nextCell = null; // the next cell of head of snake
        this.speed = 4; // move 4 cells per second
        this.direction = -1; // -1: not received, 0: up, 1: down, 2: left, 3: right
        this.status = 0; // 0: still, 1: moving, 2: dead

        this.dr = [-1, 1, 0, 0]; // direction of row
        this.dc = [0, 0, -1, 1]; // direction of column
        this.step = 0; // step of moving
        this.eps = 1e-2; // error of floating point of moving distance

        this.eyeDirection = 0; // 0: up, 1: down, 2: left, 3: right and the eyeDirection of snake 0 is up
        if(this.id === 1) this.eyeDirection = 1; // the eyeDirection of snake 1 is down
        this.eye_dx = [[-1, 1], [1, -1], [-1, -1], [1, 1]];
        this.eye_dy = [[-1, -1], [1, 1], [-1, 1], [1, -1]];
    }
    setDirection(direction){ // the interface for GameMap to set direction of one snake
        this.direction = direction;
    }
    nextStep(){ // called in the update() of GameMap
        const d = this.direction;
        this.eyeDirection = d; // update the eyeDirection of snake and do not need to reset it to -1 like this.direction
        this.nextCell = new Cell(this.cells[0].r + this.dr[d], this.cells[0].c + this.dc[d]);
        if(!this.gamemap.checkValidCell(this.nextCell)){
            this.status = 2; // dead
            return;
        }
        this.direction = -1; // make sure for new step both snakes have received new direction in GameMap.checkReady()
        this.status = 1; // moving
        this.step += 1;

        const k = this.cells.length;
        for(let i = k; i > 0; i--){ // move all cells backwar, e.x. [1, 2, 3] => [1, 1, 2, 3]
            this.cells[i] = JSON.parse(JSON.stringify(this.cells[i - 1])); // use JSON to deep copy
        }
    }
    checkLengthIncrease(){ // check if the length of snake should increase
        return this.step < 10 || this.step % 3 === 1;
    }
    move(){
        const dx = this.nextCell.x - this.cells[0].x;
        const dy = this.nextCell.y - this.cells[0].y;
        const d = Math.sqrt(dx * dx + dy * dy); // the distance between the head of snake and the nextCell, as well as the tail and tailTarget
        if(d < this.eps){ // if the distance is less than eps, then the snake has arrived at the next cell
            this.cells[0] = this.nextCell; // add a new cell to the head of snake
            this.nextCell = null;
            this.status = 0; // still
            if(!this.checkLengthIncrease()){ // if the length of snake should NOT increase
                this.cells.pop(); // remove the last cell
            }
        }else{
            const frameDistance = this.speed * this.timeDelta / 1000; // moving distance between two frames
            // slowly move the head of snake to the nextCell
            this.cells[0].x += dx / d * frameDistance;
            this.cells[0].y += dy / d * frameDistance;
            if(!this.checkLengthIncrease()){ // if the length of snake should NOT increase, slowly move the tail to the tailTarget
                const k = this.cells.length;
                const tail = this.cells[k - 1], tailTarget = this.cells[k - 2];
                const tail_dx = tailTarget.x - tail.x, tail_dy = tailTarget.y - tail.y;
                tail.x += tail_dx / d * frameDistance;
                tail.y += tail_dy / d * frameDistance;
            }
        }
    }
    update(){ // called every frame
        if (this.status === 1){
            this.move();
        } 
        this.render();
    }
    render(){
        const ctx = this.gamemap.ctx;
        const L = this.gamemap.L;
        ctx.fillStyle = this.color;
        if (this.status === 2){ // dead
            ctx.fillStyle = "white";
        }
        for(const cell of this.cells){
            ctx.beginPath();
            ctx.arc(cell.x * L, cell.y * L, L / 2 * 0.9, 0, 2 * Math.PI); // change radius to 0.9 * L / 2 to make the gap between cells
            ctx.fill();
        }
        // fill the gap between the corner of two cells
        for(let i = 1; i < this.cells.length; i++){
            const cell1 = this.cells[i - 1], cell2 = this.cells[i];
            const dx = Math.abs(cell2.x - cell1.x);
            const dy = Math.abs(cell2.y - cell1.y);
            if(dx < this.eps && dy < this.eps) continue; // if two cells are too close, then no need to fill
            else if (dx < this.eps){
                ctx.fillRect((cell1.x - 0.5 + 0.05) * L, Math.min(cell1.y, cell2.y) * L, L * 0.9, dy * L); // the width of rectangle is 0.9 * L to make the gap between cells
            }else {
                ctx.fillRect(Math.min(cell1.x, cell2.x) * L, (cell1.y - 0.5 + 0.05) * L, dx * L, L * 0.9); // remember to compensate 0.05 to exchange to begining point of Rectangle
            }
        }
        // draw th eye of snake
        ctx.fillStyle = "black";
        for(let i = 0; i < 2; i++){
            ctx.beginPath();
            ctx.arc((this.cells[0].x + this.eye_dx[this.eyeDirection][i] * 0.2) * L, (this.cells[0].y + this.eye_dy[this.eyeDirection][i] * 0.2) * L, L * 0.05, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}