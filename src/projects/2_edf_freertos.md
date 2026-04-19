# Implementing EDF Scheduling in FreeRTOS

![A picture of a blue PCB with attached electrical components](/circuitry.png)

## Links: https://github.com/SeanPletan/freertos-pico-edf /blog/edf_scheduling_in_freertos

published: May 7, 2025
last edited: April 10, 2026

subheading: 

summary: One of the most widely used Real Time Operating Systems (RTOS) is called FreeRTOS. It is mainly used for scheduling tasks concurrently due to the lack of flexibility from its scheduler. If it were more flexible, and could ensure that tasks complete by a specified relative deadline, the RTOS could have more use cases. Thus, I implemented the Earliest Deadline First (EDF) scheduling algorithm in FreeRTOS. 


<!--BLOG SECTION BELOW-->

# 1. Introduction

One of the most widely used Real Time Operating Systems (RTOS) is called FreeRTOS. It is mainly used for scheduling tasks concurrently due to the lack of flexibility from its scheduler. If it were more flexible, and could ensure that tasks complete by a specified relative deadline, the RTOS could have more use cases. Thus, I implemented the Earliest Deadline First (EDF) scheduling algorithm within the user space of FreeRTOS. 

# 2. Background Information

The FreeRTOS default scheduler is a "preemptive, fixed-priority scheduler with round-robin time-slicing of equal priority tasks" [3]. Priorities of tasks are defined by the application designer, and have no built-in consideration of task (worst case) execution time. Nor does it have any built-in consideration of task deadlines. It does, however, implement Interrupt Service Routines (ISR), semaphores, direct to task notifications, software timers, and run time statistics.

Tasks are implemented as C functions. By default, each task executes independently, and has an associated Task Control Block (TCB). At each tick (a user defined time period, usually in the range of 10ms to 1 μs), the scheduler is invoked, and the task with the largest priority is invoked. If multiple tasks have the same priority, and the flag for using time slicing is enabled in FreeRTOSConfig.h (confUSE_TIME_SLICING), ready tasks will share the available processing time using a round robin scheduling scheme. 

As aforementioned, each task has an associated TCB. It contains information related to the task, which the scheduler uses: pcTaskName (char vector containing the task name), *pxStack (points the the beginning of the stack), *pxTopOfStack (points to the current top of the stack), *pxEndOfStack (points to the end of the stack, used for checking stack overflows), uxBasePriority (contains the previously assigned priority) and uxPriority (contains the task priority). Each task can be in one of 4 states: Running, Ready, Blocked, or Suspended. FreeRTOS has a list for every possible state, containing the tasks that are currently in those states.

When initializing a task, it goes through several main steps: memory space is allocated for a new TCB, the TCB is initialized, the stack is initialized, and finally the created task is added to the Ready list (FreeRTOS has a list within the Ready list for every possible priority. It will be added to the sublist). If the priority is higher than the currently running task (or tasks, if the flag for symmetric multiprocessing [SMP] is enabled), the currently running task is moved to the ready list, and the new task will be ran. This is a context switch.

During a context switch, tasks are immediately shut off, wherever they are in their program. This means that they must save their state in the stack.  This entails disabling the ISR, saving the contents of the registers in numerical order to the stack, and finally saving a pointer to the stack location for task resumption. A function is provided by FreeRTOS to restore the context of any task from its stack, using the pointer to its stack: portRESTORE_CONTEXT(). The port prefix denotes that it is architecture dependent, and is defined within the port directory of the kernel for a particular architecture.

# 3. EDF Schedule Implementation

Modifying the existing kernel in order to achieve this goal was considered. The added overhead of calling the preexisting API functions, and carving up the original kernel and using it in ways that it was not meant to be used was a big deterrent. However, I could not even begin to understand the complexities of the approximate 8600 lines of code in the tasks.c file, which is where the scheduler, tasks, task control block, and associated functions are defined. Therefore, the EDF schedule was implemented in user space. 

The program defines a data structure EDFTask_t to hold metadata for each task, such as its function pointer, handle, period, relative and absolute deadlines, and whether it is currently active. Four tasks (taskA, taskB, taskC, and taskD) are defined using a macro that simplifies their declaration and structure. Each of these tasks registers itself on execution, performs a matrix multiplication workload to consume CPU cycles for a specified time (during the inner loop of computation, it checks if the specified tick period has been reached. If it has, then the function returns.), then marks itself as inactive and deletes itself using vTaskDelete.

