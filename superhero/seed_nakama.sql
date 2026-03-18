-- Boksimoron Hafta 5 Gün 1 loglarını sil
DELETE FROM workout_logs
WHERE username = 'boksimoron'
  AND week_no = 5
  AND workout_code = '1';

-- Nakama programı seed (upsert)
INSERT INTO programs (username, status, setup_data)
VALUES (
  'nakama',
  'active',
  '{
    "createdAt": "2026-03-16T00:00:00.000Z",
    "selections": [
      {"slotCode":"G1_1","dayCode":"1","family":"chest_press",    "selectedExercise":"Dumbbell Chest Press",       "inputWeight":5,   "inputReps":12, "initialWorkingWeight":5},
      {"slotCode":"G1_2","dayCode":"1","family":"shoulder_press", "selectedExercise":"Dumbbell Shoulder Press",    "inputWeight":5,   "inputReps":10, "initialWorkingWeight":2.5},
      {"slotCode":"G1_3","dayCode":"1","family":"hinge",          "selectedExercise":"Dumbbell Romanian Deadlift", "inputWeight":5,   "inputReps":12, "initialWorkingWeight":2.5},
      {"slotCode":"G1_4","dayCode":"1","family":"vertical_pull",  "selectedExercise":"Lat Pulldown",               "inputWeight":25,  "inputReps":10, "initialWorkingWeight":17.5},
      {"slotCode":"G1_5","dayCode":"1","family":"leg_accessory",  "selectedExercise":"Leg Extension",              "inputWeight":15,  "inputReps":10, "initialWorkingWeight":10},
      {"slotCode":"G1_6","dayCode":"1","family":"abs",            "selectedExercise":"Crunch",                     "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},

      {"slotCode":"G2_1","dayCode":"2","family":"squat",          "selectedExercise":"Squat",                      "inputWeight":3,   "inputReps":10, "initialWorkingWeight":2.5},
      {"slotCode":"G2_2","dayCode":"2","family":"chest_press",    "selectedExercise":"Dumbbell Chest Press",       "inputWeight":6,   "inputReps":10, "initialWorkingWeight":5},
      {"slotCode":"G2_3","dayCode":"2","family":"vertical_pull",  "selectedExercise":"Assisted Pull Ups",          "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},
      {"slotCode":"G2_4","dayCode":"2","family":"lateral_raise",  "selectedExercise":"Lateral Raises",             "inputWeight":2.5, "inputReps":12, "initialWorkingWeight":2.5},
      {"slotCode":"G2_5","dayCode":"2","family":"biceps",         "selectedExercise":"Dumbbell Curl",              "inputWeight":5,   "inputReps":10, "initialWorkingWeight":5},
      {"slotCode":"G2_6","dayCode":"2","family":"abs",            "selectedExercise":"Leg Raises",                 "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},

      {"slotCode":"G3_1","dayCode":"3","family":"shoulder_press", "selectedExercise":"Dumbbell Shoulder Press",    "inputWeight":5,   "inputReps":10, "initialWorkingWeight":5},
      {"slotCode":"G3_2","dayCode":"3","family":"squat",          "selectedExercise":"Squat",                      "inputWeight":3,   "inputReps":10, "initialWorkingWeight":2.5},
      {"slotCode":"G3_3","dayCode":"3","family":"row",            "selectedExercise":"Barbell Row",                "inputWeight":20,  "inputReps":12, "initialWorkingWeight":15},
      {"slotCode":"G3_4","dayCode":"3","family":"chest_fly",      "selectedExercise":"Dumbbell Chest Fly",         "inputWeight":2.5, "inputReps":10, "initialWorkingWeight":2.5},
      {"slotCode":"G3_5","dayCode":"3","family":"triceps",        "selectedExercise":"Cable Pushdown",             "inputWeight":15,  "inputReps":12, "initialWorkingWeight":12.5},
      {"slotCode":"G3_6","dayCode":"3","family":"abs",            "selectedExercise":"Plank",                      "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},

      {"slotCode":"D1_1","dayCode":"D1","family":"squat",         "selectedExercise":"Squat",                      "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},
      {"slotCode":"D1_2","dayCode":"D1","family":"chest_press",   "selectedExercise":"Dumbbell Chest Press",       "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},
      {"slotCode":"D1_3","dayCode":"D1","family":"vertical_pull", "selectedExercise":"Assisted Pull Ups",          "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},
      {"slotCode":"D2_1","dayCode":"D2","family":"shoulder_press","selectedExercise":"Dumbbell Shoulder Press",    "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},
      {"slotCode":"D2_2","dayCode":"D2","family":"hinge",         "selectedExercise":"Dumbbell Romanian Deadlift", "inputWeight":null,"inputReps":null,"initialWorkingWeight":null},
      {"slotCode":"D2_3","dayCode":"D2","family":"row",           "selectedExercise":"Barbell Row",                "inputWeight":null,"inputReps":null,"initialWorkingWeight":null}
    ]
  }'
)
ON CONFLICT (username) DO UPDATE
  SET status     = EXCLUDED.status,
      setup_data = EXCLUDED.setup_data;

-- Nakama mevcut logları temizle (fresh seed)
DELETE FROM workout_logs WHERE username = 'nakama';

-- ─────────────────────────────────────────────
-- HAFTA 1
-- ─────────────────────────────────────────────

-- Hafta 1 / Gün A (workout_code='1') — 2026-01-20
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 1, '1', 'G1_1', '[10,12,12,12]', NULL,          '2026-01-20T10:00:00Z'),
('nakama', 1, '1', 'G1_2', '[10,10,10]',    NULL,          '2026-01-20T10:00:00Z'),
('nakama', 1, '1', 'G1_3', '[12,12,12]',    NULL,          '2026-01-20T10:00:00Z'),
('nakama', 1, '1', 'G1_4', '[10,12,12]',    NULL,          '2026-01-20T10:00:00Z'),
('nakama', 1, '1', 'G1_5', '[10,10,10]',    NULL,          '2026-01-20T10:00:00Z'),
('nakama', 1, '1', 'G1_6', '[18,18,18]',    NULL,          '2026-01-20T10:00:00Z');

-- Hafta 1 / Gün B (workout_code='2') — 2026-01-22
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 1, '2', 'G2_1', '[12,12,12,10]', NULL,                '2026-01-22T10:00:00Z'),
('nakama', 1, '2', 'G2_2', '[12,10,15]',    NULL,                '2026-01-22T10:00:00Z'),
('nakama', 1, '2', 'G2_3', '[3,3,3]',       'Lat pull down 25',  '2026-01-22T10:00:00Z'),
('nakama', 1, '2', 'G2_4', '[13,12,11]',    NULL,                '2026-01-22T10:00:00Z'),
('nakama', 1, '2', 'G2_5', '[10,10,8]',     NULL,                '2026-01-22T10:00:00Z'),
('nakama', 1, '2', 'G2_6', '[5,8,6]',       NULL,                '2026-01-22T10:00:00Z');

-- Hafta 1 / Gün C (workout_code='3') — 2026-01-24
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 1, '3', 'G3_1', '[10,9,10,9]',   NULL, '2026-01-24T10:00:00Z'),
('nakama', 1, '3', 'G3_2', '[10,10,10]',    NULL, '2026-01-24T10:00:00Z'),
('nakama', 1, '3', 'G3_3', '[12,12,12,12]', NULL, '2026-01-24T10:00:00Z'),
('nakama', 1, '3', 'G3_4', '[10,10,9]',     NULL, '2026-01-24T10:00:00Z'),
('nakama', 1, '3', 'G3_5', '[12,12,12]',    NULL, '2026-01-24T10:00:00Z'),
('nakama', 1, '3', 'G3_6', '[30,27,25]',    NULL, '2026-01-24T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 2
-- ─────────────────────────────────────────────

-- Hafta 2 / Gün A — 2026-01-27
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 2, '1', 'G1_1', '[8,8,6,6]',   NULL, '2026-01-27T10:00:00Z'),
('nakama', 2, '1', 'G1_2', '[10,10,10]',  NULL, '2026-01-27T10:00:00Z'),
('nakama', 2, '1', 'G1_3', '[10,10,10]',  NULL, '2026-01-27T10:00:00Z'),
('nakama', 2, '1', 'G1_4', '[14,14,14]',  NULL, '2026-01-27T10:00:00Z'),
('nakama', 2, '1', 'G1_5', '[14,14,14]',  NULL, '2026-01-27T10:00:00Z'),
('nakama', 2, '1', 'G1_6', '[18,16,15]',  NULL, '2026-01-27T10:00:00Z');

-- Hafta 2 / Gün B — 2026-01-29
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 2, '2', 'G2_1', '[10,10,10,10]', NULL,                '2026-01-29T10:00:00Z'),
('nakama', 2, '2', 'G2_2', '[10,10,10]',    NULL,                '2026-01-29T10:00:00Z'),
('nakama', 2, '2', 'G2_3', '[6,5,5]',       'Lat pull down 30',  '2026-01-29T10:00:00Z'),
('nakama', 2, '2', 'G2_4', '[12,10,10]',    NULL,                '2026-01-29T10:00:00Z'),
('nakama', 2, '2', 'G2_5', '[8,8,6]',       NULL,                '2026-01-29T10:00:00Z'),
('nakama', 2, '2', 'G2_6', '[8,8,8]',       NULL,                '2026-01-29T10:00:00Z');

-- Hafta 2 / Gün C — 2026-01-31
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 2, '3', 'G3_1', '[6,6,6,5]',    NULL, '2026-01-31T10:00:00Z'),
('nakama', 2, '3', 'G3_2', '[10,10,10]',   NULL, '2026-01-31T10:00:00Z'),
('nakama', 2, '3', 'G3_3', '[15,15,15,15]',NULL, '2026-01-31T10:00:00Z'),
('nakama', 2, '3', 'G3_4', '[14,14,14]',   NULL, '2026-01-31T10:00:00Z'),
('nakama', 2, '3', 'G3_5', '[9,7,8]',      NULL, '2026-01-31T10:00:00Z'),
('nakama', 2, '3', 'G3_6', '[40,30,30]',   NULL, '2026-01-31T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 3
-- ─────────────────────────────────────────────

-- Hafta 3 / Gün A — 2026-02-03
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 3, '1', 'G1_1', '[5,5,6,6]',   NULL,       '2026-02-03T10:00:00Z'),
('nakama', 3, '1', 'G1_2', '[10,9,8]',    NULL,       '2026-02-03T10:00:00Z'),
('nakama', 3, '1', 'G1_3', '[8,10,10]',   NULL,       '2026-02-03T10:00:00Z'),
('nakama', 3, '1', 'G1_4', '[15,14,14]',  NULL,       '2026-02-03T10:00:00Z'),
('nakama', 3, '1', 'G1_5', '[14,10,12]',  NULL,       '2026-02-03T10:00:00Z'),
('nakama', 3, '1', 'G1_6', '[20,18,17]',  'No cardio','2026-02-03T10:00:00Z');

-- Hafta 3 / Gün B — 2026-02-05
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 3, '2', 'G2_1', '[7,6,8,7]',  NULL,                    '2026-02-05T10:00:00Z'),
('nakama', 3, '2', 'G2_2', '[10,10,10]', NULL,                    '2026-02-05T10:00:00Z'),
('nakama', 3, '2', 'G2_3', '[6,5,5]',    '30-35-35 lat pull down','2026-02-05T10:00:00Z'),
('nakama', 3, '2', 'G2_4', '[10,10,10]', NULL,                    '2026-02-05T10:00:00Z'),
('nakama', 3, '2', 'G2_5', '[10,10,6]',  NULL,                    '2026-02-05T10:00:00Z'),
('nakama', 3, '2', 'G2_6', '[8,11,9]',   NULL,                    '2026-02-05T10:00:00Z');

-- Hafta 3 / Gün C — 2026-02-07
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 3, '3', 'G3_1', '[5,5,4,4]',    NULL, '2026-02-07T10:00:00Z'),
('nakama', 3, '3', 'G3_2', '[10,10,10]',   NULL, '2026-02-07T10:00:00Z'),
('nakama', 3, '3', 'G3_3', '[10,10,10,10]',NULL, '2026-02-07T10:00:00Z'),
('nakama', 3, '3', 'G3_4', '[6,7,6]',      NULL, '2026-02-07T10:00:00Z'),
('nakama', 3, '3', 'G3_5', '[8,8,8]',      '20', '2026-02-07T10:00:00Z'),
('nakama', 3, '3', 'G3_6', '[40,46,30]',   NULL, '2026-02-07T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 4
-- ─────────────────────────────────────────────

-- Hafta 4 / Gün A — 2026-02-10
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 4, '1', 'G1_1', '[5,5,5,5]',   NULL,  '2026-02-10T10:00:00Z'),
('nakama', 4, '1', 'G1_2', '[8,8,7]',     NULL,  '2026-02-10T10:00:00Z'),
('nakama', 4, '1', 'G1_3', '[8,8,10]',    NULL,  '2026-02-10T10:00:00Z'),
('nakama', 4, '1', 'G1_4', '[14,12,10]',  '25',  '2026-02-10T10:00:00Z'),
('nakama', 4, '1', 'G1_5', '[13,14,14]',  NULL,  '2026-02-10T10:00:00Z'),
('nakama', 4, '1', 'G1_6', '[20,20,22]',  NULL,  '2026-02-10T10:00:00Z');

