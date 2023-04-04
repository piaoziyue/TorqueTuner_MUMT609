#ifndef __HAPTICS_H__
#define  __HAPTICS_H__

#include <stdint.h>
#include <functional>
#include <cmath>
#include <vector>
#include "tf_magnet.h"
#include "tf_click.h"
#include "tf_exp_spring.h"
#include "tf_sin.h"
#include "tf_click_2.h"
#include "Arduino.h"
#include "variants.h"

const int TABLE_RESOLUTION = 65535;
const int MAX_TORQUE = 180;
const int WALL_TORQUE = 180;
const float MAX_VELOCITY = 500;

class Mode
{
public:
    Mode( float scale_ = MAX_TORQUE / 2, int stretch_ = 1, float min_ = 0, float max_ = 3600, float damping_ = 0.0)
        : min(min_), max(max_), scale_default(scale_), stretch_default(stretch_), damping(damping_) 
        {
          #ifdef MOTEUS
          damping = 0.1;
          #endif
        };
    virtual int16_t calc(void* ptr) = 0;
    int16_t calc_index(void* ptr);
    void reset(int16_t angle_);

    float scale_default, stretch_default, min, max, damping, target_velocity_default;
    int offset = 0;

    bool wrap_output = false;
    bool wrap_haptics = false;
    char pid_mode = 't';
    char name = 'f';
    int idx = 0;
    int state = 0;
    

};

class Wall: public Mode
{
public:
    Wall() : Mode(MAX_TORQUE/2) {
        damping = 0.4;
        max = 3000;
        name = 'w';
    }
    int16_t calc(void* ptr);
    float stiffness = 0.1;
    float threshold = 1 / stiffness;
};

class Click: public Mode
{
public:
    Click() : Mode(MAX_TORQUE / 12.0, 5, 0, 3600)
    {
        #ifdef MOTEUS
        damping = 0.2;
        #endif
        offset = 1799;
        name = 'c';
        wrap_output = true;
        wrap_haptics = true;
    }
    int16_t calc(void* ptr);
};

class Magnet: public Mode
{
public:
    Magnet() : Mode() {
        damping = 0.08;
        name = 'm';
    }
    int16_t calc(void* ptr);
};

class Inertia: public Mode
{
public:
    Inertia() : Mode(MAX_TORQUE) {
        name = 'i';
    }
    int16_t calc(void* ptr);
    
};

class ExpSpring: public Mode
{
public:
    ExpSpring() : Mode(180, 1, 0, 3600, 0.1) {
        stretch_default  = 5;
        name = 'e';
    }
    int16_t calc(void* ptr);
};

class LinSpring: public Mode
{
public:
    LinSpring() : Mode(MAX_TORQUE, 1, 0, 3600) {
        wrap_output = true;
        wrap_haptics = false;
        name = 'l';
    }
    int16_t calc(void* ptr);
};

class Free: public Mode
{
public:
    Free() : Mode(0, 1) {
        target_velocity_default = 0;
        name = 'f';
    }
    int16_t calc(void* ptr);
};

class Spin: public Mode
{
public:
    Spin() : Mode(0, 1) {
        pid_mode = 'v';
        name = 's';
        wrap_output = true;
        target_velocity_default = 200;
    }
    int16_t calc(void* ptr);
};

class Teacher: public Mode
{
public:
    Teacher() : Mode(0,1) {
        target_velocity_default = 0;
    }
    int16_t calc(void* ptr);
};

class Student: public Mode
{
public:
    Student() : Mode(75,1) {
        target_velocity_default = 0;
    }
    int16_t calc(void* ptr);
};


class TorqueTuner
{
public:
    enum MODE {
        CLICK = 0,
        MAGNET = 1,
        WALL = 2,
        INERTIA = 3,
        LINSPRING = 4,
        EXPSPRING = 5,
        FREE = 6,
        SPIN = 7,
        TEACHER = 8,
        STUDENT = 9
    };
    const int trigger_interval = 50000;  // 10 ms

    TorqueTuner();

    void update();
    void update_angle();
    void update_trig();
    float calc_acceleration(float velocity_);
    float filter(float x);
    float gate(float val, float threshold, float floor);
    int32_t getTime();

