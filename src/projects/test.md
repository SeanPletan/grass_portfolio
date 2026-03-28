# Test Project

### 'Markdown-it' 'Three.js' 'Javascript' 'HTML' 'CSS' 'VS Code'

![test](/Portfolio_Mockup.png)A mockup UI made in figma, January 2026.

## Links: https://github.com/nodeca/pica https://seanpletan.net /blog/test_blog

#### 'Embedded Systems' 'Automotive' 'Low Level Communications' 'Tag Example #4'

published: March 19, 2026
last edited: March 25, 2026

summary:This is a simple little introduction to the simple little test project. Below this will be some sort of separator which the program will search for, and only render the text above it in the projects section. Below it will be rendered in the blog section.

<!--BLOG SECTION BELOW-->

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla lorem diam, sodales non nulla in, posuere dictum tellus. Integer et turpis est. Duis ut felis hendrerit, efficitur est eget, aliquet justo. Donec sagittis consequat nibh, quis lacinia erat congue ut. Suspendisse sed dui massa. Aliquam erat volutpat. Morbi convallis condimentum lectus. Nam a mattis nisi. Fusce tincidunt mi orci. In id magna augue. Morbi ultricies nunc a est porttitor, eget posuere massa sodales. Proin vestibulum pharetra tellus id pellentesque. In a libero nec nibh auctor porta posuere at eros.

Integer dignissim, tortor at laoreet dignissim, tortor odio euismod massa, at faucibus est massa molestie arcu. Quisque tristique dui arcu, sit amet lobortis tortor dapibus sed. Etiam tincidunt lacus nec turpis rutrum tristique. Vivamus sit amet tempus enim. Quisque accumsan arcu sapien, ut porttitor orci suscipit at. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec imperdiet lacus lorem, sed porttitor ex lacinia vel. Phasellus ullamcorper sit amet odio id ultricies.

Vestibulum vel augue et ante rhoncus posuere nec et sem. Curabitur nec feugiat turpis. Donec nec condimentum elit, in sodales lectus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut cursus luctus faucibus. Mauris massa felis, sodales at nulla sit amet, ultricies fermentum nunc. Donec aliquam vel mauris non sodales. Nam elementum nisi non sapien pharetra convallis. Vivamus nunc neque, vestibulum at condimentum at, viverra sollicitudin ex. Mauris cursus libero eget ligula sollicitudin, vitae ultricies diam varius. Donec dignissim turpis vitae augue venenatis sodales.

# Hello

Donec at tellus ut ligula scelerisque tincidunt. Morbi nec rhoncus ligula. Mauris at justo consectetur, interdum odio a, ullamcorper libero. In iaculis dictum nisi ac rutrum. Donec felis eros, laoreet et felis laoreet, porta bibendum quam. Suspendisse elit diam, lacinia sed magna ac, ultricies tincidunt ante. Duis odio turpis, porta ac tempor ac, egestas vel lorem. Nulla a consectetur lectus. Sed vel tempor neque. Quisque dapibus scelerisque venenatis. Integer dictum pharetra aliquam. Sed quis quam pulvinar, facilisis leo vestibulum, sollicitudin libero. Aenean eu ligula vehicula, fermentum justo quis, imperdiet ipsum. Donec tristique leo sed purus volutpat molestie. Nam non ligula id arcu venenatis vestibulum. Morbi pulvinar odio velit, ut mollis ipsum luctus non.

Curabitur feugiat porta quam et tincidunt. Nunc ac risus sit amet neque scelerisque gravida in sit amet nibh. Ut viverra arcu ut sodales condimentum. Donec eget hendrerit purus. In tincidunt consequat elementum. Nam vitae ante nisl. Vivamus nec volutpat nulla.

TODO List:
+ Parse the image caption data, create a div below the image, and render the text as a small caption
+ Parse the publish and last edited date, insert that below the main heading
     + consider the "by Sean" with a little image of me, like the nytimes
+ Figure out and probably refactor A LOT of the view changes from project to blog, expanded to panel, and the actual broswer <- -> buttons
+ Create a little nav bar that goes to "About Me", "Projects", "Blog", and "Contact Me" in the top left corner, visible only when in its expanded state in blog and projects
+ Figure out why the css transition breaks only the first time when transitioning to panel to expanded and back again.
+ Actually do the blog section
     + Probably make another function in blog_parsing.js to parse .md files in /blogs
     + You'd have to do another function in main.js which automatically imports and parses each blog .md (the async function). Consider making it synchronous
     + You'd have to create another function to render the blog_cards... Which should consist of a headline and a short sub-headline only. Should be horizontal. Grid-like pattern. Maybe a "X minute read" too.
+ Actually do the contact section

+ Consider refactoring the expanded vs panel modes... each view (project main, blog main, blog post) apart from about me and contact me should be able to seemlessly switch between each. After switching from a view that is expanded to another view that CAN be expanded, ensure that it STAYS expanded, and the UI accounts for it.

+ Figure out how to wrap the title without messing up the fullscreen icon dimensions

+ lots of QA, basically



+ Use URL query parameters to track expanded state
