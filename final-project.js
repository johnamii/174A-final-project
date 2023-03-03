import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Skybox extends defs.Cube{
    constructor() {
        super();

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.5, .8, 1, .9));
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
            this.arrays.color.push(color(.3, .5, .3, 1));
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

class Starship extends defs.Cube {
    constructor(){
        super();

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.9, .9, .9, 1));
        }

        this.position = this.arrays.position;
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
            skybox: new Skybox(),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            white: new Material(new defs.Basic_Shader())
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));


        this.sammy = new Starship();
        this.sammyHeight = 0.5;
        this.starship_transform = Mat4.identity()
            .times(Mat4.scale(.7, this.sammyHeight, 1))
            .times(Mat4.translation(0, 5, 5));
    }

    move_starship(control) {
        if (control === "Forward"){
            this.starship_transform = this.starship_transform.times(Mat4.translation(0, 0, -0.2));
        }
        else if (control === "Backward"){
            this.starship_transform = this.starship_transform.times(Mat4.translation(0, 0, 0.2));
        }
        else if (control === "Left"){
            this.starship_transform = this.starship_transform.times(Mat4.rotation(Math.PI/24, 0, 1, 0));
        }
        else if (control === "Right")[
            this.starship_transform = this.starship_transform.times(Mat4.rotation(-Math.PI/24, 0, 1, 0))
        ]
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Explore Area", ["Control", "0"], () => this.attached = undefined);
        this.key_triggered_button("Starship", ["Control", "1"], () => this.attached = () => this.starship_transform);
        this.new_line();
        this.key_triggered_button("Starship Forward", ["ArrowUp"], () => this.move_starship("Forward"));
        this.key_triggered_button("Starship Backward", ["ArrowDown"], () => this.move_starship("Backward"));
        this.new_line();
        this.key_triggered_button("Starship Turn Left", ["ArrowLeft"], () => this.move_starship("Left"));
        this.key_triggered_button("Starship Turn Right", ["ArrowRight"], () => this.move_starship("Right"));
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

        let sky_transform = Mat4.identity().times(Mat4.scale(100, 100, 100));
        this.shapes.skybox.draw(context, program_state, sky_transform, this.materials.white);
 
        let ground_transform = Mat4.identity().times(Mat4.scale(30, 0, 60));
        this.shapes.ground.draw(context, program_state, ground_transform, this.materials.white);

        this.sammy.draw(context, program_state, this.starship_transform, this.materials.test);

        // get y coordinate of center of starship, fall until hitting ground
        let transformY = this.starship_transform[1][3] - this.sammyHeight;
        if (transformY > 0.1){
            let fall = -0.1;
            this.starship_transform = this.starship_transform.times(Mat4.translation(0, fall, 0));
        }

        // handle changes to camera
        if (this.attached !== undefined){

            let desired = Mat4.inverse(this.attached().times(Mat4.translation(0, 1, 6)));
            let blend = desired.map((x, i) => Vector.from( program_state.camera_inverse[i] ).mix(x, 0.1));
            program_state.set_camera(blend);
        }
        else{
            program_state.set_camera(this.initial_camera_location);
        }
    }
}
