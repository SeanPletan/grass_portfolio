# Binarized Image With Otsu's Algorithm & Blob Counting

![A binarized image of blood cells](/binarized.jpg)

## Links: https://github.com/SeanPletan /blog/binarized_otsu

subheading: A binarized image of red blood cells utilizing Otsu's Algorithm. Blob counting and center detection has yet to occur.

summary: This Python project simulates how medical systems count red blood cells by processing microscope images through histogram analysis, Otsu’s thresholding, binarization, and blob detection. It labels connected regions (blobs) using a 2D matrix and connectivity checks, then computes their centers and sizes to identify and mark individual cells. While the blob detection works well overall, the center calculations are sometimes inaccurate and could be improved.

<!--BLOG SECTION BELOW-->

Like the following project, this was made for my digital image processing class. However, I deem it complicated enough for this portfolio. I feel like it rounds out the topic selection. In the medical industry, machines are used to count red blood cells in a given sample. These machines capture a microscope image of the sample, binarize the image, and apply an algorithm to determine the number of ivory areas (blood cells) present. My program (coded in Python) follows a similar general algorithm:

+    Compute the histogram of the image
+    Find the optimal threshold to determine whether a pixel is ivory or black
+    Binarize the image given that threshold
+    Create a 2 dimensional matrix the same size as the image, and then assign every index corresponding to a pixel in image a unique number if it is not a part of a current blob (this is called blob coloring)
+    Compute the center of the blob
+    Overwrite the image by putting text on the center of every blob (with a period or an asterisk)

I will go through each step in depth.

So, this is how the histogram function works: for each of the pixels in the original image, add 1 to the index of a 1 dimensional array that corresponds to that pixel's value. After that, use the 1 dimensional array as a parameter to the Matplotlib function plot(). Save the image to the output path, and you get this image:

The histogram for the input image. The pixel values (intensities) are on the x-axis while the number of occurrences is on the y-axis.
The next step is to take this histogram as an input to the function that determines the optimal threshold. As aforementioned, this function uses Otsu's method. Note that Otsu's method is best used for images with a bimodal histogram (in other words, if the image has a lot of light and dark areas). This works well for our input image of red blood cells against a dark background. Now, the algorithm:

+    Count or calculate how many pixels there are in the image. This is to calculate the probability distribution function. In other words, the probability of each pixel value occurrence.
+    Create an array of probabilities by looping through the histogram array and dividing each value by the total amount of pixels. Store the result in the probabilities array.
+    Initialize the weight0, weight1, variance0, and variance1 to 0. weight is the summation of all probabilities in that class, variance is the summation of each pixel value, multiplied by its probability, divided by that classes' weight. The class is defined as the area of the histogram above or below a threshold.
+    Calculate the inter-class variance for every possible threshold (0 to 255) by using this equation: weight0 * weight 1 * ((variance0 - variance1)**2). Rewrite a variable called maximum if the current threshold is higher than the current maximum threshold.

What this does, is very neatly visualized in this gif found on the Wikipedia page for Otsu's Method. Otsu's method is best used for images with a bimodal histogram (in other words, if the image has a lot of light and dark areas). This works well for our input image of red blood cells against a dark background.

Lucas(CA), CC BY-SA 4.0, via Wikimedia Commons
The next step is pretty straightforward. For every pixel, if it is below the optimal threshold, set its value equal to 0. If it is above, set it equal to 255. The image has now been binarized optimally, given the image has a bimodal histogram.
The input image (128x128). This is a photo of a red blood cell sample.
The binarized negative image (also 128x128). Notice certain blobs are not present.


This fourth step, however, is the most prone to mistakes. It's blob extraction (or coloring). The algorithm that I used does not use convolution, unlike other forms of blob detection.. The general idea is to scan the image from left to right and from top to bottom, assigning a unique identifier to an index in a 2-dimensional array (that corresponds to a pixel in the image) if it is not part of a current blob. The way we detect if a pixel is a part of a blob is by looking at its neighbors (also known as connectivity checks). In this implementation, I used a 4-way connectivity scheme (up, down, left, and right), but it is possible to implement an 8-way connectivity scheme (which includes diagonal checks). The algorithm for this connectivity scheme is as follows:

    For binary image I, define a "region color" array R.
    R(i,j) = region number of pixel I(i,j)
    Set R = 0 and k = 1 (k = region number counter)
    While scanning the image left-to-right and top-to-bottom do:
        If I(i, j) = 1 and I(i, j-1) = 0 and I(i-1, j) = 0, then set R(i, j) = k and k = k +1
        If I(i, j) = 1 and I(i, j-1) = 0 and I(i-1, j) = 1, then set R(i, j) = R(i-1, j)
        If I(i, j) = 1 and I(i, j-1) = 1 and I(i-1, j) = 0, then set R(i, j) = R(i, j-1)
        If I(i, j) = 1 and I(i, j-1) = 1 and I(i-1, j) = 1, then set R(i, j) = R(i-1, j)
            If R(i, j-1) =/= R(i-1, j), then record R(i, j-1) and R(i-1, j) as equivalent (same color)
    Distinct integers or "colors" k are assigned to each blob

This results in a 2-dimensional array, the same size as the image, where the background pixels are assigned 0 in this R matrix, and each blob is assigned a new identifier (k = region number counter). Optionally, you can do a second pass mapping the region numbers from 1 to however many blobs you have. You might consider this because without it, your last blob may have a k value in the thousands. Not useful.

Depending on the domain and what you want out of your project, you may divest yourself from here on out. In my program, I calculated the center of each blob by averaging the minimum and maximum x and y coordinates (i and j indices) of each blob. I also calculated the size of each blob by counting the number of indices in the R matrix with the same k value. After that, I removed all blobs under size 15, and used the cv2 function putText to mark the center with an asterisk. Here is the final image:
The final image (also 128x128) with counted blobs and mostly correct centers. The dark blue numbers are the blob numbers, and the light purple numbers are the sizes for each blob.
I would like to point out that some of the marked centers are clearly wrong. Look at blob numbers 31, 8, 14, 33, and 51 for examples. I'm not sure why it's wrong. It's not the idea that the blobs are divided into several blobs, and its not that the blobs are being truncated in the R matrix. I fear that it has something to do with the center calculation. Which, to be honest, I'm not too worried about because the point of this project is blob coloring, not center marking. The centers are within the ballpark, but do indeed need optimization.