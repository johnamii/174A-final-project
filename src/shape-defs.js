import {defs, tiny} from './provided/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

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

export class Skybox extends defs.Cube{
    constructor() {
        super();
        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.5, .8, 1, .9));
        }
    }
}

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
    constructor(){
        super("position", "normal", "texture_coord");

        this.boundary_transforms = []

        for (let i = 0; i < 3; i++)
                for (let j = 0; j < 2; j++) {
                    const square_transform = Mat4.rotation(i == 0 ? Math.PI / 2 : 0, 1, 0, 0)
                        .times(Mat4.rotation(Math.PI * j - (i == 1 ? Math.PI / 2 : 0), 0, 1, 0))
                        .times(Mat4.translation(0, 0, 1));
                    // Calling this function of a Square (or any Shape) copies it into the specified
                    // Shape (this one) at the specified matrix offset (square_transform):
                    Wall.insert_transformed_copy_into(this, [], square_transform);
                    this.boundary_transforms.push(square_transform);
                }
    }
}

class Entity extends defs.Cube {
    constructor(start_pos, speed_mult){
        super();

        this.speed_multiplier = speed_mult ?? 1;
        this.meters_per_frame = 10;
        this.thrust = vec3(0, 0, 0);
        this.turn = 0;
        this.dims = [1, 1, 1];
        this.transform = Mat4.identity()
            .times(Mat4.translation(start_pos[0], start_pos[1], start_pos[2]))
            //.times(Mat4.scale(this.dims[0], this.dims[1], this.dims[2]))
            ;
    }

    checkCollisions(entities){

    }

    onCollision(){

    }

    animate(){

    }

    doMovememnt(dt){
        let speed = dt * this.meters_per_frame * this.speed_multiplier;
        if (this.thrust[1] < 0) {
            this.thrust[1] += 0.05
        }

         // get y coordinate of center of starship, fall until hitting ground
         let transformY = this.transform[1][3] - this.dims[1];
         if (transformY > 0.1 ){
             let fall = -0.2;
             this.transform = this.transform.times(Mat4.translation(0, fall, 0));
         }

        this.transform.post_multiply(Mat4.rotation(.025 * this.turn, 0, 1, 0));
        this.transform.post_multiply(Mat4.translation(...this.thrust.times(-speed)));
    }
}

export class Starship extends Entity {
    constructor(start_pos, speed_mult){
        super(start_pos, speed_mult);
        
        this.dims = [0.7, 0.5, 1];
        this.transform = this.transform.times(Mat4.scale(this.dims[0], this.dims[1], this.dims[2]))
        //defs.Capped_Cylinder.insert_transformed_copy_into(this, [10, 10], wheel_transform);
    }

    doMovement(dt){
        
    }
}

export class PowellCat extends Entity {
    constructor(start_pos){
        super(start_pos);


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


    }


}

export class PowerUp extends Entity {
    constructor(start_pos) {
        super(start_pos);

    }

}
