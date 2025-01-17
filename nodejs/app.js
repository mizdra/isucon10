"use strict";

const express = require("express");
const multer = require("multer");
const mysql = require("mysql");
const path = require("path");
const cp = require("child_process");
const util = require("util");
const os = require("os");
const parse = require("csv-parse/lib/sync");
const camelcaseKeys = require("camelcase-keys");
const upload = multer();
const promisify = util.promisify;
const exec = promisify(cp.exec);
const chairSearchCondition = require("../fixture/chair_condition.json");
const estateSearchCondition = require("../fixture/estate_condition.json");
const inside = require('point-in-polygon');

const PORT = process.env.PORT ?? 1323;
const LIMIT = 20;
const NAZOTTE_LIMIT = 50;

const dbinfo_chair = {
  host: '10.164.37.102', // 2 台目
  port: process.env.MYSQL_PORT ?? 3306,
  user: process.env.MYSQL_USER ?? "isucon",
  password: process.env.MYSQL_PASS ?? "isucon",
  database: process.env.MYSQL_DBNAME ?? "isuumo",
  // TODO: max_connections は 14:03 現在 151, 増やせるかな？
  connectionLimit: 100,
};

const dbinfo_estate = {
  host: '10.164.37.103', // 3 台目
  port: process.env.MYSQL_PORT ?? 3306,
  user: process.env.MYSQL_USER ?? "isucon",
  password: process.env.MYSQL_PASS ?? "isucon",
  database: process.env.MYSQL_DBNAME ?? "isuumo",
  // TODO: max_connections は 14:03 現在 151, 増やせるかな？
  connectionLimit: 100,
};

const app = express();
const db_chair = mysql.createPool(dbinfo_chair);
const db_estate = mysql.createPool(dbinfo_estate);
app.set("db_chair", db_chair);
app.set("db_estate", db_estate);
const dbs = {
  'chair': db_chair,
  'estate': db_estate,
};

app.use(express.json());
app.post("/initialize", async (req, res, next) => {
  try {
    const dbdir = path.resolve("..", "mysql", "db");
    const dbfiles = [
      "0_Schema.sql",
      "1_DummyEstateData.sql",
      "2_DummyChairData.sql",
      "3_UpdateEstateData.sql",
    ];
    const execfiles = dbfiles.map((file) => path.join(dbdir, file));
    for (const execfile of execfiles) {
      await exec(
        `mysql -h ${dbinfo_chair.host} -u ${dbinfo_chair.user} -p${dbinfo_chair.password} -P ${dbinfo_chair.port} ${dbinfo_chair.database} < ${execfile}`
      );
      await exec(
        `mysql -h ${dbinfo_estate.host} -u ${dbinfo_estate.user} -p${dbinfo_estate.password} -P ${dbinfo_estate.port} ${dbinfo_estate.database} < ${execfile}`
      );
    }
    res.json({
      language: "nodejs",
    });
  } catch (e) {
    next(e);
  }
});

function getConnection(key) {
  const dbOfInterest = dbs[key];
  return promisify(dbOfInterest.getConnection.bind(dbOfInterest))();
}

