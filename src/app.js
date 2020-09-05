import express from "express";
import knex from "knex";
import knexPostgis from "knex-postgis";
import bodyParser from 'body-parser';


const db = knex({
    client: 'postgres',
    connection: {
        host: process.env.DATABASE_HOST || 'localhost',
        database: process.env.DATABASE_DB || 'banco',
        user: process.env.DATABASE_USER || 'frexco',
        password: process.env.DATABASE_PASSWORD || 'reset123',
        port: process.env.DATABASE_PORT || '5432'
    },
});

const st = knexPostgis(db);

// db.insert({
//     id: 1,
//     geom: st.geomFromText('POLYGON((-71.1776585052917 42.3902909739571,-71.1776820268866 42.3903701743239,\n' +
//         '-71.1776063012595 42.3903825660754,-71.1775826583081 42.3903033653531,-71.1776585052917 42.3902909739571))', 4267)
// }).into('points')
//     .then(x => {
//         console.log(x);
//     })
//     .catch(err => console.error(err));

const getTextPolygon = polygon =>
    `POLYGON((${polygon.map(x => `${x.lat} ${x.lng}`).join(",")}))`;

const getTextPoint = point =>
    `POINT(${point.lat} ${point.lng})`;

const geomFromText = text => st.geomFromText(text, 4267);

const app = express();
const port = process.env.PORT || "3001";

app.use(bodyParser.json());


app.post('/area', (req, res) => {
    const {name, shippingFee, polygon} = req.body;
    const txtPolygon = getTextPolygon(polygon);

    db.insert({
        name,
        shippingFee,
        geom: geomFromText(txtPolygon, 4267)
    }).into('area')
        .then(result => res.json(result))
        .catch(err => {
            console.error(err);
            res.status(500).send(err);
        })
});


app.get('/area/:lat/:lng', (req, res) => {
    const {lat, lng} = req.params;

    db.column('*', st.asText('geom')).select().from('area')
        .where(st.within(geomFromText(getTextPoint({lat, lng})), 'geom'))
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send(err);
        });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
