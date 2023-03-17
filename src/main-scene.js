import {defs, tiny} from './provided/common.js';
import {
    Skybox, Starship, Ground, BoundaryBox, Axis, Text_Interface,
    PowellCat, PowerUp, getPosVector, Student, Wall, Obstacle, RoyceHall, Target, PowellLib
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
        num_students: 10,
        student_speed: 0.5,
        num_cats: 1,
        cat_speed: 0.5,
        min_cat_spawn_distance: 30,
        num_power_ups: 5,
        max_target_spawn_distance: 30,
        num_obstacles: 3
    },
    {
        num_students: 15,
        student_speed: 0.6,
        num_cats: 2,
        cat_speed: 0.75,
        min_cat_spawn_distance: 25,
        num_power_ups: 3,
        max_target_spawn_distance: 35,
        num_obstacles: 6
    },
    {
        num_students: 20,
        student_speed: 0.7,
        num_cats: 3,
        cat_speed: 0.75,
        min_cat_spawn_distance: 20,
        num_power_ups: 1,
        max_target_spawn_distance: 40,
        num_obstacles: 9
    }
];

var entities = [];

function loadEntities(difficultyMods, curLevel) {
    entities.splice(0, entities.length);

    let arr = [];

    for (let i = 0; i < difficultyMods.num_cats; i++) {
        arr.push(new PowellCat(getRandomSpawn("Cat"), difficultyMods.cat_speed));
    }

    for (let i = 0; i < difficultyMods.num_students; i++) {
        arr.push(new Student(getRandomSpawn("Object"), difficultyMods.student_speed));
    }

    for (let i = 0; i < difficultyMods.num_obstacles; i++) {
        arr.push(new Obstacle(getRandomSpawn("Object")));
    }

    for (let i = 0; i < difficultyMods.num_power_ups; i++) {
        arr.push(new PowerUp(getRandomSpawn("Object")));
    }

    arr.push(new Target(getRandomSpawn("Target", curLevel % 2 === 0)));

    return arr;
}

function getRandomSpawn(type, flip){

    // x between buildings: -29, 29
    // x max -49, 49
    // z buildingEnds -50, 50
    // z max -74, 74

    let x, z;
    switch(type){
        case("Object"):
            x = Math.random() * 50 - 25;
            z = Math.random() * 120 - 60
            break;
        case("Cat"):
            x = Math.random() * 20 - 10;
            z = Math.random() * 20 - 10;
            break;
        case("Target"):
            let a = flip === true ? -1 : 1;
            x = Math.random() * 79 - 40;
            z = Math.random() * 10 + (a * 65);
            break;
    }

    return vec3(x, 0, z);
}