-- Hafta 4 / Gün B — 2026-02-12
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 4, '2', 'G2_1', '[5,5,5,5]',  NULL,  '2026-02-12T10:00:00Z'),
('nakama', 4, '2', 'G2_2', '[10,10,8]',  NULL,  '2026-02-12T10:00:00Z'),
('nakama', 4, '2', 'G2_3', '[3,4,3]',    '35',  '2026-02-12T10:00:00Z'),
('nakama', 4, '2', 'G2_4', '[10,10,10]', NULL,  '2026-02-12T10:00:00Z'),
('nakama', 4, '2', 'G2_5', '[10,8,9]',   NULL,  '2026-02-12T10:00:00Z'),
('nakama', 4, '2', 'G2_6', '[12,10,8]',  NULL,  '2026-02-12T10:00:00Z');

-- Hafta 4 / Gün C — 2026-02-14
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 4, '3', 'G3_1', '[4,4,4,4]',    NULL, '2026-02-14T10:00:00Z'),
('nakama', 4, '3', 'G3_2', '[10,10,10]',   NULL, '2026-02-14T10:00:00Z'),
('nakama', 4, '3', 'G3_3', '[10,10,8,9]',  NULL, '2026-02-14T10:00:00Z'),
('nakama', 4, '3', 'G3_4', '[9,9,7]',      NULL, '2026-02-14T10:00:00Z'),
('nakama', 4, '3', 'G3_5', '[10,10,7]',    NULL, '2026-02-14T10:00:00Z'),
('nakama', 4, '3', 'G3_6', '[70,50,30]',   NULL, '2026-02-14T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 5
-- ─────────────────────────────────────────────

-- Hafta 5 / Gün A — 2026-02-17
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 5, '1', 'G1_1', '[3,3,3,3]',   'Son set 12.50 geçtim',                                      '2026-02-17T10:00:00Z'),
('nakama', 5, '1', 'G1_2', '[7,5,5]',     NULL,                                                         '2026-02-17T10:00:00Z'),
('nakama', 5, '1', 'G1_3', '[10,10,10]',  'Isınma 2den itibaren 5 kg geçtim son set 7.5',               '2026-02-17T10:00:00Z'),
('nakama', 5, '1', 'G1_4', '[7,8,7]',     'İlk set 30 yaptım ama 7 çıktı 2. Setten itibaren 25',        '2026-02-17T10:00:00Z'),
('nakama', 5, '1', 'G1_5', '[15,14,14]',  NULL,                                                         '2026-02-17T10:00:00Z'),
('nakama', 5, '1', 'G1_6', '[21,18,16]',  NULL,                                                         '2026-02-17T10:00:00Z');

