import {defs, tiny} from './provided/common.js';
import { Shape_From_File } from './provided/obj-file.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

export function getPosVector(matrix) {
    return vec3(matrix[0][3], matrix[1][3], matrix[2][3]);
}

const meters_per_frame = 10;

export class Axis extends Shape {
    constructor(){
        super("position");

        this.arrays.position = Vector3.cast(
            [-100, 0, 0], [100, 0, 0],
            [0, -100, 0], [0, 100, 0],
            [0, 0, -100], [0, 0, 100]
        )

        this.arrays.color = [];
        for (let i = 0; i < 6; i++){
            this.arrays.color.push(color(.5, .5, .5, .3));
        }
    }
}

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        //  DONE (Requirement 5).
        this.arrays.position = Vector3.cast(
            [1, 1, 1], [-1, 1, 1],
            [1, 1, 1], [1, -1, 1],
            [1, 1, 1], [1, 1, -1],
            [-1, -1, -1], [-1, -1, 1],
            [-1, -1, -1], [-1, 1, -1],
            [-1, -1, -1], [1, -1, -1],
            [-1, -1, 1], [1, -1, 1],
            [-1, -1, 1], [-1, 1, 1],
            [1, -1, -1], [1, -1, 1],
            [1, -1, -1], [1, 1, -1],
            [-1, 1, -1], [-1, 1, 1],
            [-1, 1, -1], [1, 1, -1]
        );

        // When a set of lines is used in graphics, you should think of the list entries as broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex

        this.indices = false;
        this.arrays.color = [];
        for (let i = 0; i < 24; i++) {
            this.arrays.color.push(color(1, 1, 1, 0.33));
        }
    }
}

export class Skybox extends defs.Cube{
    constructor() {
        super();
        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.5, .8, 1, .9));
        }
    }
}

export class Text_Interface extends defs.Square {
    constructor() {
        super();

    }
}

////////////////////////////////////////////////////////
// BOUNDARY CLASS DEFINITIONS
/////////////////////////////////////////////////////////

class Boundary extends defs.Square {
    constructor(dimensions, position, tex_per_face){
        super();

        this.arrays.texture_coord = Vector.cast(
            [0, 0], [tex_per_face, 0], [0, tex_per_face], [tex_per_face, tex_per_face]
        );
        this.transform = Mat4.identity()
            .times(Mat4.scale(dimensions[0], dimensions[1], dimensions[2]))
            .times(Mat4.translation(position[0], position[1], position[2]));
    }
}

export class Ground extends Boundary {
    constructor(dimensions, position, tex_per_face){
        super(dimensions, position, tex_per_face);

        this.transform = this.transform.times(Mat4.rotation(Math.PI/2, 1, 0, 0));
    }
}

export class Wall extends Boundary {
    constructor(dimensions, position, tex_per_face){
        super(dimensions, position, tex_per_face);

        
    }
}

export class BoundaryBox extends Shape {
    constructor(dimensions, position){
        super("position", "normal", "texture_coord");

        this.transform = Mat4.identity()
            .times(Mat4.translation(position[0], position[1], position[2]))
            .times(Mat4.scale(dimensions[0], dimensions[1], dimensions[2]))
            
        
        this.boundary_transforms = []

        for (let i = 0; i < 3; i++)
                for (let j = 0; j < 2; j++) {
                    const square_transform = Mat4.rotation(i === 0 ? Math.PI / 2 : 0, 1, 0, 0)
                        .times(Mat4.rotation(Math.PI * j - (i === 1 ? Math.PI / 2 : 0), 0, 1, 0))
                        .times(Mat4.translation(0, 0, 1));
                    // Calling this function of a Square (or any Shape) copies it into the specified
                    // Shape (this one) at the specified matrix offset (square_transform):
                    Wall.insert_transformed_copy_into(this, [vec3(1, 1, 1), vec3(0, 0, 0), 4], square_transform);
                    this.boundary_transforms.push(square_transform);
                }
    }
}

//////////////////////////////
// ENTITY CLASS DEFINITIONS
///////////////////////////////

class Entity extends Cube_Outline {
    constructor(start_pos, speed_mult){
        super();

        this.box_dims = [1, 1, 1];

        this.type = "Entity";

        this.speed_multiplier = speed_mult ?? 1;
        this.speed = this.speed_multiplier * meters_per_frame;
        this.thrust = vec3(0, 0, 0);
        this.turn = 0;
        this.transform = Mat4.identity()
            .times(Mat4.translation(start_pos[0], start_pos[1]+1, start_pos[2]))
            //.times(Mat4.scale(this.dims[0], this.dims[1], this.dims[2]))
            ;

        this.model = null;
        this.model_color = hex_color("ffffff");
    }

    isBoundary(){ return false; }

    transformModel(){
        return this.transform;
    }

    checkCollisions(entities){

    }

    onCollision(){

    }

    animate(){

    }

    doMovement(dt){

        let speed = dt * this.speed;
        let rot = dt * this.turn * 4;
        
        this.transform.post_multiply(Mat4.rotation(rot, 0, 1, 0));
        this.transform.post_multiply(Mat4.translation(...this.thrust.times(speed)));
    }
}