class Main_Scene extends Scene {
    constructor() {
        super();

        this.initial_camera_location = Mat4.look_at(vec3(0, 25, 85), vec3(0, 0, 0), vec3(0, 1, 0));

        this.shapes = {
            axis: new Axis(),
            skybox: new Skybox(),
            text: new Text_Line(50),
            cube: new defs.Cube()
        };

        // *** Materials
        this.materials = {
            basic: new Material(new defs.Basic_Shader()),
            phong: new Material(new defs.Phong_Shader(), {
                ambient: .5, diffusivity: .5, specularity: 0.5,
            }),
            brick: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/bricks-3.jpg"),
                color: hex_color("#b06b2a"),
                ambient: .5, diffusivity: .6, 
            }),
            grass: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/grass-texture-1.jpg"),
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
            }),
            sidewalk: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/sidewalk-2.jpg"),
                color: hex_color("#888888"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1
            }),
            text_image: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/text.png"),
                ambient: 1, diffusivity: 0, specularity: 0,
            }),
            interface: new Material(new defs.Phong_Shader(),{
                color: hex_color("#000000", 0.9),
                specularity: 0,
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
            gene: new Material(new defs.Textured_Phong(),{
                texture: new Texture("assets/dennis.jpg"),
                color: hex_color("#ffffff"),
                ambient:.5, diffusivity: 0.1, specularity: 0
            }),
            mushroom: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/mushroom.png", ),
                ambient: 1, diffusivity: 0.1, specularity: 1
            }),
            star: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/star.png", ),
                ambient: 1, diffusivity: 1, specularity: 1
            }),
            invincible: new Material(new defs.Textured_Phong(), {
                texture: new Texture("assets/invincible.png", ),
                ambient: 1, diffusivity: 1, specularity: 1
            })
        }

        this.draw_hitboxes = true;
        this.in_between_levels = true;
        this.difficulty = 0;

        this.worldDims = vec3(50, 25, 75);

        const starshipSpawn = vec3(0, 2, 50);
        this.sammy = new Starship(starshipSpawn, 1);

        entities = loadEntities(difficulties[this.difficulty], this.difficulty);

        this.buildingDims = vec3(10, 7, 20);
        this.boundaries = [
            // invisible border boundary
            //new BoundaryBox(this.worldDims, vec3(0, 24.99, 0)),
  
            // ROYCE HALL
            //new BoundaryBox(this.buildingDims, vec3(-40, this.buildingDims[1], 0)),
            new RoyceHall(vec3(-40, this.buildingDims[1], 0)),
            // POWELL LIBRARY
            new PowellLib(vec3(40, this.buildingDims[1], 0)),
            //new BoundaryBox(this.buildingDims, vec3(40, this.buildingDims[1], 0))
        ];

        this.world = [
            // grass on ground
            new Ground(vec3(this.worldDims[0], 0.01, this.worldDims[2]), vec3(0, 0, 0), 4),
            // sidewalk
            // dim, position
            new Ground(vec3(40, 1, 15), vec3(0, 0.03, 0), 32), // center horizontal
            new Ground(vec3(5, 1, 75), vec3(-4, 0.02, 0), 16), // left center vertical
            new Ground(vec3(5, 1, 75), vec3(4, 0.02, 0), 16), // right center vertical
            new Ground(vec3(50, 1, 10), vec3(0, 0.03, 6.2), 32), // close horizontal
            new Ground(vec3(50, 1, 5), vec3(0, 0.03, -13), 32) // far horizontal
        ];

        this.startScreen = new Text_Interface();
    }

    end_level(delivered){
        this.in_between_levels = true;
        this.sammy.nextLevel = false;
        if (delivered === true) {
            if (this.difficulty < 2) {
                this.difficulty++;
            }
        }
        else {
            this.difficulty = 0;
        }

        entities = loadEntities(difficulties[this.difficulty]);
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
        }
    }
    drawGameOver(context, program_state){
        let interfaceTransform = program_state.camera_transform
            .times(Mat4.translation(0, 0, -3))
            .times(Mat4.scale(2, 1, 1));
        this.startScreen.draw(context, program_state, interfaceTransform, this.materials.interface.override({color: color(1, .05, .05, .9)}));

        let textTransform = program_state.camera_transform.times(Mat4.translation(-1.5, 0, -2.99));

        let strings = [
            "Game Over!",
            "Reload the page to try again :)"
        ];
        for (let i = 0; i < strings.length; i++) {
            this.shapes.text.set_string(strings[i], context.context);
            this.shapes.text.draw(context, program_state, textTransform.times(Mat4.scale(0.05, 0.05, 0.05)), this.materials.text_image);
            textTransform.post_multiply(Mat4.translation(0, -0.2, 0));
        }
    }

    display(context, program_state) { // Called once per frame of animation.
        //console.log(getPosVector(this.sammy.transform)[0])

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

            if (this.sammy.health === ""){
                this.drawGameOver(context, program_state);
                return;
            }

            if (this.draw_hitboxes) {
                this.sammy.draw(context, program_state, this.sammy.transform, this.materials.basic, "LINES");
            }

            let hearts = this.sammy.health;
            this.drawHealthBar(context, program_state, hearts);
            let sammy_model_mat = this.materials.phong.override({
                color: this.sammy.model_color
            });
            
            if (this.sammy.invincible > 0) {
                this.sammy.invincible -= 0.01;
                sammy_model_mat = this.materials.invincible;
            }
            this.sammy.model.draw(context, program_state, this.sammy.transformModel(), sammy_model_mat);

            this.sammy.doMovement(dt);
            
            for (let i = 0; i < entities.length; i++){

                const entity = entities[i];

                if (entity.active === false) {
                    // remove inactive enemies
                    entities.splice(i, 1);
                }

                const type = entity.type;

                if (this.draw_hitboxes) {
                    entity.draw(context, program_state, entity.transform, this.materials.basic, "LINES");
                }

                if (entity.model !== null) {
                    
                    switch(type){
                        case("Gene"):
                            model_mat = this.materials.gene;
                            break;
                        case("Cat"):
                            var model_mat = this.materials.cat;
                            break;
                        case("Royce Hall"):
                            model_mat = this.materials.brick;
                           // model_mat = this.materials.royce_hall;
                            break;
                        case("Powell Library"):
                            model_mat = this.materials.brick;
                            // model_mat = this.materials.powell_lib;
                            break;
                        case("Mushroom"):
                            model_mat = this.materials.mushroom;
                            break;
                        case("Star"):
                            model_mat = this.materials.star;
                            break;
                        case("Wings"):
                            model_mat = this.materials.phong.override({
                                color:hex_color("#ffffff"), specularity:1, diffusivity: 1
                            });
                            break;
                        default:
                            model_mat = this.materials.phong.override({
                                color: entity.model_color
                            });
                    }

                    entity.model.draw(context, program_state, entity.transformModel(), model_mat);
                }

                // move entities
                let target = type === "Cat" ? getPosVector(this.sammy.transform) : null;
                entity.doMovement(dt, target);
            }
        }

        // check collisions
        this.sammy.checkEntityCollisions(entities.concat(this.boundaries));
        if(this.sammy.nextLevel){
            this.end_level(true);
        }
        for (let i = 0; i < entities.length; i++) {
            entities[i].checkEntityCollisions(this.boundaries);
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