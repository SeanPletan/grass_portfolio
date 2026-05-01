# ShiftSense: Creating a Gear Shift Optimization System for Manual Cars

![A picture of the ND Miata's shift knob and center console](/miata_knob.jpg)

## Links: https://github.com/SeanPletan/shiftsense /blog/shiftsense

published: December 9, 2025
last edited: April 10, 2026

subheading: The Mazda Miata's (ND) center console and shift knob.

summary: The project consists of a microcontroller interfacing with a vehicle using ISO 9141-2 (K-Line) to get certain parameters about the vehicle's status. These parameters (and accelerometer sensor data) is sent over cellular data to a server, where a machine learning model extracts usable information, and sends it back to the microcontroller once processed. The system then uses this data in its internal logic loop to provide shift behavior feedback to the user.

<!--BLOG SECTION BELOW-->


# 0: Introduction

When driving learners first encounter a vehicle equipped with a manual transmission, it takes quite a lot of getting used to. It took me about 2 weeks to not embarrass myself with mis-shifts, failed rolling starts, and stalling the engine. So, I set out to create a system that would quantify how well a person shifted in a manual car and give them feedback in real time. From my project proposal: "At a glance, the project will consist of a microcontroller interfacing with a [1999 Mazda Miata] using ISO 9141-2 to get certain parameters about the vehicle's status. These parameters (and inertial measurement unit sensor data) will be sent over cellular data to a server, where a machine learning model will extract usable information, and potential shift optimization techniques and send it back to the user in a reasonable amount of time".

The report is divided into two sections. First, I will explain the final product, including system design, metrics, circuit design, and usage. Next, there will be a lengthy section about the experience of developing this system (partly for my own records), including all of the hurdles I have had to overcome. Rather than mimicking a research-style paper, I have opted for a blog-style language. I hope this conveys a sense of personalness to this project. I really enjoyed working on it.

You can access the codebase using these github links: https://github.com/SeanPletan/shiftsense &  https://github.com/SeanPletan/shiftsense-server

</br>

# 1: System Design

![system architecture diagram for ShiftSense](/shiftsense_architecture.png)

## 1.1: Low Level Communication with the Raspberry PI

The first step in the process was acquiring data from the vehicle. My car uses the ISO 9141-2 Communication Standard, which was released in 1994. It's a precursor to the widely known and used CAN bus communication standard, which has been used widely in the USDM since 2008. ISO 9141-2 communicates only over a single wire, the K-Line. The communication protocol uses 3 (optionally 4) wires on the OBD2 port in total: +12V (pin 16), Signal GND (pin 5), K-Line (pin 7), and optionally the L-Line (pin 15). In order to communicate with the Raspberry Pi, I had to transform the voltage and amperage down from 12V to 3.3V (because that's what the headers have been made for). I used [MikroE's ISO 9141 Click Board](https://www.mikroe.com/iso-9141-click) for this. Essentially, it is a breakout board that utilizes [ST Microelectronic's L9637 integrated circuit](https://www.st.com/en/automotive-analog-and-power/l9637.html). So, at this point, I have wired the Raspberry Pi's UART pins to the MikroE board's UART pins, the Raspberry Pi's 3.3V and GND pins to the MikroE board's VSS pins, I have broken out an OBD2 cable, and have wired pins 16 to the MikroE boards 12V-45V screwdown terminal, pin 5 to the GND screwdown terminal, and pin 7 to the K-Line screw down terminal (my vehicle, the 1999 Mazda Miata does not utilize the L-Line). 

![a diagram showing the OBD2 connector pinout](/obd2_pinout.png)
The OBD2 connector pinout diagram.
</br>

![circuitry with raspberry pi](/shiftsense_circuitry_2.jpg)
![circuitry with mikroE breakout board and exposed obd2 connector cable](/shiftsense_circuitry_1.jpg)
Pictures showing the system wiring in the early stages of development. The small board on the outside of the RPi is MikroE's ISO 9141 Click Board.
</br>

ISO 9141-2 idles high (+12V) and has a 'slow baud initialization procedure', followed by several exchanges of bytes at 10.4 Kb/sec. Firstly, the tester must drive the line low via a starting bit 0, send the byte 0x33 at 5 bits/sec, and end by driving the line high with an ending bit 1.

From [Volkswagen Group of America](https://www.obdclearinghouse.com/Files/viewFile?fileID=1380), "The total transmit time for the address lasts for two seconds. After validation of the address internally in the vehicle ECU(s), which takes a time known as W1, which is between 20 and 300 ms long, the vehicle will respond with the synchronization byte 0x55 informing the tester of the new baud rate which should now be 10.4 kbps. The vehicle shall then wait a time known as W2, which is between 5 and 20 ms, for the tester to reconfigure to the new baud rate, and then the vehicle will send the two key bytes. These key bytes shall be either 08 08, or 94 94, separated by a time known as W3, which is between 0 and 20 ms, that describe to the tester the value of P2MIN to be used. As an acknowledgement of reception of the key bytes, the tester, after waiting a time known as W4, which is between 25 and 50 ms, shall then invert the key byte #2 and send it to the vehicle. After waiting another period equal to W4, the vehicle shall then invert the initialization address of 33 and send it to the tester as the “ready to communicate” signal. This ends the initialization sequence". I have had to implement this protocol in C using linux's serial write libraries

Because the Raspberry Pi uses the PL011 UART transceiver for bluetooth functionality, I was left with "mini" UART which had its timing CPU controlled. This was a huge issue, considering that messages would randomly be lost at 10.4Kb/sec because the timing was different than what the standard called for. I disabled bluetooth, and ensured that /dev/serial0 pointed to /dev/ttyAMA0 serial port (which is what the PL011 UART transceiver uses). Then, I could tackle the slow initialization procedure. I used bit banging with the pigpio C library (this took me 3 weeks to figure out). Once this was done, I had to set a custom baud rate (10.4 Kb/sec is not a predefined baud rate in <asm/termios.h>) using the <asm/ioctls.h>. After that, I could finally begin writing and reading to the serial port using Linux's predefined read() and write() functions. In my github repository, you can see the fruits of my labor in the files uart.c, uart.h, and the initialization() function in communication.c and communication.h.

## 1.2: Low Level Communication with the ECU

In my program, the most important function is sensor_loop(). When not sending data to the server, it queries and receives 3 [PIDs](https://en.wikipedia.org/wiki/OBD-II_PIDs#Standard_PIDs) from the ECU (rpm, vehicle speed [vss], and throttle position) at a rate of 3.21 to 3.34 Hz. This sample rate cannot be increased due to the limitations of ISO 9141-2: After every message received from the ECU, the tester must wait 55ms before sending another. Additionally, after every byte in a message, the tester must wait 5ms (there are 6 bytes in a message). A typical message to the ECU looks like this: 0x68 0x6A 0xF1 0x01 0x11 0xD5. In this message, the tester is querying Service Mode 01, PID 11. Service Mode 01 is a service mode that displays the current status of a PID, and PID 11 is the throttle position. So, the aforementioned message queries the current throttle position, described as a percentage. The last byte is a calculated checksum from all of the previous bytes.

So, sensor_loop() is the function that queries the ECU  for rpm, vss, and throttle at a rate of 3.21 to 3.34Hz. This happens in a while loop: writing 0x0C, 0x0D, or 0x11, waiting for a non-echo response (echoes are inherent of the single-wire design of the K-Line protocol. The signal bounces off the receiving node and back to the sender, after a short delay), extracting the responses data, and then looping back to send the next PID. In one of the videos I have provided, you can see the result of this labor: A looping digital dashboard that displays rpm, vehicle speed, throttle position, and the sampling rate.

![A picture showing proof of communication initialization](/shiftsense_init.png)

## 1.3: Server Design and Analysis

A lot of the design choices presented in this section were entirely due to it being 'easy' and/or I wanted to learn how to do it. I'm fully aware that it can be optimized greatly, but that's for another section. I had wanted to entirely self host a server for data analysis, so a quick google search yielded Apache HTTP Server and NGINX. I chose Apache HTTP Server because it went on the market first. That's it. In order to host a server on my desktop PC (AMD Radeon 9 5900X, NVIDIA RTX 3070, 32GB DDR5 RAM, Kubuntu 25.04 Plucky Puffin), I had to call my ISP and request port forwarding for my PC's ip address. Once that was complete, I bought the domain shiftsense.net, and added it to /etc/apache2/sites-enabled/shiftsense.conf, where I also enabled reverse proxy to 127.0.0.1:8000, where my uvicorn server is listening. I created 2 API endpoints using python's FastAPI: POST /api/telemetry_loop and  GET /api/results. /api/telemetry_loop is an endpoint that accepts the RPi's POST request that sends the measured sensor data once every loop (it also sends associated timestamps for each measurement because it is impossible to query the vehicles ECU for multiple PIDs in a single message), and then it is stored in the server directory under data.csv. /api/results is an endpoint that allows the RPi to GET the results of the data analysis, which will be described in the next section.

## 1.4: Data Analysis

The most important graph constructed from the acquired data was a pairwise relationship graph between vehicle speed and rpm. It shows quite a lot of information, and one can derive a lot of meaning from parts of it. For example,
1. Each gear band is roughly linear with an intercept of 0, with 1st gear having much more noise than any other gear. This is probably due to both increased gear lash and clutch feathering.

2. When shifting at a higher acceleration, the vertical line between gears is curved right more, and when shifting at a lower acceleration, it is vertical.

3. When shifting into a higher gear, sometimes the band drops below the gear band, and then goes back up into it. This is due to the clutch being engaged too late. The engine speed drops below the transmission speed, and the car jolts.

4. Additionally, when shifting into a higher gear, sometimes the line goes above the current gear and then drops down to the next gear. This is due to the throttle being non-zero when the clutch was disengaged. 

5. There is a vertical grouping from 800rpm to 1800rpm at 0mph. This is indicative of feathering the clutch and moving the car into 1st gear from a stop. The tighter this vertical band is, it is likely that the start has less jolt.

6. There is a horizontal grouping around 800rpm to 1200rpm at speeds of 0mph to 20mph. This indicates that the vehicle was in neutral, and was idling at speed. 

7. There are "stairs" in 2nd, 3rd, 4th, and 5th gears. This is wholly due to the ECU's precision when measuring speed.

![a pairwise relationship graph showing vss vs. engine speed.](/shiftsense_vss_rpm.png)

As for the purposes of detecting when a shift happened, and how "good" it is, further data analysis was warranted. The first obstacle was finding a line of best fit for each gear. I used an unsupervised ML technique called DBSCAN which clusters the data into shapes that can be irregular, but it requires ample space between clusters. This proved tricky at first, because all gears were "connected" at the bottom of the graph. My approach was quite naive, but it worked: I simply Min-Max scaled the data, cut off the first 40% of the rpm range, collected more data in higher rpm's, and fiddled with the hyperparameters. 

![2 graphs showing the DBSCAN ML technique, performed on the dataset, with different parameters](/shiftsense_dbscan.png)

Next, I trained a regular linear regression model on each of the clusters (I tried huber regression to weigh the outliers less, but the change was minimal). 

![a graph showing linear regression performed on the clustered dataset](/shiftsense_lin_reg.png)

In this scatter plot, it is much easier to see the noisiness of 1st and 2nd gear. If I wanted to detect when the rpm's of a vehicle had gone "out of bounds," I needed to define those bounds. So, I calculated the normal vector of the slope of each gear, and computed ∓1.5 standard deviations from the line of best fit. I chose 1.5σ because, assuming normal distribution (I did not check this), 1σ should be equal to 65% of all samples, and 2σ should be 95% of all samples. I felt that 95% favored outliers too much, so I compromised. These are the resulting graphs:

![scatterplot graph with +- sigma bands on clusters](/shiftsense_sigma_scatter.png)
![line graph with with +- sigma bands on clusters](/shiftsense_sigma_lines.png)

In /api/results, the Raspberry Pi GETs the resulting data from this data analysis. That is, it gets the number of gears, each gear's slope (in units of rpm gain per mph), each gear's intercept (always 0), and each gear's error bounds (calculated as 1.5σ).

## 1.5: Sending Data Back to the Raspberry Pi

So, I was looking at NB-IoT HATs for the Raspberry Pi and SIM cards that could be used on that network. All options cost more than $60, and it was already the beginning of November when I began considering this possibility. So, I opted to use a mobile hotspot from my phone. It does work, but it's not exactly what I set out to do. 

In order to get data back to the RPi, I simply executed a GET request to /api/results only when /api/telemetry_loop returned 201, rather than 200. In my server logic, this indicates that my subprocess graphs.py ran, and returned the resulting data from data analysis.

## 1.6: Shift Analysis

As aforementioned, I was unable to complete the analysis programming logic. This is wholly due to the time limits. I will explain what I will do after this semester ends and I have more time to work on it. So far, I have taken the naive approach: The vehicle is "shifting" if the current (vss,rpm) is out of bounds of any one gear. If the next gear is higher than the previous gear, you are upshifting. If, at any point in the history stack, the (vss, rpm) went below the bounds of the higher gear, the driver engaged the clutch too late. If, at any point in the history stack, the (vss, rpm) went above the bounds of the previous gear, the driver applied throttle while the clutch was disengaged.

However, I am not a fan of this approach. If you look again at the (vss,rpm) graph above, you'll notice how noisy 1st gear is. That wide bounding area, paired with the low sampling rate of 3.3Hz can allow the clutch to be disengaged for a brief moment while it is within the bounds of that gear. The best way to detect if the clutch is disengaged is with an accelerometer. If the throttle is 0, and you are decelerating at a slower rate than if the clutch was engaged, then the clutch is disengaged (the vehicle slows down faster in gear compared to out of gear). I had wired Adafruit's LSM6DS0X 6 degrees-of-freedom accelerometer and gyroscope to the pi, programmed it to log change in acceleration on the three axes from idle, and performed preliminary data analysis on it, but program logic refactoring is needed. Here are three time-series graphs of the different axes' acceleration, plotted against vehicle rpm. You'll notice no rhyme or reason to it. The peaks in acceleration between different axes do not line up. This is wholly due to the accelerometer being placed in an arbitrary angle in the vehicle, and then zero'ing the acceleration from there. I did not rotate the vector, I only scaled it down to 0 at idle. If I rotate the acceleration vector at idle such that y=9.86m/s/s (as compared to y and z being a non-zero number), I can get the acceleration of the vehicle in the x plane, when going forwards and backwards. With that data, I can go even further. I can compute the derivative of acceleration (this is called jolt) when a shifting event is detected, and then compute an arbitrary comfort metric from the amount of jolt. This would be in addition to the naive approach of saying, for example, "when shifting, if the (vss,rpm) go below the next gear, the driver engaged the clutch too late". 

</br>

# 2: Experience of Development

## 2.1: General Timeline

I first conceived this project in May of 2025, when dabbling with embedded systems and FreeRTOS. I was unable to work on it during the Summer due to familial commitments, but the Fall 2025 semester opened that up. Until in mid September, I was under the impression that all vehicles use the CAN bus protocol. That was very wrong, and I had wasted 3 weeks learning about CAN transceivers and ordering wrong electronics. Starting in mid September, I spent a week researching, and then I began the development of the lower level communication with the vehicle. I started with the slow baud initialization, which gave me incredible hardships. I spent 6 weeks unable to get a reply from my ECU, so I bought a $180 oscilloscope to diagnose it. On October 28th, I resolved it, and the hardest part of the project was over. During the second week of November, I had collected about 15,000 lines of data (about 40 minutes of city driving) from the vehicle, which I started data analysis on. During the third week of November, I wasted away at fiddling with the accelerometer because I didn't know what I was going to do with it (only the possibility of doing things with it). And during the first week of Decelmber, I did most of the data analysis, made the server, tested API endpoints, and crossed the finish line with proper shift analysis.

## 2.2: Miscellaneous Ramblings and Hurdles

ChatGPT was heavily used, but it was an extreme hindrance for implementing ISO 9141-2. I had to read a pirated version of the ISO 9141-2 standard in order to get the correct information. It was extremely counterproductive to anything related to the data analysis, as it would suggest solutions that were overly complicated and just didn't work. However, it was integral to figuring out why the UART communication didn't work on the CPU controlled "mini version", and for the conceptual system design.

AI disclosure: I only use the online version of ChatGPT, using the most basic model, without any system access, and using ephemeral chats only. I do that because I refuse to rely entirely on AI to think. I always vet every line of code. I recognize that it takes much longer compared to codex, but damn, I'll just work longer and harder. 

In the beginning, I knew that I needed an accelerometer, but as time went on, I was only concerned with just the next step. Somewhere this last month, it just fell by the wayside, and I didn't pay much mind to it. I wouldn't necessarily need all of the data structures for the naive approach if I had focused on determining vehicle status from the accelerometer as well. If I could do it all again, I'd write the accelerometer output to the c program (from the python program where the accelerometer logic is) and send it off to the server with the rest of the data. I'd also rotate the acceleration vector, as aforementioned.

As for the server, there are zero security measures taken. Barely any data cleaning, no whitelisting ip's, no HTTPS, no VPN, no measures against file access… Nothing. So, I'd really need to implement and fix all of that if I ever want to expand this project. 

The physical usage of the device in the vehicle is extremely substandard. Right now, I have the Raspberry Pi in the door handle, accelerometer taped to the door card, 7 inch HDMI display on my lap, wired keyboard on my lap, wireless mouse on the cupholder, all powered through a single micro-USB cable from the cigarette lighter. Waveshare sells these 2.1 inch round displays with RP2040 CPUs, UART communication, and I2C communication for about $30. That will fit in an A-pillar gauge pod, or inside an AC vent gauge pod. I could splice it into the wires going to the OBD2 port and transform the voltage down to 5V for the CPU, while keeping the 12V for the MikroE board. Companies sell CAN bus gauges for anywhere from $200 to $400. I think it might not be a bad business idea to get into that market. However, I couldn't charge for a device with cellular network connectivity. It may be better to program a mobile app that the Raspberry Pi sends data to over bluetooth.

![A picture showing the final setup of the project, in the car](/shiftsense_setup.jpg)

