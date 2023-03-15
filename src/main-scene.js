import {defs, tiny} from './provided/common.js';
import { 
    Skybox, Starship, Ground, BoundaryBox, Axis, PowellCat, PowerUp, getPosVector, Student
} from "./shape-defs.js";

// Pull these names into this module's scope for convenience:
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene,
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

class Main_Scene extends Scene {
    constructor() {
        super();

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        this.shapes = {
            grass: new Ground(),
            axis: new Axis(),
            skybox: new Skybox(),
            //building: new BoundaryBox(),
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

        this.draw_hitboxes = true;
        this.worldDims = [30, 0, 60];
        this.buildingDims = [];

        this.sammy = new Starship(vec3(0, 2, 0), 1);

        this.entities = [
            new PowellCat(vec3(-10, 1, 0), 0.5),
            new Student(vec3(-10, 0, 5), 0.5)
        ];

        let bxdist = 25;    //how close the buildings are to the edge (left right on map)
        let bheight = 4;    //height of building
        let bzdist = 30;    //how far buildings are from center (up down on map)

        this.boundaries = [
            // invisible border boundary
            new BoundaryBox(vec3(30, 25, 60), vec3(0, 24.99, 0)),
            // buildings
            new BoundaryBox(vec3(4, bheight, 20), vec3(-bxdist, bheight, -bzdist)), // top left
            new BoundaryBox(vec3(4, bheight, 20), vec3(bxdist, bheight, -bzdist)), // top right
            new BoundaryBox(vec3(4, bheight, 20), vec3(bxdist, bheight, bzdist)), // bottom right
            new BoundaryBox(vec3(4, bheight, 20), vec3(-bxdist, bheight, bzdist)), // bottom left
        ];
    }

    make_control_panel(){
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Explore Area", ["Control", "0"], () => this.attached = undefined);
        this.key_triggered_button("Starship", ["Control", "1"], () => this.attached = () => this.sammy.transform);
        this.new_line();
        this.key_triggered_button("Starship Forward", ["ArrowUp"], () => this.sammy.thrust[2] = -1, undefined, () => this.sammy.thrust[2] = 0);
        this.key_triggered_button("Starship Backward", ["ArrowDown"], () => this.sammy.thrust[2] = 1, undefined, () => this.sammy.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Starship Turn Left", ["ArrowLeft"], () => this.sammy.turn = 1, undefined, () => this.sammy.turn = 0);
        this.key_triggered_button("Starship Turn Right", ["ArrowRight"], () => this.sammy.turn = -1, undefined, () => this.sammy.turn = 0);
        this.new_line();
        this.key_triggered_button("Starship Jump", ["Shift"], () => {if (this.sammy.transform[1][3] - this.sammy.dims[1] < 0.1) {this.sammy.thrust[1] = 6}});
        this.key_triggered_button("Show Hitboxes", ["o"], () => this.draw_hitboxes = !this.draw_hitboxes);
    } 

    draw_world(context, program_state){
        let model_transform = Mat4.identity();

        // lights
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // sky
        let sky_transform = Mat4.identity().times(Mat4.scale(200, 200, 200));
        this.shapes.skybox.draw(context, program_state, sky_transform, this.materials.white);

        this.shapes.axis.draw(context, program_state, model_transform, this.materials.white, 'LINES');

        // ground
        let grass_transform = Mat4.identity()
            .times(Mat4.scale(30, 0.01, 60))
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0));
        this.shapes.grass.draw(context, program_state, grass_transform, this.materials.grass);

        let sidewalk_transform = Mat4.identity()
            .times(Mat4.translation(-10, 0.05, 0))
            .times(Mat4.scale(2, 1, 20))
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))

        this.shapes.grass.draw(context, program_state, sidewalk_transform, this.materials.sidewalk);
    }

    display(context, program_state) { // Called once per frame of animation.

        ///////////////////////////////////////////
        // CONTEXT & WORLD
        ///////////////////////////////////////////

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        this.draw_world(context, program_state);  

        ////////////////////////////////////////////
        // BOUNDARIES
        ////////////////////////////////////////////

        for (let i = 0; i < this.boundaries.length; i++) {
            const boundary = this.boundaries[i];

            let mat = i === 0 ? this.materials.test.override({color: hex_color("ffffff", 0)}) : this.materials.brick;

            boundary.draw(context, program_state, boundary.transform, mat);
        }

        ////////////////////////////////////////////
        // ENTITIES
        ////////////////////////////////////////////

        if (this.draw_hitboxes) {
            this.sammy.draw(context, program_state, this.sammy.transform, this.sammy.material, "LINES");
        }

        this.sammy.model.draw(context, program_state, this.sammy.transformModel(), this.sammy.model_mat);
        this.sammy.doMovement(dt);

        for (let i = 0; i < this.entities.length; i++){

            const entity = this.entities[i];

            if (this.draw_hitboxes) {
                entity.draw(context, program_state, entity.transform, entity.material, "LINES");
            }

            if (entity.model !== null) {
                entity.model.draw(context, program_state, entity.transformModel(), entity.model_mat);
            }

            // move entities
            let target = entity.isCat() ? getPosVector(this.sammy.transform) : null;
            entity.doMovement(dt, target);
        }

        ////////////////////////////////////////////
        // CAMERA STUFF
        ////////////////////////////////////////////

        if (this.attached !== undefined){

            let desired = Mat4.inverse(this.attached()
                .times(Mat4.translation(0, 5, 10))
                .times(Mat4.rotation(-0.2, 1, 0, 0))
                );
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