# False Color Image Processing

![A picture of Pluto, where the image is divided diagonally. On the right, the image has a false, quantized color grading](/false_color_pluto.jpg)

## Links: https://github.com/SeanPletan /blog/false_color

subheading:

summary: This program applies pseudocolor techniques—intensity slicing and color transformation—to enhance grayscale images by mapping intensity ranges to colors. Intensity slicing divides pixel values into discrete bins with assigned colors, improving contrast but often producing harsh, cluttered visuals at higher slice counts. Color transformation smooths this effect by using sinusoidal functions to generate gradual color transitions, resulting in more visually coherent and informative images.


<!--BLOG SECTION BELOW-->

There are two techniques used in this program: Intensity slicing and color transformation. Psuedocolor (also known as false color) image processign consists of assignining colors to grey values based on specific criteria. It's most commonly used for human visualization. To be specific, if you want to increase the contrast between grey levels [0,10] and [11,15] it would be advantageous if you could map each bin to a different color. That's intensity slicing. We're slicing up all possible intensities (0 to 255) and mapping them to an arbitrary color. The slices, too, can be arbitrary. Depending on the domain, you'd want to increase contrast in different parts of the intensity scale. For example, if you're dealing with pictures that have a large amount of near-ivory greys, youd want to increase contrast in those levels. Same with dark images.

So, now to go over the intensity slicing program. It takes as input the input image, and the number of slices. The number of slices can be anywhere from 1 to 255 (but the optimal slice number is anywhere from 3 to 20). First, I created a 3D array where the single-channel grayscale image image is stacked along a new dimension (the first axis) three times.. Essentially, this makes three identical copies of the grayscale image, representing the R, G, and B channels, respectively. Next, my program calculates the threshold between color bins by creating an array filled with the thresholds. They are calculated by rounding the product of number of slices input multiplied by the array index. After that, I created a color array, which is an array of random colors, each corresponding to a color bin. Next, I simply looped through each pixel, and assigned a color depending on where the pixel's intensity falls in the intensity array and what random color that corresponds to.
This is the input image. It is a grayscale image of pluto.
Color slicing with 1 slice. 2 color bins.
3 slices. It's clear there is a lighter area around the planet
that isn't visible in the input image.
6 slices. Seems like a happy medium for this particular image.
10 slices. You can see much more information now.
20 slices. Probably too many slices, as information is being lost.
100 slices. Absolutely impossible to derive meaning from.


The issue with intensity slicing is that it's quite jarring. In the pluto image, there isn't a clear edge of where features on the planet are. It's too (compositionally) complicated. Too many small details. When using higher numbers of slices, it creates an extremely busy image, where information is hard to gather. A solution would be to make the color bins not have a sharp cutoff. This leads into color transformation.

Color transformation is also simple to understand. It still divides the intensity range into bins, but, the center of the bin is used as an input into a non-negative sin (or cosine) function with an arbitrary and unique offset for each color channel. For example, say you want to have 5 color slices:

    The thresholds would be as follows: [0.0, 42.5, 85.0, 127.5, 170.0, 212.5, 255.0]
    The midpoint between thresholds would be as follows: [21.25, 63.75, 106.25, 148.75, 191.25, 233.75]

The next step would be to take the midpoint between thresholds (the "k matrix") and plug that into the sin (or cosine) functions. So, if a particular pixel had a value of 45, it would be a part of the second color bin. Therefore, its color would be determined by the following equations:

    Red: y=|sin(63.75+0)|
    Green: y=|sin(63.75+4)|
    Blue: y=|sin(63.75+20)|

This is neatly visualized by the following graph: