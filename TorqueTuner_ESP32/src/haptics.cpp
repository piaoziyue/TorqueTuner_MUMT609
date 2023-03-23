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
	if (active_mode == &wall) {
		torque = static_cast<int16_t>(active_mode->calc(this));
	} 
	else {
		torque = static_cast<int16_t>(active_mode->calc(this) - active_mode->damping * velocity);
		// if(torque != 0) 
		// printf("%d", torque);
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
	case WALL:
		printf("Wall\n");
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

int16_t Wall::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = 0;
	float delta_angle_min = (knob->angle_unclipped - min) / 10.0;
	if (delta_angle_min < 0 && delta_angle_min > - threshold) {
		val = WALL_TORQUE * stiffness * abs(delta_angle_min) - damping * knob->velocity;
	} else {
		float delta_angle_max = (knob->angle_unclipped - max) / 10.0;
		if (delta_angle_max > 0 && delta_angle_max < threshold) {
			val = -WALL_TORQUE * stiffness * abs(delta_angle_max) - damping * knob->velocity;
		}
	}
	return static_cast<int16_t> (round(val));
};

int16_t Click::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val;
	if (knob->angle_out <= min) {
		val = WALL_TORQUE;
	} else if (knob->angle_out >= max) {
		val = -WALL_TORQUE;
	} else {
		val = static_cast<float>((tf_click[idx])) / TABLE_RESOLUTION * knob->scale;
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

int16_t LinSpring::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = - (knob->angle_out - 1800) / 1800.0;
	if (knob->angle_unclipped <= min) {
		val = 1;
	} else if (knob->angle_unclipped >= max) {
		val = -1;
	}
	val *= knob->scale;
	return static_cast<int16_t> (round(val));
};

int16_t ExpSpring::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	float val = static_cast<float>(tf_exp_spring[idx]) / TABLE_RESOLUTION;

	if (knob->angle_unclipped <= min) {
		val = 1;
	} else if (knob->angle_unclipped >= max) {
		val = -1;
	}

	val *= knob->scale;
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

int16_t Teacher::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*) ptr;
	// printf("index %d angle %d\n",knob->t_angles_index,knob->relative_angle());
	return knob->scale;
};