The central logic of EDF scheduling is implemented in the vApplicationTickHook() function, which is called on every system tick. Inside this function, the array of active EDF tasks is sorted using qsort() based on their absolute deadlines. The priority of every index is set to the maximum priority - the index. If (currentTick % period[i] == 0), the task is created again. This ensures that tasks have periodicity. If the task already exists, an error is thrown. Additionally, the tick hook throws an error if a deadline has been missed.

The main() function initializes the I/O and creates the four EDF tasks with initial parameters, including deadline and period values. After creating all tasks, it starts the FreeRTOS scheduler using vTaskStartScheduler(). 

However, the outside of the main program is extremely target-architecture dependent. In the root directory, there are 3 main folders: FreeRTOS-Kernel, blink, and pico-sdk. Within the blink folder exists a CMakeLists.txt file, FreeRTOSConfig.h file, a build folder, and the main.c file. CMake is used to compile the main.c program, along with the entire FreeRTOS Kernel and Raspberry Pi Pico C/C++ SDK.The resulting blink.uf2 file is then copied to the microprocessor, and the system automatically restarts and runs the program. All of this is done to test the program on a suitable microarchitecture. In order to get the text output of the program, a semihosting technique was used. Specifically, this is UART over USB debugging. I listened over the /dev/ttyACM0 port for the serial output using minicom. The following text block is part of the output from the described program.

```
Task taskA started at tick 0
Task taskA finished at tick 1
Task taskB started at tick 2
Task taskB finished at tick 3
Task taskC started at tick 4
Task taskC finished at tick 6
Task taskD started at tick 7
Task taskD finished at tick 11
Task taskA started at tick 18
Task taskA finished at tick 19
Task taskB started at tick 27
Task taskB finished at tick 28
Task taskC started at tick 34
Task taskC finished at tick 36
```

# 4. Conclusion

As I have explained, this implemented EDF scheduler within FreeRTOS is possible, and it does open up opportunities for time-constrained program design for embedded systems. However, it is very difficult to work with. All of the tasks must be defined within the DEFINE_EDF_TASK macro, and if the application designer wishes to differentiate tasks, they must include switch logic to switch between parts of the macro that defines the subsequent tasks. Clearly, intertask communication is impossible.  Additionally, there is no check within the program that ensures the CPU utilization is less than 1 (which ensures that the task set is schedulable) [2]. The program also assumes a uniprocessor system (or, at least, the configNUM_OF_CORES flag is set to 1).

# 5. References

[1] M. C. Marko Bertogna and G. Lipari, “Improved schedulability analysis of edf on multi-
processor platforms,” 17th Euromicro Conference on Real-Time Systems, 2005.
[2] Cheng, Albert M. K. “Scheduling Preemptable and Independent Tasks.” John Wiley & Sons, Inc., Hoboken, New Jersey, 2002.
[3] FreeRTOS.org. “FreeRTOS Documentation - FreertosTM.” FreeRTOS, Amazon Web Service, 2024, www.freertos.org/Documentation/00-Overview.
[4] Gross, Daniel. “Using FreeRTOS with the Raspberry Pi Pico.” Embedded Computing Design, OpenSystems Media, 19 Oct. 2022, embeddedcomputing.com/technology/open-source/linux-freertos-related/using-freertos-with-the-raspberry-pi-pico.
[5] K. Yu, Y. Yang, H. Xiao and J. Chen, "An Improved DVFS Algorithm for Energy-Efficient Real-time Task Scheduling," 2020 IEEE 22nd International Conference on High Performance Computing and Communications; IEEE 18th International Conference on Smart City; IEEE 6th International Conference on Data Science and Systems (HPCC/SmartCity/DSS), June 2020
[6] H. Aydin, R. Melhem, D. Mosse and P. Mejia-Alvarez, "Power-aware scheduling for periodic real-time tasks," in IEEE Transactions on Computers, vol. 53, no. 5, pp. 584-600, May 2004
[7] Kaushik Roy, Amit Agarwal, Chris H. Kim, "Circuit Techniques for Leakage Reduction,"
[8] Pillai Et. Al, "Real-Time Dynamic Voltage Scaling for Low-Power Embedded Operating Systems,"
[9] Karel De Vogeleer, Gerard Memmi, Pierre Jouvelot, Fabien Coelho, "The Energy/Frequency Convexity Rule: Modeling and Experimental Validation on Mobile Devices"