-- Hafta 5 / Gün B — 2026-02-19
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 5, '2', 'G2_1', '[5,5,5,7]',  'Smith machine geçmeye çalıştım', '2026-02-19T10:00:00Z'),
('nakama', 5, '2', 'G2_2', '[10,7,7]',   NULL,                             '2026-02-19T10:00:00Z'),
('nakama', 5, '2', 'G2_3', '[5,4,4]',    '35',                             '2026-02-19T10:00:00Z'),
('nakama', 5, '2', 'G2_4', '[12,10,12]', NULL,                             '2026-02-19T10:00:00Z'),
('nakama', 5, '2', 'G2_5', '[11,9,8]',   NULL,                             '2026-02-19T10:00:00Z'),
('nakama', 5, '2', 'G2_6', '[12,11,9]',  NULL,                             '2026-02-19T10:00:00Z');

-- Hafta 5 / Gün C — 2026-02-21
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 5, '3', 'G3_1', '[5,4,4,3]',    NULL,                      '2026-02-21T10:00:00Z'),
('nakama', 5, '3', 'G3_2', '[10,10,10]',   NULL,                      '2026-02-21T10:00:00Z'),
('nakama', 5, '3', 'G3_3', '[10,7,8,9]',   'Ben 20 ile yapıyorum',    '2026-02-21T10:00:00Z'),
('nakama', 5, '3', 'G3_4', '[8,10,10]',    NULL,                      '2026-02-21T10:00:00Z'),
('nakama', 5, '3', 'G3_5', '[12,10,8]',    '20',                      '2026-02-21T10:00:00Z'),
('nakama', 5, '3', 'G3_6', '[60,30,30]',   NULL,                      '2026-02-21T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 6
-- ─────────────────────────────────────────────

-- Hafta 6 / Gün A — 2026-02-24
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 6, '1', 'G1_1', '[5,5,5,6]',   'Bunu iki kere yaptım çünkü geçen hafta tek gün haftası yaptım', '2026-02-24T10:00:00Z'),
('nakama', 6, '1', 'G1_2', '[8,8,9]',     NULL,                                                             '2026-02-24T10:00:00Z'),
('nakama', 6, '1', 'G1_3', '[10,8,8]',    '5 kg geçtim son set 7.5',                                        '2026-02-24T10:00:00Z'),
('nakama', 6, '1', 'G1_4', '[13,8,10]',   '25',                                                             '2026-02-24T10:00:00Z'),
('nakama', 6, '1', 'G1_5', '[14,14,14]',  NULL,                                                             '2026-02-24T10:00:00Z'),
('nakama', 6, '1', 'G1_6', '[62,24,27]',  NULL,                                                             '2026-02-24T10:00:00Z');