    void set_mode(MODE mode_);
    void set_mode(int mode_idx);
    void set_demo(bool demo_);
    void print_mode(MODE mode_);
    void set_defaults(Mode * mode);
    void set_stretch(float stretch_);
    void reset(Mode * mode_);
    void reset_scores();
    void compute_scores();
    int16_t relative_angle();

    MODE mode = WALL;
    
    int t_angles_MAX_SIZE = 3;
    // angles are relative to starting position (knob.start_angle) cf Student::calc
    int16_t t_angles[3] = {0,0,0}; //Hard coded as 3 for now, should be able to set the state dynamically (up down buttons?)
    int16_t start_angle = 0; // angle at last mode set, allows relative position from start of mode
    int16_t angle = 0; // unwrap_outputped angle representing encoder reading
    int16_t angle_last = 0;
    int32_t angle_out = 0;
    int32_t angle_out_last = 0;
    int16_t wrap_count = 0;
    int16_t angle_delta = 0;
    int16_t angle_unclipped = 0;
    int16_t angle_discrete = 0; // angle output value syncronized via libmapper
    int16_t angle_discrete_last = 0;
    int16_t torque = 0;
    int trigger = -1;
    int num_modes = 0;
    int select_angle = 0;
    int t_angles_index = 0;
    float velocity = 0;
    float velocity_out = 0;
    float target_velocity = 0; // [-500;500]
    float acceleration = 0; // [-100;100]
    float scale = 75.0;
    float stretch = 1; // Corresponds to detents in click and magnet mode.
    bool rising_index = false; // for back_forth
    // DEMOSTRATION
    bool demo = false; // 
    int demo_time_count = 0; // the timer in demostration since start
    int demo_index = 0; // is demostrating the ith angle, [0, t_angles_MAX_SIZE-1]
    int demo_pointer = 0;

	bool demo_pause = false;
	int demo_pause_time = 0;
	int demo_pause_time_sum = 30;
    // PERFORMANCE
    int16_t performed_angles[3] = {0,0,0}; //also hard coded as 3 for now
    int16_t width = 600; // distance from target to max torque, higher is harder
	float max_torque = 30.0; // higher is easier
    // SCORE
    int score = 0; 
    int max_score = 1000;
    float overshot_count = 0;
    int time_count = 0;
    int overshot_tolerance = 1000; 
    int time_tolerance = 30000; // in loops, not real time
    int precision_tolerance = 10; // degrees in each direction
    int overshot_score = 0;
    int time_score = 0;
    int precision_score = 0;
    bool timer_on = false; // only start counting time when movement begins


    Click click;
    Magnet magnet;
    Wall wall;
    LinSpring lin_spring;
    ExpSpring exp_spring;
    Free free;
    Inertia inertia;
    Spin spin;
    Teacher teacher;
    Student student;
    std::vector<Mode * > mode_list = {&click, &magnet, &wall, &inertia, &lin_spring, &exp_spring,  &free, &spin, &teacher, &student};
    Mode * active_mode;

private:
    // Filter variables
    float a[3] = {1.0000,   -1.3329,    0.5053};
    float b[3] = { 0.0431,    0.0862,    0.0431};
};

int zero_crossing(int in);


inline int mod(int in, int hi) {
    const int lo = 0;
    if (in >= hi) {
        in -= hi;
        if (in < hi) {
            return in;
        }
    } else if (in < lo) {
        in += hi;
        if (in >= lo) {
            return in;
        }
    } else {
        return in;
    }
    if (hi == lo) {
        return lo;
    }
    int c;
    c = in % hi;
    if (c < 0) {
        c += hi;
    }
    return c;
}

inline int fold(int in, int lo, int hi) {
    int b = hi - lo;
    int b2 = b + b;
    int c = mod(in - lo, b2);
    if (c > b)
        c = b2 - c;
    return c + lo;
}

inline int clip(int in, int lo, int hi) {
    if (in > hi) {
        return hi;
    } else if (in < lo) {
        return lo;
    } else {
        return in;
    }
}

inline int sign(float x) {
    return (x < 0) ? -1 : (x > 0);
}


#endif