app.get("/api/estate/low_priced", async (req, res, next) => {
  
  const connection = await getConnection('estate');
  const query = promisify(connection.query.bind(connection));
  try {
    const es = await query(
      // done: 素朴インデックスを貼った
      "SELECT * FROM estate ORDER BY rent ASC, id ASC LIMIT ?",
      [LIMIT]
    );
    const estates = es.map((estate) => camelcaseKeys(estate));
    res.json({ estates });
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/chair/low_priced", async (req, res, next) => {
  const connection = await getConnection('chair');
  const query = promisify(connection.query.bind(connection));
  try {
    const cs = await query(
      // done: stock インデックスはるとよいのだろうか (index <= 0 は 13:49 現在 11 件ある)
      "SELECT * FROM chair ORDER BY price ASC, id ASC LIMIT ?",
      [LIMIT]
    );
    const chairs = cs.map((chair) => camelcaseKeys(chair));
    res.json({ chairs });
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/chair/search", async (req, res, next) => {
  const searchQueries = [];
  const queryParams = [];
  const {
    priceRangeId,
    heightRangeId,
    widthRangeId,
    depthRangeId,
    kind,
    color,
    features,
    page,
    perPage,
  } = req.query;

  if (!!priceRangeId) {
    const chairPrice = chairSearchCondition["price"].ranges[priceRangeId];
    if (chairPrice == null) {
      res.status(400).send("priceRangeID invalid");
      return;
    }

    if (chairPrice.min !== -1) {
      searchQueries.push("price >= ? ");
      queryParams.push(chairPrice.min);
    }

    if (chairPrice.max !== -1) {
      searchQueries.push("price < ? ");
      queryParams.push(chairPrice.max);
    }
  }

  if (!!heightRangeId) {
    const chairHeight = chairSearchCondition["height"].ranges[heightRangeId];
    if (chairHeight == null) {
      res.status(400).send("heightRangeId invalid");
      return;
    }

    if (chairHeight.min !== -1) {
      searchQueries.push("height >= ? ");
      queryParams.push(chairHeight.min);
    }

    if (chairHeight.max !== -1) {
      searchQueries.push("height < ? ");
      queryParams.push(chairHeight.max);
    }
  }

  if (!!widthRangeId) {
    const chairWidth = chairSearchCondition["width"].ranges[widthRangeId];
    if (chairWidth == null) {
      res.status(400).send("widthRangeId invalid");
      return;
    }

    if (chairWidth.min !== -1) {
      searchQueries.push("width >= ? ");
      queryParams.push(chairWidth.min);
    }

    if (chairWidth.max !== -1) {
      searchQueries.push("width < ? ");
      queryParams.push(chairWidth.max);
    }
  }

  if (!!depthRangeId) {
    const chairDepth = chairSearchCondition["depth"].ranges[depthRangeId];
    if (chairDepth == null) {
      res.status(400).send("depthRangeId invalid");
      return;
    }

    if (chairDepth.min !== -1) {
      searchQueries.push("depth >= ? ");
      queryParams.push(chairDepth.min);
    }

    if (chairDepth.max !== -1) {
      searchQueries.push("depth < ? ");
      queryParams.push(chairDepth.max);
    }
  }

  if (!!kind) {
    searchQueries.push("kind = ? ");
    queryParams.push(kind);
  }

  if (!!color) {
    searchQueries.push("color = ? ");
    queryParams.push(color);
  }

  if (!!features) {
    const featureConditions = features.split(",");
    for (const featureCondition of featureConditions) {
      searchQueries.push("features LIKE CONCAT('%', ?, '%')");
      queryParams.push(featureCondition);
    }
  }

  if (searchQueries.length === 0) {
    res.status(400).send("Search condition not found");
    return;
  }

  if (!page || page != +page) {
    res.status(400).send(`page condition invalid ${page}`);
    return;
  }

  if (!perPage || perPage != +perPage) {
    res.status(400).send("perPage condition invalid");
    return;
  }

  const pageNum = parseInt(page, 10);
  const perPageNum = parseInt(perPage, 10);

  const sqlprefix = "SELECT * FROM chair WHERE ";
  const searchCondition = searchQueries.join(" AND ");
  const limitOffset = " ORDER BY popularity DESC, id ASC LIMIT ? OFFSET ?";
  const countprefix = "SELECT COUNT(*) as count FROM chair WHERE ";

  
  const connection = await getConnection('chair');
  const query = promisify(connection.query.bind(connection));
  try {
    const countQuery = query(
      `${countprefix}${searchCondition}`,
      [...queryParams] // clone array
    );
    queryParams.push(perPageNum, perPageNum * pageNum);
    const chairsQuery = query(
      `${sqlprefix}${searchCondition}${limitOffset}`,
      [...queryParams] // clone array
    );
    const [[{ count }], chairs] = await Promise.all([countQuery, chairsQuery]);
    res.json({
      count,
      chairs: camelcaseKeys(chairs),
    });
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/chair/search/condition", (req, res, next) => {
  res.json(chairSearchCondition);
});

app.get("/api/chair/:id", async (req, res, next) => {
  
  const connection = await getConnection('chair');
  const query = promisify(connection.query.bind(connection));
  try {
    const id = req.params.id;
    // このクエリは primary key なので余地はない
    const [chair] = await query("SELECT * FROM chair WHERE id = ?", [id]);
    if (chair == null || chair.stock <= 0) {
      res.status(404).send("Not Found");
      return;
    }
    res.json(camelcaseKeys(chair));
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.post("/api/chair/buy/:id", async (req, res, next) => {
  
  const connection = await getConnection('chair');
  const beginTransaction = promisify(connection.beginTransaction.bind(connection));
  const query = promisify(connection.query.bind(connection));
  const commit = promisify(connection.commit.bind(connection));
  const rollback = promisify(connection.rollback.bind(connection));
  try {
    const id = req.params.id;
    await beginTransaction();
    const [
      chair,
    ] = await query(
      // TODO: stock にインデックスをはりましょう
      // NOTE: ロックがかかっている
      "SELECT * FROM chair WHERE id = ? FOR UPDATE",
      [id]
    );
    if (chair == null) {
      res.status(404).send("Not Found");
      await rollback();
      return;
    }
    // delete or update
    if (chair.stock > 1) {
      await query("UPDATE chair SET stock = ? WHERE id = ?", [
        chair.stock - 1,
        id,
      ]);
    } else {
      await query("DELETE FROM chair WHERE id = ?", [
        id,
      ]);
    }
    await commit();
    res.json({ ok: true });
  } catch (e) {
    await rollback();
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/estate/search", async (req, res, next) => {
  const searchQueries = [];
  const queryParams = [];
  const {
    doorHeightRangeId,
    doorWidthRangeId,
    rentRangeId,
    features,
    page,
    perPage,
  } = req.query;

  if (!!doorHeightRangeId) {
    const doorHeight =
      estateSearchCondition["doorHeight"].ranges[doorHeightRangeId];
    if (doorHeight == null) {
      res.status(400).send("doorHeightRangeId invalid");
      return;
    }
    searchQueries.push("door_height_range_id = ?");
    queryParams.push(doorHeightRangeId);
  }

  if (!!doorWidthRangeId) {
    const doorWidth =
      estateSearchCondition["doorWidth"].ranges[doorWidthRangeId];
    if (doorWidth == null) {
      res.status(400).send("doorWidthRangeId invalid");
      return;
    }
    searchQueries.push("door_width_range_id = ?");
    queryParams.push(doorWidthRangeId);
  }

  // done: rent_range_id を使うようにした
  if (!!rentRangeId) {
    const rent = estateSearchCondition["rent"].ranges[rentRangeId];
    if (rent == null || rent.id != rentRangeId) {
      res.status(400).send("rentRangeId invalid");
      return;
    }
    searchQueries.push('rent_range_id = ?');
    queryParams.push(rentRangeId);
  }

  if (!!features) {
    const featureConditions = features.split(",");
    for (const featureCondition of featureConditions) {
      searchQueries.push("features LIKE CONCAT('%', ?, '%')");
      queryParams.push(featureCondition);
    }
  }

  if (searchQueries.length === 0) {
    res.status(400).send("Search condition not found");
    return;
  }

  if (!page || page != +page) {
    res.status(400).send(`page condition invalid ${page}`);
    return;
  }

  if (!perPage || perPage != +perPage) {
    res.status(400).send("perPage condition invalid");
    return;
  }

  const pageNum = parseInt(page, 10);
  const perPageNum = parseInt(perPage, 10);

  const sqlprefix = "SELECT * FROM estate WHERE ";
  const searchCondition = searchQueries.join(" AND ");
  const limitOffset = " ORDER BY popularity DESC, id ASC LIMIT ? OFFSET ?";
  const countprefix = "SELECT COUNT(*) as count FROM estate WHERE ";

  
  const connection = await getConnection('estate');
  const query = promisify(connection.query.bind(connection));
  try {
    const countQuery = query(
      `${countprefix}${searchCondition}`,
      [...queryParams] // clone array
    );
    queryParams.push(perPageNum, perPageNum * pageNum);
    const estatesQuery = query(
      `${sqlprefix}${searchCondition}${limitOffset}`,
      [...queryParams] // clone array
    );
    const [[{ count }], estates] = await Promise.all([countQuery, estatesQuery]);
    res.json({
      count,
      estates: camelcaseKeys(estates),
    });
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/estate/search/condition", (req, res, next) => {
  res.json(estateSearchCondition);
});

app.post("/api/estate/req_doc/:id", async (req, res, next) => {
  const id = req.params.id;
  
  const connection = await getConnection('estate');
  const query = promisify(connection.query.bind(connection));
  try {
    const id = req.params.id;
    // NOTE: ここは primary だから余地なし
    const [estate] = await query("SELECT * FROM estate WHERE id = ?", [id]);
    if (estate == null) {
      res.status(404).send("Not Found");
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.post("/api/estate/nazotte", async (req, res, next) => {
  const coordinates = req.body.coordinates;

  // ユーザがなぞった部分のポリゴンデータ
  const polygon = coordinates.map((c) => [c.latitude, c.longitude]); // [[緯度, 経度], ...]

  const longitudes = coordinates.map((c) => c.longitude);
  const latitudes = coordinates.map((c) => c.latitude);
  const boundingbox = {
    topleft: {
      longitude: Math.min(...longitudes),
      latitude: Math.min(...latitudes),
    },
    bottomright: {
      longitude: Math.max(...longitudes),
      latitude: Math.max(...latitudes),
    },
  };

  
  const connection = await getConnection('estate');
  const query = promisify(connection.query.bind(connection));
  try {
    const estates = await query(
      // TODO: 雑にいうと latitude, longitude にインデックスかな…
      // NOTE: nazotte はスコアに影響するかな…
      `
        SELECT *
        FROM estate
        WHERE
            latitude <= ?
        AND latitude >= ?
        AND longitude <= ?
        AND longitude >= ?
        ORDER BY popularity DESC, id ASC
      `,
      [
        boundingbox.bottomright.latitude,
        boundingbox.topleft.latitude,
        boundingbox.bottomright.longitude,
        boundingbox.topleft.longitude,
      ]
    );

    const estatesInPolygon = estates.filter((estate) => {
      return inside([estate.latitude, estate.longitude], polygon);
    });

    const results = {
      estates: [],
    };
    let i = 0;
    for (const estate of estatesInPolygon) {
      if (i >= NAZOTTE_LIMIT) {
        break;
      }
      results.estates.push(camelcaseKeys(estate));
      i++;
    }
    results.count = results.estates.length;
    res.json(results);
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/estate/:id", async (req, res, next) => {
  
  const connection = await getConnection('estate');
  const query = promisify(connection.query.bind(connection));
  try {
    const id = req.params.id;
    // NOTE: ここは primary key なので余地なし
    const [estate] = await query("SELECT * FROM estate WHERE id = ?", [id]);
    if (estate == null) {
      res.status(404).send("Not Found");
      return;
    }

    res.json(camelcaseKeys(estate));
  } catch (e) {
    next(e);
  } finally {
    await connection.release();
  }
});

app.get("/api/recommended_estate/:id", async (req, res, next) => {
  const id = req.params.id;
  
  const connection_chair = await getConnection('chair');
  const connection_estate = await getConnection('estate');
  const query_chair = promisify(connection_chair.query.bind(connection_chair));
  const query_estate = promisify(connection_estate.query.bind(connection_estate));
  try {
    const [chair] = await query_chair("SELECT * FROM chair WHERE id = ?", [id]);
    const w = chair.width;
    const h = chair.height;
    const d = chair.depth;
    const es = await query_estate(
      // NOTE: なんだこのクエリは
      // done: ナイーブに考えると door_width, door_height にインデックスをはる？
      // TODO: クエリ自体の改善や，キャッシュ的にことはできるのでは
      `
        SELECT *
        FROM estate
        where
             (door_width >= ? AND door_height>= ?)
          OR (door_width >= ? AND door_height>= ?)
          OR (door_width >= ? AND door_height>=?)
          OR (door_width >= ? AND door_height>=?)
          OR (door_width >= ? AND door_height>=?)
          OR (door_width >= ? AND door_height>=?)
          ORDER BY popularity DESC, id ASC
          LIMIT ?
      `,
      [w, h, w, d, h, w, h, d, d, w, d, h, LIMIT]
    );
    const estates = es.map((estate) => camelcaseKeys(estate));
    res.json({ estates });
  } catch (e) {
    next(e);
  } finally {
    await connection_chair.release();
    await connection_estate.release();
  }
});

app.post("/api/chair", upload.single("chairs"), async (req, res, next) => {
  
  const connection = await getConnection('chair');
  const beginTransaction = promisify(connection.beginTransaction.bind(connection));
  const query = promisify(connection.query.bind(connection));
  const commit = promisify(connection.commit.bind(connection));
  const rollback = promisify(connection.rollback.bind(connection));
  try {
    await beginTransaction();
    const csv = parse(req.file.buffer, { skip_empty_line: true });
    for (var i = 0; i < csv.length; i++) {
      const items = csv[i];
      // TODO: N+1! だけど アップロードだからスコアに関係するのかな…
      await query(
        "INSERT INTO chair(id, name, description, thumbnail, price, height, width, depth, color, features, kind, popularity, stock) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
        items
      );
    }
    await commit();
    res.status(201);
    res.json({ ok: true });
  } catch (e) {
    await rollback();
    next(e);
  } finally {
    await connection.release();
  }
});

/**
 * rent から rent_range_id をえる　
 */
function findRangeIdByRent(rent) {
  return estateSearchCondition.rent.ranges.find(range => range.min <= rent && rent < (range.max == -1 ? Infinity : range.max)).id;
}

function getDoorWidthRangeId(doorWidth) {
  return estateSearchCondition.doorWidth.ranges.find(range => range.min <= doorWidth && doorWidth < (range.max == -1 ? Infinity : range.max)).id;
}

function getDoorHeightRangeId(doorHeight) {
  return estateSearchCondition.doorHeight.ranges.find(range => range.min <= doorHeight && doorHeight < (range.max == -1 ? Infinity : range.max)).id;
}

app.post("/api/estate", upload.single("estates"), async (req, res, next) => {
  
  const connection = await getConnection('estate');
  const beginTransaction = promisify(connection.beginTransaction.bind(connection));
  const query = promisify(connection.query.bind(connection));
  const commit = promisify(connection.commit.bind(connection));
  const rollback = promisify(connection.rollback.bind(connection));
  try {
    await beginTransaction();
    const csv = parse(req.file.buffer, { skip_empty_line: true });
    // TODO: N+1! だけど アップロードだからスコアに関係するのかな…
    for (var i = 0; i < csv.length; i++) {
      const items = csv[i];
      const rentRangeId = findRangeIdByRent(items[7]);
      const doorHeightRangeId = getDoorHeightRangeId(items[8] | 0);
      const doorWidthRangeId = getDoorWidthRangeId(items[9] | 0);
      await query(
        "INSERT INTO estate(id, name, description, thumbnail, address, latitude, longitude, rent, door_height, door_width, features, popularity, door_height_range_id, door_width_range_id, rent_range_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [...items, doorHeightRangeId, doorWidthRangeId, rentRangeId]
      );
    }
    await commit();
    res.status(201);
    res.json({ ok: true });
  } catch (e) {
    await rollback();
    next(e);
  } finally {
    await connection.release();
  }
});

app.listen(PORT, () => {
  console.log(`Listening ${PORT}`);
});
