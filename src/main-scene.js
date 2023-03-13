import {defs, tiny} from './provided/common.js';
import { Skybox, Starship, Ground, Building, ModifiedCube, Axis } from "./shape-defs.js";

// Pull these names into this module's scope for convenience:
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene,
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

class Main_Scene extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            grass: new Ground(),
            axis: new Axis(),
            skybox: new Skybox(),
            building: new ModifiedCube(),
            wheel: new defs.Capped_Cylinder(10, 10)
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            white: new Material(new defs.Basic_Shader()),
            brick: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/royce-hall.jpg"),
                color: hex_color("#b06b2a"),
                ambient: .5, diffusivity: .6, 
            }),
            grass: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/grass-texture-1.jpg"),
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
            }),
            sidewalk: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/sidewalk-texture-1.jpg"),
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1
            })
        }

        this.speed_multiplier = 1;
        this.meters_per_frame = 10;
        this.thrust = vec3(0, 0, 0);
        this.turn = 0;

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.sammy = new Starship();
        this.sammyWidth = 0.7;
        this.sammyHeight = 0.5;
        this.sammyLength = 1;
        this.starship_transform = Mat4.identity()
            .times(Mat4.scale(this.sammyWidth, this.sammyHeight, this.sammyLength))
            .times(Mat4.translation(0, 5, 5));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Explore Area", ["Control", "0"], () => this.attached = undefined);
        this.key_triggered_button("Starship", ["Control", "1"], () => this.attached = () => this.starship_transform);
        this.new_line();
        this.key_triggered_button("Starship Forward", ["ArrowUp"], () => this.thrust[2] = 1, undefined, () => this.thrust[2] = 0);
        this.key_triggered_button("Starship Backward", ["ArrowDown"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Starship Turn Left", ["ArrowLeft"], () => this.turn = 1, undefined, () => this.turn = 0);
        this.key_triggered_button("Starship Turn Right", ["ArrowRight"], () => this.turn = -1, undefined, () => this.turn = 0);
        this.new_line();
        this.key_triggered_button("Starship Jump", ["Control"], () => {if (this.starship_transform[1][3] - this.sammyHeight < 0.1) {this.thrust[1] = -6}})
    } 

    move_starship(meters_per_frame) {
        if (this.thrust[1] < 0) {
            this.thrust[1] += 0.05
        }

         // get y coordinate of center of starship, fall until hitting ground
         let transformY = this.starship_transform[1][3] - this.sammyHeight;
         if (transformY > 0.1 ){
             let fall = -0.2;
             this.starship_transform = this.starship_transform.times(Mat4.translation(0, fall, 0));
         }

        this.starship_transform.post_multiply(Mat4.rotation(.025 * this.turn, 0, 1, 0));
        this.starship_transform.post_multiply(Mat4.translation(...this.thrust.times(-meters_per_frame)));
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
        const m = this.speed_multiplier * this.meters_per_frame,
                r = this.speed_multiplier * this.radians_per_frame;
        let model_transform = Mat4.identity();

        this.shapes.axis.draw(context, program_state, model_transform, this.materials.white, 'LINES');

        //sky
        let sky_transform = Mat4.identity().times(Mat4.scale(200, 200, 200));
        this.shapes.skybox.draw(context, program_state, sky_transform, this.materials.white);

        //ground
        let grass_transform = Mat4.identity().times(Mat4.scale(30, 0, 60)).times(Mat4.rotation(Math.PI/2, 1, 0, 0));
        this.shapes.grass.draw(context, program_state, grass_transform, this.materials.grass);

        let sidewalk_transform = Mat4.identity()
            .times(Mat4.translation(-10, 0.05, 0))
            .times(Mat4.scale(2, 1, 20))
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            
        this.shapes.grass.draw(context, program_state, sidewalk_transform, this.materials.sidewalk);

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
            //  instead use shape.insert_transformed_copy... figure out how to add color to that
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

        // handle changes to camera

        this.move_starship(dt * m);

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

const Additional_Scenes = [];
export {Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs}