DROP DATABASE IF EXISTS isuumo;
CREATE DATABASE isuumo;

DROP TABLE IF EXISTS isuumo.estate;
DROP TABLE IF EXISTS isuumo.chair;

CREATE TABLE isuumo.estate
(
    id          INTEGER             NOT NULL PRIMARY KEY,
    name        VARCHAR(64)         NOT NULL,
    description VARCHAR(4096)       NOT NULL,
    thumbnail   VARCHAR(128)        NOT NULL,
    address     VARCHAR(128)        NOT NULL,
    latitude    DOUBLE PRECISION    NOT NULL,
    longitude   DOUBLE PRECISION    NOT NULL,
    rent        INTEGER             NOT NULL,
    rent_range_id INTEGER NOT NULL DEFAULT 0,
    door_height INTEGER             NOT NULL,
    door_height_range_id INTEGER NOT NULL DEFAULT 0,
    door_width  INTEGER             NOT NULL,
    door_width_range_id INTEGER NOT NULL DEFAULT 0,
    features    VARCHAR(64)         NOT NULL,
    popularity  INTEGER             NOT NULL,
    KEY `rent_id` (`rent`,`id`),
    KEY `door_height_door_width_rent` (`door_height_range_id`,`door_width_range_id`,`rent_range_id`),
    KEY `door_width_and_door_height` (`door_width`,`door_height`),
    KEY `rent_range_id` (`rent_range_id`),
    KEY `door_height_range_id` (`door_height_range_id`)
);

CREATE TABLE isuumo.chair
(
    id          INTEGER         NOT NULL PRIMARY KEY,
    name        VARCHAR(64)     NOT NULL,
    description VARCHAR(4096)   NOT NULL,
    thumbnail   VARCHAR(128)    NOT NULL,
    price       INTEGER         NOT NULL,
    height      INTEGER         NOT NULL,
    width       INTEGER         NOT NULL,
    depth       INTEGER         NOT NULL,
    color       VARCHAR(64)     NOT NULL,
    features    VARCHAR(64)     NOT NULL,
    kind        VARCHAR(64)     NOT NULL,
    popularity  INTEGER         NOT NULL,
    stock       INTEGER         NOT NULL,
    KEY `price_id` (`price`,`id`),
    KEY `popularity` (`popularity` ASC),
    KEY `color` (`color` ASC),
    KEY `kind` (`kind` ASC),
    KEY `depth` (`depth` ASC),
    KEY `width` (`width` ASC),
    KEY `height` (`height` ASC),
    KEY `price` (`price` ASC),
    KEY `features` (`features` ASC)
);