-- Hafta 6 / Gün B — 2026-02-26
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 6, '2', 'G2_1', '[5,5,5,6]',  'Smith machine',  '2026-02-26T10:00:00Z'),
('nakama', 6, '2', 'G2_2', '[10,10,10]', NULL,             '2026-02-26T10:00:00Z'),
('nakama', 6, '2', 'G2_3', '[6,6,6]',    '35',             '2026-02-26T10:00:00Z'),
('nakama', 6, '2', 'G2_4', '[12,14,11]', NULL,             '2026-02-26T10:00:00Z'),
('nakama', 6, '2', 'G2_5', '[10,10,8]',  NULL,             '2026-02-26T10:00:00Z'),
('nakama', 6, '2', 'G2_6', '[14,10,9]',  NULL,             '2026-02-26T10:00:00Z');

-- Hafta 6 / Gün C — 2026-02-28
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 6, '3', 'G3_1', '[5,5,5,4]',    NULL,                                 '2026-02-28T10:00:00Z'),
('nakama', 6, '3', 'G3_2', '[10,10,10]',   'Glute bridge 10 kg hip thrust 5 7.5','2026-02-28T10:00:00Z'),
('nakama', 6, '3', 'G3_3', '[10,10,10,10]','20 kg barbel',                        '2026-02-28T10:00:00Z'),
('nakama', 6, '3', 'G3_4', '[12,10,10]',   NULL,                                 '2026-02-28T10:00:00Z'),
('nakama', 6, '3', 'G3_5', '[10,10,8]',    NULL,                                 '2026-02-28T10:00:00Z'),
('nakama', 6, '3', 'G3_6', '[43,30,26]',   NULL,                                 '2026-02-28T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 7
-- ─────────────────────────────────────────────

-- Hafta 7 / Gün A — 2026-03-03
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 7, '1', 'G1_1', '[5,5,5,4]',   NULL,                                '2026-03-03T10:00:00Z'),
('nakama', 7, '1', 'G1_2', '[8,8,4]',     'Sol omuz önünde ağrı oluştu...',    '2026-03-03T10:00:00Z'),
('nakama', 7, '1', 'G1_3', '[8,8,8]',     NULL,                                '2026-03-03T10:00:00Z'),
('nakama', 7, '1', 'G1_4', '[11,12,10]',  '25',                                '2026-03-03T10:00:00Z'),
('nakama', 7, '1', 'G1_5', '[14,10,11]',  NULL,                                '2026-03-03T10:00:00Z'),
('nakama', 7, '1', 'G1_6', '[41,32,20]',  NULL,                                '2026-03-03T10:00:00Z');

