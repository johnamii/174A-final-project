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

////////////////////////////////////////////////////////
// BOUNDARY CLASS DEFINITIONS
/////////////////////////////////////////////////////////

class Boundary extends defs.Square {
    constructor(){
        super();

        
    }
}

export class Ground extends Boundary {
    constructor(){
        super();

        this.arrays.texture_coord = Vector.cast(
            [0, 0], [4, 0], [0, 4], [4, 4]
        );
    }
}

export class Wall extends Boundary {
    constructor(){
        super();

        this.arrays.texture_coord = Vector.cast(
            [0, 0], [4, 0], [0, 4], [4, 4]
        );
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
                    Wall.insert_transformed_copy_into(this, [], square_transform);
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

        this.speed_multiplier = speed_mult ?? 1;
        this.speed = this.speed_multiplier * meters_per_frame;
        this.thrust = vec3(0, 0, 0);
        this.turn = 0;
        this.dims = [1, 1, 1];
        this.transform = Mat4.identity()
            .times(Mat4.translation(start_pos[0], start_pos[1], start_pos[2]))
            //.times(Mat4.scale(this.dims[0], this.dims[1], this.dims[2]))
            ;

        this.model = null;
        this.material = new Material(new defs.Basic_Shader());
    }

    isCat(){ return false; }
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
        if (this.thrust[1] > 0) {
            this.thrust[1] -= 0.05 * dt* (400);
        }
        else{
            this.thrust[1] = 0;
        }
         // get y coordinate of center of starship, fall until hitting ground
         let transformY = this.transform[1][3] - this.dims[1];

        if (transformY > 0.2 ){
             let fall = -0.2 * dt * 60;
             let x = transformY+fall;
             if(x>0) {
                 this.transform = this.transform.times(Mat4.translation(0, fall, 0));
             }
             else{
                 this.transform[1][3] = 1;
             }
         }
        else{
            this.transform[1][3] = 1;
        }
        this.transform.post_multiply(Mat4.rotation(dt*4 * this.turn, 0, 1, 0));
        this.transform.post_multiply(Mat4.translation(...this.thrust.times(speed)));
    }
}

export class Starship extends Entity {
    constructor(start_pos, speed_mult){
        super(start_pos, speed_mult);
        
        this.model = new Shape_From_File("assets/starship.obj");
        this.model_mat = new Material(new defs.Phong_Shader(), {color: hex_color("#ffffff")});
    }

    transformModel(){
        return this.transform.times(Mat4.translation(0.3, 0, -0.2)).times(Mat4.scale(1.1, 1.1, 1.1))
    }

    doMovement(dt){
        super.doMovement(dt);
    }
}

export class PowellCat extends Entity {
    constructor(start_pos, speed_mult){
        super(start_pos, speed_mult);

        this.transform = this.transform
            .times(Mat4.scale(0.8, 0.8, 0.8));
        this.thrust[2] = -1;

        this.material = this.material.override({color: hex_color('#222222')});

        this.model = new Shape_From_File("assets/garfield.obj");
        
        this.model_mat = new Material(new defs.Textured_Phong(), {
            texture: new Texture("assets/garfield.png"),
            color: hex_color("#000000"),
            ambient:1, diffusivity: 0.1, specularity: 0.1
        })
    }

    isCat(){ return true; }

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
        this.thrust[2] = 1 * speed_mult;
        this.transform = this.transform
            .times(Mat4.scale(0.5, 2, 0.5))
            .times(Mat4.translation(0, 3, 0));

        this.max_z = -15;
        //this.model = new Shape_From_File("assets/garfield.obj");
        this.material = this.material.override({color: color(Math.random(), Math.random(), Math.random(), 1)})
    }
    isBoundary(){ return true; }

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

    }

}