export class Starship extends Entity {
    constructor(start_pos, speed_mult){
        super(start_pos, speed_mult);
        this.health = 3;

        this.type = "Starship";
        this.lastHit = null;
        this.model = new Shape_From_File("assets/starship.obj");
    }
    changeHealth(t){
        if (this.lastHit == null || t > (1 + this.lastHit)){
            this.health= this.health -1;
            console.log("just got hit!");
            this.lastHit = t;
        }

    }
    transformModel(){
        return this.transform.times(Mat4.translation(0.3, 0, -0.2)).times(Mat4.scale(1.1, 1.1, 1.1))
    }
    isCat(){return "starship";}
    doMovement(dt){
        super.doMovement(dt);

        if (this.thrust[1] > 0) {
            this.thrust[1] -= 0.05 * dt* (400);
        }
        else{
            this.thrust[1] = 0;
        }
         // get y coordinate of center of starship, fall until hitting ground
        let transformY = this.transform[1][3] - this.box_dims[1];

        if (transformY > 0.2 ){
             let fall = -0.2 * dt * 60;
             let x = transformY+fall;
             if (x > 0) {
                this.transform = this.transform.times(Mat4.translation(0, fall, 0));
             }
             else {
                this.transform[1][3] = 1;
             }
         }
        else{
            this.transform[1][3] = 1;
        }
    }
}

export class PowellCat extends Entity {
    constructor(start_pos, speed_mult){
        super(start_pos, speed_mult);

        this.type = "Cat";

        this.transform = this.transform
            .times(Mat4.scale(0.8, 0.8, 0.8));
        this.thrust[2] = -1;

        this.model = new Shape_From_File("assets/garfield.obj");
    }

    transformModel(){
        return this.transform.times(Mat4.rotation(Math.PI, 0, 1, 0));
    }

    doMovement(dt, target_vector) {
        super.doMovement(dt);

        // position of cat
        let pos = getPosVector(this.transform);
        // get orientation of cat
        let orientation = vec3(this.transform[0][0], this.transform[1][0], this.transform[2][0]);
        
        let dir_vector = pos.minus(target_vector);

        let dot = dir_vector.dot(orientation);
        
        // turn to left or right based on dot product
        if (dot < 0) {
            this.turn = -1;
        }
        else if (dot > 0) {
            this.turn = 1;
        }
        else {
            this.turn = 0;
        }
    }
}

export class Target extends Entity {
    constructor(start_pos){
        super(start_pos);


    }
}

export class Student extends Entity {
    constructor(start_pos, speed_mult){
        super(start_pos, speed_mult);

        this.box_dims = [1, 2.5, 1];

        this.type = "Student";

        this.thrust[2] = -1 * speed_mult;
        this.transform = this.transform
            .times(Mat4.scale(this.box_dims[0], this.box_dims[1], this.box_dims[2]))
            .times(Mat4.translation(0, 0.65, 0));

        this.max_z = -15;
    
        this.model = new Shape_From_File("assets/peg_person.obj");
        this.model_color = color(Math.random(), Math.random(), Math.random(), 1);
    }

    isBoundary(){ return true; }
    isCat(){return "student";}
    transformModel(){
        return this.transform
            .times(Mat4.scale(1.3, 0.6, 1.3))
            .times(Mat4.translation(0, 0.4, 0))
            
    }

    doMovement(dt){
        super.doMovement(dt);
        if(Math.floor(Math.random()*500)===69){
            let sign = 2*Math.floor(2*Math.random()-1)+1;
            this.transform = this.transform.times(Mat4.rotation(Math.PI/2*sign,0,1,0))
        }

    }

}

export class PowerUp extends Entity {
    constructor(start_pos) {
        super(start_pos);

        this.type = "PowerUp";

    }
    isCat(){return "powerUp";}
}

export class Obstacle extends Entity {
    constructor(start_pos){
        super(start_pos);
        this.a = Math.floor(Math.random() * 3);

        this.type = "Obstacle";

        switch (this.a) {
            case(0): // sign
                this.model = new Shape_From_File("assets/sign.obj");
                this.model_color = hex_color("#aaaa55");
                this.transform = this.transform
                    .times(Mat4.scale(2, 3, 2))
                    .times(Mat4.translation(0, 0.7, 0));
                break;
            case(1):
                this.model = new Shape_From_File("assets/barrier.obj");
                this.model_color = hex_color("#666666")
                this.transform = this.transform
                    .times(Mat4.scale(4, 2, 3))
                    .times(Mat4.translation(0, 0.6, 0));
                break;
            default:
                this.model = new Shape_From_File("assets/crate.obj");
                this.model_color = hex_color("ddbb99")
                this.transform = this.transform
                    .times(Mat4.scale(3, 3, 3))
                    .times(Mat4.translation(0, 0.7, 0));
        }
    }

    transformModel(){
        switch(this.a){
            case(0): //sign
                return this.transform.times(Mat4.scale(1, 2/3, 1)).times(Mat4.translation(0, 0.5, 0));
            case(1): //barrier
                return this.transform.times(Mat4.scale(3/4, 3/2, 1));
            default: //crate
                return this.transform.times(Mat4.scale(1.3, 1.3, 1.3)).times(Mat4.rotation(Math.PI/2, 0, 1, 0));
            
        }
    }

    doMovement() { return; }
    isCat(){return "obstacle";}
}

export class RoyceHall extends Entity {
    constructor(start_pos){
        super(start_pos);

        this.type = "Royce Hall";

        this.transform = this.transform
            .times(Mat4.scale(40, 40, 40))
            .times(Mat4.translation(0, 0.2, 0))
            .times(Mat4.rotation(Math.PI/2, 0, 1, 0));

        this.model = new Shape_From_File("assets/royce_hall.obj");
        // this.model_mat = new Material(new defs.Textured_Phong(), {
        //     texture: new Texture("assets/royce_hall.png"),
        //     color: hex_color("#ffffff"),
        //     ambient:0.5, diffusivity: 0.1, specularity: 0.1
        // });
    }

    doMovement() { return; }
}