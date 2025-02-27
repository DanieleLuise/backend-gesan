import { error } from "console";
import express, { query } from "express";
import fs from "fs";
import cors from "cors"
import { DateTime } from "luxon"
import { getToken, verifyToken } from "./jwt.js";
import pg from "pg"

const app = express();
app.use(cors());
app.use(express.json());




const client = new pg.Client({
	user: 'postgres',
	password: 'usergesan',
	host: '192.168.125.187',
	port: '5432',
	database: 'social',
});
client.connect().then(()=> {
    console.log('stato: connesso')
}).catch((err)=>{
    console.log('errore nella connessione');
    
})


			
        

	//	client.query("INSERT INTO bird.utente (nome,eta,codice_fiscale,id,dipendente_id)VALUES ('figlio',20,'coduiced',34,21)");
        	

const userChekRegister = (req, res, next) => {
   
    if (req.body.username.length === 0){
        res.status(401);
        next(new Error("caratteri non consetiti nell username"));
    }else{
        const dati = readFileSync();
        let userChekRegister = dati.find((utente) => req.body.username === utente.username);
        
        if (userChekRegister) {
            res.status(401);
            next(new Error("Username gia usato"));
        
           }else{
           next();
           }
    }
};


const chekFindPost = (req, res, next) => {
    const utenteQ = req.query.username;
    let dbPostUtenti = readFileSyncPost();
    let chekRegister = dbPostUtenti.find((utente) => utenteQ === utente.idPostUtente);

    if (chekRegister === undefined) {
        res.status(403);
        next(new Error("Impossibile cercare Post"));
    } else {
        next();
    };
};

function encrypt(msg, key) {
    var result = "";

    for (var i = 0; i < msg.length; i++) {
        var char = msg.charAt(i);
        var index = char.charCodeAt(0) + key;
        result += String.fromCharCode(index);
    }
    return result;
};

function readFileSync() {
   const datiRaw = fs.readFileSync("./utenti.json").toString("utf8");
    const dati = JSON.parse(datiRaw);
    return dati;
};

function readFileSyncPost() {
    const datiRaw = fs.readFileSync("./post.json").toString("utf8");
    const dati = JSON.parse(datiRaw);
    return dati;
};

function writeFileSync(message) {
   // fs.writeFileSync("./utenti.json", JSON.stringify(message, undefined, 4));
  client.query("INSERT INTO bird.utente (username, password, nome, cognome) VALUES (?, ?, ?, ?)",[message.username,message.password,message.nome,message.cognome],(err,result)=>{
console.log(err);

  });
  
};

function writeFileSyncPost(message) {
    fs.writeFileSync("./post.json", JSON.stringify(message, undefined, 4));
};

const checkLogin = (req, res, next) => {
    const utenteQ = req.body;
    let dbUtenti = readFileSync();
    let foundUsername = dbUtenti.find((utente) => utenteQ.username === utente.username);
    utenteQ.password = encrypt(utenteQ.password, 3);

    if (foundUsername === undefined) {
        res.status(401);
        next(new Error("utente non registrato"));
    } else if (foundUsername.username === utenteQ.username && foundUsername.password === utenteQ.password) {
     //   req.token = getToken(utenteQ.username);
        next();
    } else {
        res.status(401);
        next(new Error("Password non valida"));
    };
};

app.post("/login", checkLogin, (req, res, next) => {
    //res.status(200).send(req.token);
    res.status(200).send("Login Succes");

});


app.post("/register",userChekRegister, (req, res, next) => {
    const dati = readFileSync();

        req.body.password = encrypt(req.body.password, 3);
        dati.push(req.body);
        writeFileSync(dati);
        res.status(200).send(req.body);
    

});

app.get("/post", (req, res, next) => {
    const dati = readFileSyncPost();

    dati.sort((x, y) => {
        let dataX = DateTime.fromISO(x.data).toMillis();
        let dataY = DateTime.fromISO(y.data).toMillis();
        return dataY - dataX;
    });
    res.status(200).send(dati);
});

app.post("/post/addPost/", (req, res, next) => {
    const dati = readFileSyncPost();
    const datiUser = readFileSync();
    let utenteTmp = req.body;
    //utenteTmp.idPostUtente = verifyToken(req.headers.authorization);
    utenteTmp.idPostUtente = req.query.username;

    utenteTmp.data = DateTime.utc().toISO();
    let chekRegister = datiUser.find((utente) => utenteTmp.idPostUtente === utente.username);

    if (!chekRegister) {
        res.status(401);
        next(new Error("Utente non Registrato"));
    }else{
        utenteTmp.idPost = dati.length + 1;
        dati.push(utenteTmp);
        writeFileSyncPost(dati);
        res.status(200).send("Post Added");
    };

   
});

app.get("/post/findPost/", chekFindPost, (req, res, next) => {
    const dati = readFileSyncPost();
    let utenteTmp = req.query.username;
    let arrayTmp = [];

    for (let utente of dati) {
        if (utente.idPostUtente === utenteTmp) {
            arrayTmp.unshift(utente);
        }
    }
    res.status(200).send(arrayTmp);
});

app.delete("/post/deletePost/", chekFindPost, (req, res, next) => {
    const dati = readFileSyncPost();

    let tmp = dati.findIndex((postFind)=>req.query.idPost == postFind.idPost && req.query.username == postFind.idPostUtente)
            if(tmp != -1){
            dati.splice(tmp, 1);
            writeFileSyncPost(dati);
            res.status(200).send(dati);
        } else{
            res.status(400);
            next(new Error("Impossibile cancellare post"));
        }
});

app.get("/post/likePost/", (req, res, next) => {
    const dati = readFileSyncPost();
    let utenteTmp = req.query;

    for (let utente of dati) {
        if (utenteTmp.idPost == utente.idPost){
            if (utente.like == 0) {
                utente.like.push(utenteTmp.username);
            }else{
               let chekRegister = utente.like.find((utente) => utenteTmp.username === utente);
                if (chekRegister || chekRegister!== undefined) {
                    let newArray = utente.like.filter(function (x) {
                        return x != chekRegister
                         }
                    );           
                      utente.like = newArray;
                }else{
                    utente.like.push(utenteTmp.username);               
                }
            }
        }
    }

    writeFileSyncPost(dati);
    res.status(200).send(dati);
});


app.use((err, req, res, next) => {
    res.send(err.message);
});

app.listen(3000, () => {
    console.log("server avviato con successo");
});

export default app;