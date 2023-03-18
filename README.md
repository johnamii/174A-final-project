# Starship: The Last Delivery

### What is Our Game?
As a Starship delivery bot, you must navigate around obstacles, collect power ups, and avoid hungry cats to deliver food to UCLA icon Gene Block. After passing three levels of difficulty, each with added obstacles/cats, you win!

### How to Play

To move the main camera, use controls like ```WASD```, ```space```, and `z`. Switch to the starship POV with ```ctrl + 0``` and display hitboxes with ```o```. Move around using arrow keys and ```shift``` to jump. Collect power ups like the mushroom (increase speed), star (grant invincibility), and wings (higher jumps).

### How it Works

Every object on the screen is a child class of the main ```Entity``` parent class. Each object includes a checkCollisions(), onCollision() and doMovement() method that help calculate collisions and movements per frame and call the specific entity's behavior. Between every level, the list of entities is reset and new ones spawn randomly across the map.
