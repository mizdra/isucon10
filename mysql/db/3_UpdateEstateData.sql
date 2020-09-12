UPDATE isuumo.estate
SET door_width_range_id = 0
WHERE door_width < 80;
UPDATE isuumo.estate
SET door_width_range_id = 1
WHERE 80 <= door_width AND door_width < 110;
UPDATE isuumo.estate
SET door_width_range_id = 2
WHERE 110 <= door_width AND door_width < 150;
UPDATE isuumo.estate
SET door_width_range_id = 3
WHERE 150 <= door_width;

UPDATE isuumo.estate
SET door_width_range_id = 0
WHERE door_width < 80;
UPDATE isuumo.estate
SET door_width_range_id = 1
WHERE 80 <= door_width AND door_width < 110;
UPDATE isuumo.estate
SET door_width_range_id = 2
WHERE 110 <= door_width AND door_width < 150;
UPDATE isuumo.estate
SET door_width_range_id = 3
WHERE 150 <= door_width;

UPDATE isuumo.estate
SET door_height_range_id = 0
WHERE door_height < 80;
UPDATE isuumo.estate
SET door_height_range_id = 1
WHERE 80 <= door_height AND door_height < 110;
UPDATE isuumo.estate
SET door_height_range_id = 2
WHERE 110 <= door_height AND door_height < 150;
UPDATE isuumo.estate
SET door_height_range_id = 3
WHERE 150 <= door_height;

UPDATE isuumo.estate
SET rent_range_id = 0
WHERE rent < 50000;
UPDATE isuumo.estate
SET rent_range_id = 1
WHERE 50000 <= rent AND rent < 100000;
UPDATE isuumo.estate
SET rent_range_id = 2
WHERE 100000 <= rent AND rent < 150000;
UPDATE isuumo.estate
SET rent_range_id = 3
WHERE 150000 <= rent;