-- Hafta 7 / Gün B — 2026-03-05
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 7, '2', 'G2_1', '[5,5,5]',    'Hip thrust 7.5 7.5 10 ısınma, 12.5 hareket son 1 bridge 12.5 ve 15', '2026-03-05T10:00:00Z'),
('nakama', 7, '2', 'G2_2', '[10,8,8]',   NULL,                                                                   '2026-03-05T10:00:00Z'),
('nakama', 7, '2', 'G2_3', '[6,4,3]',    '35 son 2 set 40 ağırlığa geçtim',                                     '2026-03-05T10:00:00Z'),
('nakama', 7, '2', 'G2_4', '[10,10,10]', NULL,                                                                   '2026-03-05T10:00:00Z'),
('nakama', 7, '2', 'G2_5', '[11,12,10]', NULL,                                                                   '2026-03-05T10:00:00Z'),
('nakama', 7, '2', 'G2_6', '[15,10,9]',  NULL,                                                                   '2026-03-05T10:00:00Z');

-- Hafta 7 / Gün C — 2026-03-07
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 7, '3', 'G3_1', '[5,5,5,6]',    'Seated yapıldı',                                       '2026-03-07T10:00:00Z'),
('nakama', 7, '3', 'G3_2', '[12,12,12]',   'Bridge 15 kg 12',                                      '2026-03-07T10:00:00Z'),
('nakama', 7, '3', 'G3_3', '[10,10,10,10]','20 ısınma 1, 22.5 ısınma 2, 25 main hareket 10 tekrar','2026-03-07T10:00:00Z'),
('nakama', 7, '3', 'G3_4', '[10,11,10]',   NULL,                                                   '2026-03-07T10:00:00Z'),
('nakama', 7, '3', 'G3_5', '[14,12,12]',   '20',                                                   '2026-03-07T10:00:00Z'),
('nakama', 7, '3', 'G3_6', '[60,35,40]',   NULL,                                                   '2026-03-07T10:00:00Z');

