import random

def generate_random_sequence():
    return ''.join(random.sample('123', 3))

def generate_user_id():
    return str(random.randint(1000, 9999))

def generate_linear_spring_sequence():
    return generate_random_sequence()

def generate_pitch_sequence():
    return generate_random_sequence()

def generate_non_ff_sequence():
    return generate_random_sequence()

def generate_click_sequence():
    return generate_random_sequence()

if __name__ == "__main__":
    user_id = generate_user_id()
    linear_spring_sequence = generate_linear_spring_sequence()
    pitch_sequence = generate_pitch_sequence()
    non_ff_sequence = generate_non_ff_sequence()
    click_sequence = generate_click_sequence()

    print("User ID:", user_id)
    # print("Force feedback Sequence (1-linear spring; 2-non, 3-click):", linear_spring_sequence)
    # print("Pitch Sequence for L (1-E2, 2-C3, 3-G3):", pitch_sequence)
    # print("Non FF Sequence (1-light, 2-dou, 3-rou):", non_ff_sequence)
    # print("Click Sequence (1-light, 2-dou, 3-rou):", click_sequence)
