#include "haptics.h"


TorqueTuner::TorqueTuner() {
	// active_mode = mode_list[0];
	num_modes = mode_list.size();


};

void TorqueTuner::update() {

	update_angle();

	// Filter and gate velocity for output
	velocity_out = gate(filter(velocity), 5, 0);
	calc_acceleration(velocity_out);

	// Calculate index to transfer function
	active_mode->calc_index(this);

	// Calculate trigger and discrete output
	float resolution = active_mode->max / stretch;

	angle_discrete = round(round(angle_out / resolution) * resolution);
	if (abs(angle_discrete - angle_discrete_last) >= resolution) {
		update_trig();
		angle_discrete_last = angle_discrete;
	};
	if (active_mode == &noresist) {
		torque = static_cast<int16_t>(active_mode->calc(this));
	} 
	else {
		torque = static_cast<int16_t>(active_mode->calc(this) - active_mode->damping * velocity);
	}
};

void TorqueTuner::update_angle() {

	// Wrap angle
	angle_delta = angle - angle_last;
	if ((angle_delta) < -1800) {
		wrap_count += 1;
		angle_delta += 3600;
	} else if ((angle_delta) > 1800) {
		wrap_count -= 1;
		angle_delta -= 3600;
	};
	angle_last = angle;

	angle_unclipped += angle_delta;

	// Clip with parameter range
	angle_out += angle_delta;
	if (active_mode->wrap_output) {
		angle_out = mod(angle_out, 3600); // CHANGE to min, max
	} else {
		angle_out = static_cast<int32_t>(clip(angle_out, active_mode->min, active_mode->max));
	}

};


void TorqueTuner::set_mode(int mode_idx) {
	
	if (active_mode != mode_list[mode_idx]) {
		active_mode = mode_list[mode_idx];
		active_mode->reset(angle);
		angle_last = angle;
		torque = 0;
		angle_out = 0;
		angle_unclipped = 0;
		start_angle = angle; // initialize start_angle
		t_angles_index = 0;
		reset_scores();
		set_defaults(active_mode);
		
		// Init discrete angle
		// float resolution = active_mode->max / stretch;
		// angle_discrete = floor(floor(angle_out / resolution) * resolution);
		print_mode(static_cast<MODE>(mode_idx));
	}
};


void TorqueTuner::set_mode(MODE mode_) {
	int mode_idx = static_cast<int>(mode_);
	set_mode(mode_idx);
};

void TorqueTuner::set_demo(bool demo_) {
	demo = demo_;
};

void TorqueTuner::set_stretch(float stretch_) {
	if (abs(stretch_ - stretch) > 0.1) {
		stretch = stretch_;
	}
};

void TorqueTuner::set_defaults(Mode * mode) {
	scale = mode->scale_default;
	stretch = mode->stretch_default;
	target_velocity = mode->target_velocity_default;
}

void TorqueTuner::print_mode(MODE mode_) {
	printf("Switched mode to : \n");
	switch (mode_) {
	case CLICK:
		printf("Click \n");
		break;
	case INERTIA:
		printf("Inertia\n");
		break;
	case NORESIST:
		printf("NORESIST\n");
		break;
	case MAGNET:
		printf("Magnet\n");
		break;
	case LINSPRING:
		printf("Linear Spring \n");
		break;
	case EXPSPRING:
		printf("Exponential Spring \n");
		break;
	case FREE:
		printf("Free\n");
		break;
	case SPIN:
		printf("Spin \n");
		break;
	case VIBRATE:
		printf("Vibrate \n");
		break;
	}
};

float TorqueTuner::calc_acceleration(float velocity_) {
	static float last = 0;
	acceleration = last - velocity_;
	last = velocity_;
	return acceleration;
};

float TorqueTuner::filter(float x) {
	// Cannonical form - https://ccrma.stanford.edu/~jos/filters/Direct_Form_II.html
	// w[n] = x[n] - a1*w[n-1] - a2*w[n-2]
	// y[n] = b0*w[n] + b1*w[n-1] + b2*w[n-2]
	static float w[3];
	w[0] = x - a[1] * w[1] - a[2] * w[2];
	x = b[0] * w[0] + b[1] * w[1] + b[2] * w[2];
	w[2] = w[1];
	w[1] = w[0];
	return x;
};


float TorqueTuner::gate(float val, float threshold, float floor) {
	return abs(val) > threshold ? val : floor;
};