int16_t Student::calc(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;
	if (knob->demo_time_count == 0) knob->set_demo(true);
	
	if (!knob->timer_on && abs(knob->angle-knob->start_angle)>50) knob->timer_on = true; // only start counting time when enough movement happened

	// find absolute target angle
	int16_t relative_target = knob->t_angles[knob->t_angles_index];
	int16_t absolute_target = mod(knob->start_angle + relative_target*10, 3600);

	// should the resistance happen to the right or the left of the target?
	int16_t previous_angle = 0;
	if (knob->t_angles_index>0) previous_angle = knob->t_angles[knob->t_angles_index-1];
	bool is_left = relative_target - previous_angle < 0;
	int direction_modifier = is_left ? 1 : -1;

	// unidirectional bounded linear spring, could be nonlinear 
	int16_t torque = 0;
	int16_t diff = 0;

	// demostration settings
	int angle_list[knob->t_angles_MAX_SIZE] = {0};
	int angle_dir_list[knob->t_angles_MAX_SIZE] = {0}; 
	int time_sum = 0;

	// --------1. calculate the angle and its direction turning in ith demostration-----//
	// angle_list[i] is the angle in ith demostration
	// angle_dir_list[i] is the direction of the angle in ith demostration
	// angle_list[0] and angle_dir_list[0] are always 0
	
	for (int i = 0; i<=knob->t_angles_MAX_SIZE; i++) {
		if(i == 0) angle_list[i] = 0;
		else if (i == 1) angle_list[i] = knob->t_angles[i-1];
		else angle_list[i] = knob->t_angles[i-1] - knob->t_angles[i-2];

		if (angle_list[i] < 0) angle_dir_list[i] = -1;
		else if (angle_list[i] > 0) angle_dir_list[i] = 1;
		else angle_dir_list[i] = 0;

		angle_list[i] = abs(angle_list[i]);

		time_sum += angle_list[i];
	}
	
	// -------2. start the demostration----------//
	if (knob->demo == true & knob->demo_time_count < time_sum+20) {
		// reset the angle anagle, so the the relative angle is 0
		if(knob->demo_time_count == 0) knob->start_angle = knob->angle;
		
		// printf("now angle %d\n",  knob->relative_angle());
		// printf("demo: %d, time %d and sum%d\n",knob->demo_pointer, knob->demo_time_count, time_sum);
		// printf("now angle %d, aim angle %d\n", knob->relative_angle(), angle_list[knob->demo_pointer]);
		

		// judge if it is pausing time or turning time
		//----------------2.1 pausing time----------------//
		if(knob->demo_pause == true || knob->demo_pointer == 0){
		// 	if (knob->demo_pause_time < knob->demo_pause_time_sum) {
		// 		knob->demo_pause_time++;
		// 		torque = 0;
		// 	} else {
		// 		knob->demo_pause = false;
		// 		knob->demo_pause_time = 0;
		// 	}
		// 	printf("pause? %d, demo pause time %d\n\n", knob->demo_pause, knob->demo_pause_time);
		
		}
		//----------------2.2 turning time----------------//
		else {
			// the "knob->demo_pointer"th angle's demostration
			if (knob->demo_time_count < angle_list[knob->demo_pointer] ||
			knob->relative_angle() <= angle_list[knob->demo_pointer]) {

				knob->demo_time_count += 1;
				torque = angle_dir_list[knob->demo_pointer]  * 5;
				// printf("initial torque: %d\n", torque);
				
			}
			// trun into the next angle's demostration
			else{
				
				if(knob->demo_pointer < knob->t_angles_MAX_SIZE) {
					knob->demo_pointer += 1;
					// knob->demo_pause = true;
				}
				knob->start_angle = knob->angle;
			}

		}
		
	} 
	//---------------3. end the demostration and start student performance-----------------//
	else  {
		knob->set_demo(false);
		if (knob->t_angles_index >= knob->t_angles_MAX_SIZE) {
			knob->demo = false;
			knob->demo_index = 0;
			torque = 0;
		}
		torque = 0;
		diff = mod(direction_modifier * (absolute_target-knob->angle),3600);

		if (diff < knob->width && diff > 0){ // within resistance range
			torque = direction_modifier * knob->max_torque * diff / knob->width;
			knob->overshot_count += diff / 1000.0; 
		}
	}
	

	// printf("start %d | absolute target: %d | current: %d | diff: %d | torque: %d | index: %d | targets: %d %d %d | angles: %d %d %d\n",knob->start_angle,absolute_target,knob->angle,diff,torque,knob->t_angles_index,knob->t_angles[0],knob->t_angles[1],knob->t_angles[2],knob->performed_angles[0],knob->performed_angles[1],knob->performed_angles[2]);
	// printf("overshot %f raw %f | time %f raw %f | precision %f raw %f | score %f ready %d\n",knob->overshot_score,knob->overshot_score/knob->overshot_weight,knob->time_score,knob->time_score/knob->time_weight,knob->precision_score,knob->precision_score/knob->precision_weight,knob->score,knob->score_ready);

	if (knob->timer_on){
		knob->time_count ++;
		// printf("%d\n",knob->time_count);
	} 
	
	return torque;
}

// bonus messing around function
int16_t back_forth(void* ptr) {
	TorqueTuner* knob = (TorqueTuner*)ptr;

	int extremum = 5000;

	if (knob->rising_index){
		knob->t_angles_index -= 1;
		if (knob->t_angles_index<=-extremum){
			knob->rising_index = false;
		}
	}
	else {
		knob->t_angles_index += 1;
		if (knob->t_angles_index>=extremum){
			knob->rising_index = true;
		}
	}
	
	return knob->t_angles_index/100.0;
}

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





// Hybrid mode - under construction
