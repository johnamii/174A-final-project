# Starship: The Last Delivery

### What is this game?

> As a Starship delivery bot, you must fight against all odds to deliver food to UCLA icon Gene Block.
* Your goal is to navigate the map, collect power ups, avoid obstacles, and reach Gene Block before the cat reaches you first
* There is always a cat chasing after you trying to steal your food
* There are three levels of difficulty, each has more obstacles/cats than the last

### How to play:

* Control the camera with WASD, as well as ```space``` and ```z``` for up and down. Change to the starship point of view by pressing ```Ctrl + 0```
* Move the Starship with the arrow keys, press ```Shift``` to jump
* Press ```o``` to show all the hitboxes of different entities
* Try to collect power ups -- The mushroom will increase your speed, the star will make you invincible, the wings will let you jump higher

### How it works:

* Each object on the screen is a child class of the main Entity parent class 
* Every entity has a checkCollisions, onCollision and doMovement method, as well as member variables that vary per type of Entity
* Collisions and movements are calculated for every entity in every frame, and objects will react differently when they collide with something
* Everything occurs in the same scene: between every level, the list of entities is reset and new ones spawn randomly on the map