void TorqueTuner::update_trig() {
	trigger++;
	trigger = fold(trigger, 0, 1);
};

int32_t TorqueTuner::getTime() {
	return esp_timer_get_time();
}

int16_t Noresist::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = 0;
	return static_cast<int16_t> (round(val));
};

int16_t Vibrate::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = 0;
	float delta_angle_min = (knob->angle_unclipped - min) / 10.0;
	if (knob->angle_delta != 0 && knob->velocity_out !=0){
		if (delta_angle_min < 0 && delta_angle_min > - threshold) {
			val = WALL_TORQUE * stiffness * abs(delta_angle_min) - damping * knob->velocity;
		} else {
			float delta_angle_max = (knob->angle_unclipped - max) / 10.0;
			if (delta_angle_max > 0 && delta_angle_max < threshold) {
				val = -WALL_TORQUE * stiffness * abs(delta_angle_max) - damping * knob->velocity;
			}
		}
	}
	return static_cast<int16_t> (round(val));
};

int16_t Click::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val=0;
	if (knob->angle_out != 0 && knob->velocity_out !=0){
		if (knob->angle_out <= min) {
			val = WALL_TORQUE ;
		} else if (knob->angle_out >= max) {
			val = -WALL_TORQUE ;
		} else {
			val = static_cast<float>((tf_click[idx])) / TABLE_RESOLUTION * knob->scale * 1.28; // * 1.25;
		}
	}
	return static_cast<int16_t> (round(val));
};

int16_t Magnet::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	return static_cast<float>(tf_magnet[idx]) / TABLE_RESOLUTION * knob->scale; // Magnet
};

int16_t Inertia::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	if (knob->velocity > 0) {
		return round((- (knob->angle_out / 3600.0) * knob->velocity) * knob->scale / MAX_VELOCITY);
	} else {
		return 0;
	}
};

void LinSpring::setScaleFac(float newScaleFac) {
    scale_fac = newScaleFac;
}

int16_t LinSpring::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = 0 ;
	if (knob->angle_out != 0 && knob->velocity_out !=0){
		val = - (knob->angle_out) / 1800.0; //-(knob->angle_out - 1800) / 1800.0;
		if (knob->angle_unclipped <= min) {
			val = 0.1;
		} else if (knob->angle_unclipped >= max) {
			val = -1;
		}
		val *= knob->scale/scale_fac;
		// printf("scaf %f /n ", scale_fac);
		// printf("val %f  velocity % f  knob.angle %f\n", val, knob->velocity_out, knob->angle_unclipped);
	}else val = 0;
	
	return static_cast<int16_t> (round(val));
};

int16_t ExpSpring::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = 0;
	if (knob->angle_delta != 0 && knob->velocity_out !=0){
		val = static_cast<float>(tf_exp_spring[idx]) / TABLE_RESOLUTION;
		if (knob->angle_unclipped <= min) {
			val = 1;
		} else if (knob->angle_unclipped >= max) {
			val = -1;
		}
		val *= knob->scale;
	}

	return static_cast<int16_t> (round(val));
};


int16_t Free::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	return knob->scale;
};

int16_t Spin::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	// printf("target velocity: %d\n", knob->target_velocity);
	return knob->target_velocity;
};


// Calculates an index for the look-up table based transfer functions
int16_t Mode::calc_index(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;

	state += static_cast<int16_t> (round(knob->angle_delta * knob->stretch));
	if (wrap_haptics)
	{
		idx = mod(state, 3600);
	} else {
		idx = clip(state, 0,  3600);
	}
	return idx;

};

void TorqueTuner::reset_scores(){
	overshot_score = 0;
	time_score = 0;
	precision_score = 0;
	timer_on = false;
}

void TorqueTuner::compute_scores(){
	// overshot
	if (overshot_count>overshot_tolerance) overshot_score = 0; // no points if above threshold
	else overshot_score = static_cast<int>((overshot_tolerance-overshot_count)*max_score/overshot_tolerance);
	// time
	if (time_count>time_tolerance) time_score = 0; // no points if above threshold
	else time_score = static_cast<int>((time_tolerance-time_count)*max_score/time_tolerance);
	// overall
	score = overshot_score + time_score + precision_score;
}

int16_t TorqueTuner::relative_angle(){
	return mod(angle - start_angle + 1800, 3600)/10 - 180;
}

void Mode::reset(int16_t angle_) {
	idx = offset; // apply mode specific offset to idx
	state = 0;
};