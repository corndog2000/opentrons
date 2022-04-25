from opentrons.hardware_control.types import OT3AxisKind

ot3_dummy_settings = {
    "name": "Marie Curie",
    "model": "OT-3 Standard",
    "version": 1,
    "motion_settings": {
        "acceleration": {
            "none": {
                OT3AxisKind.X: 3,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 15,
                OT3AxisKind.P: 2,
            },
            "low_throughput": {
                OT3AxisKind.X: 3,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 15,
                OT3AxisKind.P: 15,
            },
            "high_throughput": {
                OT3AxisKind.X: 3,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 15,
                OT3AxisKind.P: 15,
            },
            "two_low_throughput": {OT3AxisKind.X: 1.1, OT3AxisKind.Y: 2.2},
            "gripper": {
                OT3AxisKind.Z: 2.8,
            },
        },
        "default_max_speed": {
            "none": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 4,
            },
            "low_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 4,
            },
            "high_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 4,
            },
            "two_low_throughput": {
                OT3AxisKind.X: 4,
                OT3AxisKind.Y: 3,
                OT3AxisKind.Z: 2,
                OT3AxisKind.P: 1,
            },
            "gripper": {OT3AxisKind.Z: 2.8},
        },
        "max_speed_discontinuity": {
            "none": {
                OT3AxisKind.X: 10,
                OT3AxisKind.Y: 20,
                OT3AxisKind.Z: 30,
                OT3AxisKind.P: 40,
            },
            "low_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 6,
            },
            "high_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 6,
            },
            "two_low_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 6,
            },
            "gripper": {OT3AxisKind.Z: 2.8},
        },
        "direction_change_speed_discontinuity": {
            "none": {
                OT3AxisKind.X: 5,
                OT3AxisKind.Y: 10,
                OT3AxisKind.Z: 15,
                OT3AxisKind.P: 20,
            },
            "low_throughput": {
                OT3AxisKind.X: 0.8,
                OT3AxisKind.Y: 1,
                OT3AxisKind.Z: 2,
                OT3AxisKind.P: 4,
            },
            "high_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 6,
            },
            "two_low_throughput": {
                OT3AxisKind.X: 0.5,
                OT3AxisKind.Y: 1,
                OT3AxisKind.Z: 1.5,
                OT3AxisKind.P: 3,
            },
            "gripper": {OT3AxisKind.Z: 2.8},
        },
    },
    "current_settings": {
        "hold_current": {
            "none": {
                OT3AxisKind.X: 0.7,
                OT3AxisKind.Y: 0.7,
                OT3AxisKind.Z: 0.7,
                OT3AxisKind.P: 0.8,
            },
            "low_throughput": {
                OT3AxisKind.X: 0.7,
                OT3AxisKind.Y: 0.7,
                OT3AxisKind.Z: 0.7,
                OT3AxisKind.P: 0.8,
            },
            "high_throughput": {
                OT3AxisKind.X: 0.7,
                OT3AxisKind.Y: 0.7,
                OT3AxisKind.Z: 0.7,
                OT3AxisKind.P: 0.8,
            },
            "two_low_throughput": {
                OT3AxisKind.X: 0.7,
                OT3AxisKind.Y: 0.7,
            },
            "gripper": {
                OT3AxisKind.Z: 0.7,
            },
        },
        "run_current": {
            "none": {
                OT3AxisKind.X: 7.0,
                OT3AxisKind.Y: 7.0,
                OT3AxisKind.Z: 7.0,
                OT3AxisKind.P: 5.0,
            },
            "low_throughput": {
                OT3AxisKind.X: 1,
                OT3AxisKind.Y: 2,
                OT3AxisKind.Z: 3,
                OT3AxisKind.P: 4.0,
            },
            "high_throughput": {
                OT3AxisKind.X: 0.2,
                OT3AxisKind.Y: 0.5,
                OT3AxisKind.Z: 0.4,
                OT3AxisKind.P: 2.0,
            },
            "two_low_throughput": {
                OT3AxisKind.X: 9,
                OT3AxisKind.Y: 0.1,
            },
            "gripper": {
                OT3AxisKind.Z: 10,
            },
        },
    },
    "log_level": "NADA",
    "z_retract_distance": 10,
    "deck_transform": [[-0.5, 0, 1], [0.1, -2, 4], [0, 0, -1]],
    "carriage_offset": (1, 2, 3),
    "right_mount_offset": (3, 2, 1),
    "left_mount_offset": (2, 2, 2),
    "gripper_mount_offset": (1, 1, 1),
    "calibration": {
        "z_offset": {
            "point": (1, 2, 3),
            "pass_settings": {
                "prep_distance_mm": 1,
                "max_overrun_distance_mm": 2,
                "speed_mm_per_s": 3,
            },
        },
        "edge_sense": {
            "plus_x_pos": (4, 5, 6),
            "plus_y_pos": (7, 8, 9),
            "minus_x_pos": (10, 11, 12),
            "minus_y_pos": (13, 14, 15),
            "overrun_tolerance_mm": 16,
            "early_sense_tolerance_mm": 17,
            "pass_settings": {
                "prep_distance_mm": 4,
                "max_overrun_distance_mm": 5,
                "speed_mm_per_s": 6,
            },
            "search_initial_tolerance_mm": 18,
            "search_iteration_limit": 3,
        },
    },
}
