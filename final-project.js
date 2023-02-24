import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class SkyBox extends Shape{
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1],
            [1, -1, 1], [1, 1, -1], [-1, 1, -1], 
            [1, 1, 1], [-1, 1, 1], [-1, -1, -1], 
            [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], 
            [1, -1, 1], [1, -1, -1], [1, 1, 1], 
            [1, 1, -1], [-1, -1, 1], [1, -1, 1], 
            [-1, 1, 1], [1, 1, 1], [1, -1, -1], 
            [-1, -1, -1], [1, 1, -1], [-1, 1, -1]
        );
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0],
            [0, -1, 0], [0, 1, 0], [0, 1, 0], 
            [0, 1, 0], [0, 1, 0], [-1, 0, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],
            [1, 0, 0], [1, 0, 0], [1, 0, 0], 
            [1, 0, 0], [0, 0, 1], [0, 0, 1], 
            [0, 0, 1], [0, 0, 1], [0, 0, -1], 
            [0, 0, -1], [0, 0, -1], [0, 0, -1]
            );
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(
            0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22
        );

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.5, .6, .9, .9));
        }
    }
}

class Ground extends Shape{
    constructor(){
        super("position");

        this.arrays.position = Vector3.cast(
            [-1, 0, -1],
            [-1, 0, 1],
            [1, 0, -1],
            [-1, 0, 1],
            [1, 0, 1],
            [1, 0, -1]
        )

        this.arrays.color = [];
        for (let i = 0; i < 6; i++){
            this.arrays.color.push(color(.3, .5, .3, .9));
        }
    }
}

class Axis extends Shape {
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

export class ProjectScene extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            ground: new Ground(),
            axis: new Axis(),
            skybox: new SkyBox()
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            white: new Material(new defs.Basic_Shader())
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
  
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        this.shapes.axis.draw(context, program_state, model_transform, this.materials.white, 'LINES');
 
        model_transform = model_transform.times(Mat4.scale(20, 0, 20));
        this.shapes.ground.draw(context, program_state, model_transform, this.materials.white);
        
        model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.scale(50, 50, 50));
        this.shapes.skybox.draw(context, program_state, model_transform, this.materials.white);
    }
}
