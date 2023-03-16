import {defs, tiny} from './provided/common.js';
import {
    Skybox, Starship, Ground, BoundaryBox, Axis, Text_Interface,
    PowellCat, PowerUp, getPosVector, Student, Wall, Obstacle, RoyceHall, PowellLib
} from "./shape-defs.js";

import { Text_Line } from './provided/text-line.js'

// Pull these names into this module's scope for convenience:
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene,
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

var difficulty = 0;
const difficulties = [
    {
        num_students: 5,
        student_speed: 0.5,
        num_cats: 1,
        cat_speed: 0.5,
        min_cat_spawn_distance: 30,
        num_power_ups: 5,
        max_target_spawn_distance: 30,
        num_obstacles: 2
    },
    {
        num_students: 10,
        student_speed: 0.6,
        num_cats: 1,
        cat_speed: 0.75,
        min_cat_spawn_distance: 25,
        num_power_ups: 4,
        max_target_spawn_distance: 35,
        num_obstacles: 4
    },
    {
        num_students: 15,
        student_speed: 0.7,
        num_cats: 2,
        cat_speed: 0.75,
        min_cat_spawn_distance: 20,
        num_power_ups: 3,
        max_target_spawn_distance: 40,
        num_obstacles: 6
    },
    {
        num_students: 20,
        student_speed: 0.8,
        num_cats: 2,
        cat_speed: 1,
        min_cat_spawn_distance: 15,
        num_power_ups: 2,
        max_target_spawn_distance: 45,
        num_obstacles: 8
    },
    {
        num_students: 25,
        student_speed: 0.9,
        num_cats: 3,
        cat_speed: 1,
        min_cat_spawn_distance: 10,
        num_power_ups: 1,
        max_target_spawn_distance: 50,
        num_obstacles: 10
    },
];

var entities = [];

function loadEntities(difficultyMods) {
    for (let i = 0; i < entities.length; i++){
        delete entities[i]
    }
    let arr = [];

    for (let i = 0; i < difficultyMods.num_cats; i++) {
        arr.push(new PowellCat(vec3(-10 + i, 0, -10 + i), difficultyMods.cat_speed));
    }

    for (let i = 0; i < difficultyMods.num_students; i++) {
        arr.push(new Student(vec3(0, 0, 0), difficultyMods.student_speed));
    }

    for (let i = 0; i < difficultyMods.num_obstacles; i++) {
        arr.push(new Obstacle(vec3(i*2, 0, i * 3)))
    }
    return arr;

}

