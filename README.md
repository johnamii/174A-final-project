# Starship: The Last Delivery

### What is Our Game?
> as a Starship delivery bot, you must fights against all odds to deliver food to UCLA icon Gene Block
* navigate around obstacles, collect power ups, and avoid cats chasing you to steal your food
* to win, pass all three levels of difficulty -- each with more obstacles and cats than the last

### How to Play

* control the main camera using ```WASD```, ```space```, and `z`
* change to the starship POV with ```ctrl + 0```
* move around using the arrow keys and jump using ```shift```
* display hitboxes by clicking key ```o```
* collect power ups: mushroom (increase speed), star (grant invincibility), wings (higher jumps)

### How it Works

* Each object on the screen is a child class of the main Entity parent class 
* Every entity has a checkCollisions(), onCollision() and doMovement() method, as well as member variables that vary per type of Entity
* Collisions and movements are calculated per entity in every frame, and objects will react differently when they collide with something
* Everything occurs in the same scene: between every level, the list of entities is reset and new ones spawn randomly on the map
