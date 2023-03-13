import {defs, tiny} from './provided/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

export class Skybox extends defs.Cube{
    constructor() {
        super();
        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.5, .8, 1, .9));
        }
    }
}

export class Ground extends defs.Square {
    constructor(){
        super();

        this.arrays.texture_coord = Vector.cast(
            [0, 0], [4, 0], [0, 4], [4, 4]
         )
    }
}

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
export class Building extends defs.Cube{
    constructor(){
        super();

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.69, .42, .165, 1));
        }

        this.position = this.arrays.position;
    }
}

export class ModifiedCube extends Shape {
    constructor(){
        super("position", "normal", "texture_coord");

        for (let i = 0; i < 3; i++)
                for (let j = 0; j < 2; j++) {
                    const square_transform = Mat4.rotation(i == 0 ? Math.PI / 2 : 0, 1, 0, 0)
                        .times(Mat4.rotation(Math.PI * j - (i == 1 ? Math.PI / 2 : 0), 0, 1, 0))
                        .times(Mat4.translation(0, 0, 1));
                    // Calling this function of a Square (or any Shape) copies it into the specified
                    // Shape (this one) at the specified matrix offset (square_transform):
                    Ground.insert_transformed_copy_into(this, [], square_transform);
                }
    }
}

export class Starship extends defs.Cube {
    constructor(){
        super();

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.9, .9, .9, 1));
        }
        
        //defs.Capped_Cylinder.insert_transformed_copy_into(this, [10, 10], wheel_transform);
    }
}
