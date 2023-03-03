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
class Building extends defs.Cube{
    constructor(){
        super();

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.69, .42, .165, 1));
        }

        this.position = this.arrays.position;
    }
}
class Starship extends defs.Cube {
    constructor(){
        super();

        this.arrays.color = [];
        for (let i = 0; i < 24; i++){
            this.arrays.color.push(color(.9, .9, .9, 1));
        }
        
        //defs.Capped_Cylinder.insert_transformed_copy_into(this, [10, 10], wheel_transform);
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
            building: new Building(),
            wheel: new defs.Capped_Cylinder(10, 10)
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            white: new Material(new defs.Basic_Shader()),
            brick: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, color: hex_color("#b06b2a")}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.sammy = new Starship();
        this.sammyWidth = 0.7;
        this.sammyHeight = 0.5;
        this.sammyLength = 1;
        this.starship_transform = Mat4.identity()
            .times(Mat4.scale(this.sammyWidth, this.sammyHeight, this.sammyLength))
            .times(Mat4.translation(0, 5, 5));
    }

    move_starship(control) {//check if keyup/keydown as a bool is the way to solve it i think
        if (control === "Forward"){//bc it only registers a keypress once for a second, then repeats
            this.starship_transform = this.starship_transform.times(Mat4.translation(0, 0, -0.2));
        }
        else if (control === "Backward"){
            this.starship_transform = this.starship_transform.times(Mat4.translation(0, 0, .2));
        }
        //testing
        else if (control === "Left"){
            this.starship_transform = this.starship_transform.times(Mat4.rotation(Math.PI/24, 0, 1, 0));
        }
        else if (control === "Right") {
            this.starship_transform = this.starship_transform.times(Mat4.rotation(-Math.PI / 24, 0, 1, 0));
        }
        else {
            //this will never run bc it only calls when a button is pressed - gonna have to smooth it out in "display"
        }
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

        //lights
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        //time and initialize
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        this.shapes.axis.draw(context, program_state, model_transform, this.materials.white, 'LINES');

        //sky
        let sky_transform = Mat4.identity().times(Mat4.scale(100, 100, 100));
        this.shapes.skybox.draw(context, program_state, sky_transform, this.materials.white);

        //ground
        let ground_transform = Mat4.identity().times(Mat4.scale(30, 0, 60));
        this.shapes.ground.draw(context, program_state, ground_transform, this.materials.white);

        //buildings
        let bxdist = 25;    //how close the buildings are to the edge (left right on map)
        let bheight = 4;    //height of building
        let bzdist = 30;    //how far buildings are from center (up down on map)
        let build_transform = Mat4.identity().times(Mat4.translation(-bxdist,bheight, -bzdist))
            .times(Mat4.scale(4, bheight, 20));
        this.shapes.building.draw(context, program_state, build_transform, this.materials.brick);//top left building
        build_transform = Mat4.identity().times(Mat4.translation(bxdist,bheight, -bzdist))
            .times(Mat4.scale(4, bheight, 20));
        this.shapes.building.draw(context, program_state, build_transform, this.materials.brick);//top right building
        build_transform = Mat4.identity().times(Mat4.translation(bxdist,bheight, bzdist))
            .times(Mat4.scale(4, bheight, 20));
        this.shapes.building.draw(context, program_state, build_transform, this.materials.brick);//back left building
        build_transform = Mat4.identity().times(Mat4.translation(-bxdist,bheight, bzdist))
            .times(Mat4.scale(4, bheight, 20));
        this.shapes.building.draw(context, program_state, build_transform, this.materials.brick);//back right building

        this.sammy.draw(context, program_state, this.starship_transform, this.materials.test);


        // TODO: REDO ALL OF THIS wheel stuff and put it in a function
        let wheelW = 1/this.sammyWidth / 9;
        let wheelH = 1/this.sammyHeight / 3;
        let wheelL = 1/this.sammyLength / 3;
        let wheel_transform = this.starship_transform
            .times(Mat4.scale(wheelW, wheelH, wheelL))
            .times(Mat4.translation(-6.5, -1, -2))
            .times(Mat4.rotation(Math.PI/2, 0, 1, 0));
            
        //draw first
        this.shapes.wheel.draw(context, program_state, wheel_transform, this.materials.test.override({color: color(.1, .1, .1, 1)}))
        for (let i = 0; i < 2; i++){
            wheel_transform = wheel_transform.times(Mat4.translation(-2, 0, 0));
            this.shapes.wheel.draw(context, program_state, wheel_transform, this.materials.test.override({color: color(.1, .1, .1, 1)}))
        }
        wheel_transform = wheel_transform.times(Mat4.translation(0, 0, 13));
        this.shapes.wheel.draw(context, program_state, wheel_transform, this.materials.test.override({color: color(.1, .1, .1, 1)}))
        for (let i = 0; i < 2; i++){
            wheel_transform = wheel_transform.times(Mat4.translation(2, 0, 0));
            this.shapes.wheel.draw(context, program_state, wheel_transform, this.materials.test.override({color: color(.1, .1, .1, 1)}))
        }

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
