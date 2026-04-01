# Three.js Materials Testbed

![A dragonscale taurus, a cube, and a sphere floating in an alleyway.](/materials_main.jpg)

## Links: https://github.com/SeanPletan https://materialexperimentation.vercel.app/ /blog/threejs_materials_testbed

published: December 23, 2024
last edited: March 31, 2026

subheading: A simple scene that displays a number of objects, utilizing Three.js' MeshPhysicalMaterial and a simple environment map.

summary: The first project that I did in Three.js; it was mainly a conceptual proof of concept for my own understanding. It is a scene that displays various objects with MeshPhysicalMaterial material and an environment map.


<!-- BLOG BELOW -->

This was the first Three.js project that I released onto the web. It's more of a proof of concept, because it's so bare-bones. Regardless, I will still explain how it works and my thoughts on it. In the script.js file, I had to set up several things before I could get into the main part of it. That includes creating a new Three.js scene, create a new instance of the GUI() class (so that the end user can tweak properties of any JavaScript object at runtime), link the HTML canvas element (which is the only element added to the HTML page, apart from head tags and linking the script.js file to it) to the Three.js renderer, deal with how different users could have different screen sizes (by getting the ratio of screen width to height, and then plugging that into the Three.js camera), creating the Three.js camera, creating an event listener to update the ratio of screen width to height on window resize, and creating an animation function which renders the scene on every frame and calls itself again on the next frame. Going more in depth into the animation function called tick(): I first create a new instance of a Three.js clock(). Then I get the elapsed time since window creation by calling clock.getElapsedTime(). After that, I use the variable elapsedTime to update any JS object properties declared in the meat and potatoes of the code (such as sphere.rotation.y = 0.2 *elapsedTime). Finally, I update the controls, re-render the scene, call window.requestAnimationFram(tick), end the tick() function, and call the tick() function directly after its definition. What that results in is a place where I can update object properties on every frame, and the functionality of re-rendering the scene on every frame (which generally matches the user's screen framerate).

Now, the meat and potatoes of the file. I created three geometries (sphere, cube, and torus), set their position to be offset on the x plane, and then instantiated a MeshPhysicalMaterial() called material. MeshPhysicalMaterial is an extension of MeshStandardMaterial (which is a physically based material) with added properties such as sheen, clearcoat, iridescence, etc.. Read more about it here. Next, I set the default values for most of the material's properties, as seen in the image below. One line that you'll see in the screenshot below is "material.aoMap = absAmbientOcclusionTexture". What this line (and others like it) is saying, is to map the already loaded absAmbientOcclusionTexture into the ambient occlusion of the material texture. Finally, after all of that, I load these material properties into lil-gui tweaks.


I've gotten mixed reactions when I've shown people with no computer science background. If they really enjoy it, they probably enjoy it because of the choice of material. Otherwise, they enjoy it because of the tweaks. But I'd say about 60% of people are uninterested, 30% enjoy it because of the material choice, and the remaining 10% like it because of the tweaks. It's understandable, though. It's a very small, bare-bones project. A proof of concept. Because of the limited scope of it, I don't see the need in expanding functionalities to this particular project. If I were to create a proper materials testbed, I'd probably combine this project and the above lighting testbed. I would also have every material and light be made available to the user; explain the qualitative effects, performance, history, and algorithms behind each light or material, when applicable.