class Main_Scene extends Scene {
    constructor() {
        super();

        this.initial_camera_location = Mat4.look_at(vec3(0, 25, 85), vec3(0, 0, 0), vec3(0, 1, 0));

        this.shapes = {
            axis: new Axis(),
            skybox: new Skybox(),
            //building: new BoundaryBox(),
            text: new Text_Line(50)
        };

        // *** Materials
        this.materials = {
            basic: new Material(new defs.Basic_Shader()),
            phong: new Material(new defs.Phong_Shader(), {
                ambient: .5, diffusivity: .5, specularity: 0.5,
            }),
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
            }),
            text_image: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/text.png"),
                ambient: 1, diffusivity: 0, specularity: 0,
            }),
            interface: new Material(new defs.Phong_Shader(),{
                color: hex_color("#000000", 0.9),
            }),
            cat: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/garfield.png"),
                color: hex_color("#000000"),
                ambient:1, diffusivity: 0.1, specularity: 0.1
            }),
            royce_hall: new Material(new defs.Textured_Phong(), {
                //texture: new Texture("assets/garfield.png"),
                color: hex_color("#b06b2a"),
                ambient:1, diffusivity: 0.1, specularity: 0.1
            }),
            powell_lib: new Material(new defs.Textured_Phong(), {
                //texture: new Texture("assets/garfield.png"),
                color: hex_color("#b06b2a"),
                ambient:1, diffusivity: 0.1, specularity: 0.1
            }),
        }

        this.draw_hitboxes = true;
        this.in_between_levels = true;
        this.difficulty = 0;

        this.worldDims = vec3(50, 25, 75);

        const starshipSpawn = vec3(0, 2, 50);
        this.sammy = new Starship(starshipSpawn, 1);

        entities = loadEntities(difficulties[this.difficulty]);

        this.buildingDims = vec3(10, 7, 20);
        this.boundaries = [
            // invisible border boundary
            //new BoundaryBox(this.worldDims, vec3(0, 24.99, 0)),
  
            // ROYCE HALL
            //new BoundaryBox(this.buildingDims, vec3(-40, this.buildingDims[1], 0)),
            new RoyceHall(vec3(-40, this.buildingDims[1], 0)),
            // POWELL LIBRARY
            //new BoundaryBox(this.buildingDims, vec3(40, this.buildingDims[1], 0))
            new PowellLib(vec3(40, this.buildingDims[1], 0)),
        ];

        this.world = [
            // grass on ground
            new Ground(vec3(this.worldDims[0], 0.01, this.worldDims[2]), vec3(0, 0, 0), 4),
            // sidewalk
            new Ground(vec3(40, 1, 10), vec3(0, 0.02, 0), 32)
        ];

        this.startScreen = new Text_Interface();
    }

    end_level(delivered){
        this.in_between_levels = true;

        if (delivered === true) {
            this.difficulty++;
        }
        else {
            this.difficulty = 0;
        }

        entities = loadEntities(difficulties[this.difficulty]);

        //vals = vals.concat(entities);
        console.log(entities.length)
        //console.log(vals.length)
    }

    make_control_panel(){
        this.key_triggered_button("Start", ["Enter"], () => { this.in_between_levels = false });
        this.key_triggered_button("Temp raise level", ["m"], () => this.end_level(true))
        this.new_line();
        this.key_triggered_button("Explore Area", ["Control", "0"], () => this.attached = undefined);
        this.key_triggered_button("Starship", ["Control", "1"], () => this.attached = () => this.sammy.transform);
        this.new_line();
        this.key_triggered_button("Starship Forward", ["ArrowUp"], () => this.sammy.thrust[2] = -1, undefined, () => this.sammy.thrust[2] = 0);
        this.key_triggered_button("Starship Backward", ["ArrowDown"], () => this.sammy.thrust[2] = 1, undefined, () => this.sammy.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("Starship Turn Left", ["ArrowLeft"], () => this.sammy.turn = 1, undefined, () => this.sammy.turn = 0);
        this.key_triggered_button("Starship Turn Right", ["ArrowRight"], () => this.sammy.turn = -1, undefined, () => this.sammy.turn = 0);
        this.new_line();
        this.key_triggered_button("Starship Jump", ["Shift"], () => {if (this.sammy.transform[1][3] - this.sammy.box_dims[1] < 0.1) {this.sammy.thrust[1] = 6}});
        this.key_triggered_button("Show Hitboxes", ["o"], () => this.draw_hitboxes = !this.draw_hitboxes);
    } 

    draw_world(context, program_state){
        let model_transform = Mat4.identity();

        // lights
        program_state.lights = [
            new Light(vec4(0, 10, 0, 1), color(1, 1, 1, 1), 1000),
            new Light(vec4(-25, 10, 75, 1), color(1, 1, 1, 1), 1000),
            new Light(vec4(25, 10, 75, 1), color(1, 1, 1, 1), 1000),
        ];

        // sky
        let sky_transform = Mat4.identity().times(Mat4.scale(150, 150, 150));
        this.shapes.skybox.draw(context, program_state, sky_transform, this.materials.basic);

        //this.shapes.axis.draw(context, program_state, model_transform, this.materials.basic, 'LINES');

        // world
        for (let i = 0; i < this.world.length; i++) {
            const val = this.world[i];
            const mat = i === 0 ? this.materials.grass : this.materials.sidewalk;

            val.draw(context, program_state, val.transform, mat);
        }
    }

    draw_text(context, program_state){
        let interfaceTransform = program_state.camera_transform
            .times(Mat4.translation(0, 0, -3))
            .times(Mat4.scale(2, 1, 1));
        this.startScreen.draw(context, program_state, interfaceTransform, this.materials.interface)
        
        let textTransform = program_state.camera_transform.times(Mat4.translation(-1.5, 0, -2.99));
        
        let strings = [
            "Welcome to Starship: The Last Delivery",
            'Press "Enter" to Start'
            ];
        for (let i = 0; i < strings.length; i++) {
            this.shapes.text.set_string(strings[i], context.context);
            this.shapes.text.draw(context, program_state, textTransform.times(Mat4.scale(0.05, 0.05, 0.05)), this.materials.text_image);
            textTransform.post_multiply(Mat4.translation(0, -0.2, 0));
        }
    }
    drawHealthBar(context, program_state, hearts){
        let interfaceTransform = program_state.camera_transform
            .times(Mat4.translation(1.2, -1, -3))
            .times(Mat4.scale(.7, .12, .5));
        this.startScreen.draw(context, program_state, interfaceTransform, this.materials.interface)

        let textTransform = program_state.camera_transform.times(Mat4.translation(.75, -1, -2.99));
        let strings = [
            "health: " + hearts
        ];
        for (let i = 0; i < strings.length; i++) {
            this.shapes.text.set_string(strings[i], context.context);
            this.shapes.text.draw(context, program_state, textTransform.times(Mat4.scale(.05, .05, .05)), this.materials.text_image);
            textTransform.post_multiply(Mat4.translation(0, 0, 0));
            console.log("uhh");
        }
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

            boundary.draw(context, program_state, boundary.transform, this.materials.basic, "LINES");

            if(boundary.model !== null){
                boundary.model.draw(context, program_state, boundary.transformModel(), this.materials.brick);
            }
        }


        // DRAW TEXTBOX OR ENTITIES
        if (this.in_between_levels) {
            this.draw_text(context, program_state);
        }
        else {
            ////////////////////////////////////////////
            // ENTITIES
            ////////////////////////////////////////////

            if (this.draw_hitboxes) {
                this.sammy.draw(context, program_state, this.sammy.transform, this.materials.basic, "LINES");
            }
            let hearts = this.sammy.health;
            this.drawHealthBar(context, program_state, hearts);
            this.sammy.model.draw(context, program_state, this.sammy.transformModel(), this.materials.phong.override({
                color: this.sammy.model_color
            }));
            this.sammy.doMovement(dt);

            for (let i = 0; i < entities.length; i++){

                const entity = entities[i];
                const type = entity.type;

                if (this.draw_hitboxes) {
                    entity.draw(context, program_state, entity.transform, this.materials.basic, "LINES");
                }

                if (entity.model !== null) {
                    
                    let model_mat = this.materials.phong.override({
                        color: entity.model_color
                    });
                    switch(type){
                        case("Cat"):
                            model_mat = this.materials.cat;
                            break;
                        case("Royce Hall"):
                            model_mat = this.materials.brick;
                           // model_mat = this.materials.royce_hall;
                            break;
                        case("Powell Library"):
                            model_mat = this.materials.brick;
                            // model_mat = this.materials.powell_lib;
                            break;
                    }

                    entity.model.draw(context, program_state, entity.transformModel(), model_mat);
                }

                // move entities
                let target = null;
                if(type === "Cat") {
                    target = getPosVector(this.sammy.transform);
                    //console.log(this.sammy.transform+"\n"+entity.transformModel())
                    if(((Math.pow((this.sammy.transform[0][3]-entity.transformModel()[0][3]),2)) + (Math.pow((this.sammy.transform[2][3]-entity.transformModel()[2][3]),2))) < 4){
                        this.sammy.changeHealth(t);
                    }
                    else {
                        entity.doMovement(dt, target);
                    }
                }
                else{
                    entity.doMovement(dt, target);
                }

            }
        }

        // check collisions
        this.sammy.checkEntityCollisions(entities);

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