-- ─────────────────────────────────────────────
-- HAFTA 8
-- ─────────────────────────────────────────────

-- Hafta 8 / Gün A — 2026-03-10
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 8, '1', 'G1_1', '[5,5,5,7]',   'Bugün biraz zordu muhtemelen uykumu yeteri kadar alamadığımdan...', '2026-03-10T10:00:00Z'),
('nakama', 8, '1', 'G1_2', '[10,9,9]',    NULL,                                                                '2026-03-10T10:00:00Z'),
('nakama', 8, '1', 'G1_3', '[8,8,8]',     NULL,                                                                '2026-03-10T10:00:00Z'),
('nakama', 8, '1', 'G1_4', '[14,14,10]',  NULL,                                                                '2026-03-10T10:00:00Z'),
('nakama', 8, '1', 'G1_5', '[12,12,12]',  NULL,                                                                '2026-03-10T10:00:00Z'),
('nakama', 8, '1', 'G1_6', '[25,22,25]',  NULL,                                                                '2026-03-10T10:00:00Z');

-- Hafta 8 / Gün B — 2026-03-12
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 8, '2', 'G2_1', '[5,10,12,12]','7.5 10 12.5 15', '2026-03-12T10:00:00Z'),
('nakama', 8, '2', 'G2_2', '[10,9,9]',    NULL,             '2026-03-12T10:00:00Z'),
('nakama', 8, '2', 'G2_3', '[3,4,3]',     '40',             '2026-03-12T10:00:00Z'),
('nakama', 8, '2', 'G2_4', '[12,14,14]',  NULL,             '2026-03-12T10:00:00Z'),
('nakama', 8, '2', 'G2_5', '[12,12,10]',  NULL,             '2026-03-12T10:00:00Z'),
('nakama', 8, '2', 'G2_6', '[10,12,12]',  NULL,             '2026-03-12T10:00:00Z');

-- Hafta 8 / Gün C — 2026-03-14
INSERT INTO workout_logs (username, week_no, workout_code, slot_code, reps, notes, completed_at) VALUES
('nakama', 8, '3', 'G3_1', '[5,4,3,3]',   NULL,                          '2026-03-14T10:00:00Z'),
('nakama', 8, '3', 'G3_2', '[12,12,12]',  '15 ile bridge ısınma yapmadım','2026-03-14T10:00:00Z'),
('nakama', 8, '3', 'G3_3', '[8,9,8,7]',   '10 fazlış',                   '2026-03-14T10:00:00Z'),
('nakama', 8, '3', 'G3_4', '[8,7,7]',     NULL,                          '2026-03-14T10:00:00Z'),
('nakama', 8, '3', 'G3_5', '[9,9,8]',     '25',                          '2026-03-14T10:00:00Z'),
('nakama', 8, '3', 'G3_6', '[30,28,30]',  NULL,                          '2026-03-14T10:00:00Z');
