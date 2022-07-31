const { response } = require("express");
const http = require("http");
const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"))
// app.get("/", (req, res) => res.sendFile("/index.html", { root: __dirname }))
// app.listen(9091, () => console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer(app)
let PORT = process.env.PORT || 9090;
httpServer.listen(PORT, () => console.log("listening... on 9090"))

// hashmap clients
const clients = {};
const games = {};
const gamesArr = [];
var board1 = null;
var board2 = null;
var player1 = null;
var player2 = null;

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    // connect 
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!!"));
    connection.on("close", () => {
        console.log(clients);
        // clearRooms();
        // clearIdDestroy();
        console.log("closed!!");
    });
    connection.on("message", message => {
        
        const result = JSON.parse(message.utf8Data)
        // I have received a message from the client
        console.log(result)

        if(result.method === "create") {
            const clientId = result.clientId;
            deleteBlankRooms(clientId);
            clearRooms();
            player1 = clientId;
            const board = result.board;
            const gameId = guid();
            board1 = board;
            gamesArr.push(gameId);
            games[gameId] = {
                "id": gameId,
                "clients": []
            }

            games[gameId].clients.push({
                "clientId": clientId,
                "player": '1'
            })

            const payLoad = {
                "method": "create",
                "game": games[gameId],
                "player": "1",
                "board" : board
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        // a client want to join
        if(result.method === "join") {
            const clientId = result.clientId;
            player2 = clientId;
            let gameId = result.gameId;
            if(!checkRooms(gameId)) {
                console.log("eieiei");
                gameId = '';
            }
            
            
            const game = games[gameId];
            console.log(game);
            console.log(games);
            
            const board = result.board;
            board2 = board;

            if(gameId === '' || game.clients.length >= 2) {
                const payLoad = {
                    "method": "refresh",
                }
                clients[clientId].connection.send(JSON.stringify(payLoad));
                // Mac player reach
                return;
            }
            const player = {"0": "1", "1": "2"}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "player": player
            })

            const payLoad1 = {
                "method": "join",
                "game": game,
                "player": "1",
                "board" : board1
            }

            const payLoad2 = {
                "method": "join",
                "game": game,
                "player": "2",
                "board" : board2
            }

            
            // loop through all clients and tell them that people has joined
            game.clients.forEach(c => {
                if(c.clientId !== clientId) {
                    console.log("join player1")
                    clients[c.clientId].connection.send(JSON.stringify(payLoad1))
                }
                else {
                    console.log("join player1")
                    clients[c.clientId].connection.send(JSON.stringify(payLoad2))
                }   
            })
        }

        if(result.method === "play") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            if(games[gameId] === null) {
                return;
            }
            const game = games[gameId];
            const turn = result.turn;
            const currPiece = result.currPiece;
            const myPieces = result.myPieces;

            let winner = resWin(myPieces);

            board1 = result.board1;
            board2 = result.board2;

            const payLoad1 = {
                "clientId": clientId,
                "method": "play",
                "game": game,
                "player": "1",
                "board" : board1,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces,
                "winner": winner
            }

            const payLoad2 = {
                "clientId": clientId,
                "method": "play",
                "game": game,
                "player": "2",
                "board" : board2,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces,
                "winner": winner
            }

            const payLoad3 = {
                "clientId": clientId,
                "method": "updateBoard",
                "game": game,
                "player": "1",
                "board" : board1,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces,
                "winner": winner
            }

            const payLoad4 = {
                "clientId": clientId,
                "method": "updateBoard",
                "game": game,
                "player": "2",
                "board" : board2,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces,
                "winner": winner
            }
            

            game.clients.forEach(c => {
                if(turn === '1' && currPiece !== null) {
                    if(c.clientId === clientId) {
                        console.log(c.player + " 111 111")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad1))
                    }
                    else {
                        console.log(c.player + " 111 222")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad4))
                    }
                    
                }
                else if(turn === '2' && currPiece === null){
                    if(c.clientId === clientId) {
                        console.log(c.player + " 222 111")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad3))
                    }
                    else {
                        console.log(c.player + " 222 222")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad2))
                    }
                }
                else if(turn === '2' && currPiece !== null){
                    if(c.clientId === clientId) {
                        console.log(c.player + " 333 111")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad2))
                    }
                    else {
                        console.log(c.player + " 333 222")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad3))
                    }
                }  
                else if(turn === '1' && currPiece === null){
                    if(c.clientId === clientId) {
                        console.log(c.player + " 444 111")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad4))
                    }
                    else {
                        console.log(c.player + " 444 222")
                        clients[c.clientId].connection.send(JSON.stringify(payLoad1))
                    }
                }     
            })
        }
    })
    function clearIdDestroy() {
        for (const [key, value] of Object.entries(clients)) {
            if(value.connection._keepaliveTimeoutID._destroyed) {
                delete clients[key];
            }
        }
    }
    

    function resWin(myPieces) {
        if(myPieces[0].length <= 1) {
            return 2;
        }
        if(myPieces[1].length <= 1) {
            return 1;
        }
        return 0;
    }
    function checkDisRoom(clientId, gameId) {
        for(const [key, value] of Object.entries(games)) {
            let recon;
            games[key].clients.forEach(c => {
                if(c.clientId === clientId && games[key].clients.length === 2 && key !== gameId){
                    games[key].clients.forEach(c1 => {
                        if(c1.clientId !== clientId) {
                            recon = c1.clientId;
                        }
                        else {
                            delete c1.clientId;
                        }
                    });

                    const payLoad = {
                        "method": "create",
                        "game": games[key],
                        "player": "1",
                        "board" : null
                    }
        
                    const con = clients[recon].connection;
                    con.send(JSON.stringify(payLoad));

                }
            });
        }
    }

    function deleteBlankRooms(clientId) {
        if(games.length !== 0) {
            for (const [key, value] of Object.entries(games)) {
                games[key].clients.forEach(c => {
                    if(c.clientId === clientId && c.player === "1"){
                        delete games[key];
                    }
                });
            }
        }
    }

    // function deleteBlankRooms(clientId) {
    //     let tmpIndexGames = [];
    //     if(gamesArr.length !== 0) {
    //         for(let i = 0; i < gamesArr.length; i++) {
    //             for (const [key, value] of Object.entries(games)) {
    //                 if(gamesArr[i] === key) {
    //                     games[key].clients.forEach(c => {
    //                        if(c.clientId === clientId && c.player === "1"){
    //                             delete games[key];
    //                             tmpIndexGames.push(gamesArr[i]);
    //                        }
    //                     });
    //                 }
    //             }
    //         }
    //         for(let i = 0; i < tmpIndexGames.length; i++) {
    //             for(let j = 0; j < gamesArr.length; j++) {
    //                 if(gamesArr[j] == tmpIndexGames[i]) {
    //                     gamesArr.splice(j, 1);
    //                     break;
    //                 }
    //             }    
    //         }
    //     }
    // }
    function clearRooms() {
        console.log("clearrrr!!")
        for (const [key, value] of Object.entries(clients)) {
            if(value.connection.state === "closed") {
                for (const [keyG, valueG] of Object.entries(games)) {
                    games[keyG].clients.forEach(c => {
                        if(c.clientId === key){
                            delete games[keyG];
                            
                            return true;
                        }
                    });
                }
                delete clients[key];
            }
        }
        return false;
    }
    function clearRoomsBlank() {
        console.log("clearrrr!!")
        for (const [key, value] of Object.entries(clients)) {
            if(value.connection.state === "closed") {
                delete clients[key];
            }
        }
    }

    function checkRooms(gameId) {
        for (const [key, value] of Object.entries(games)) {
            if(gameId === key){
                return true;
            }
        }
        return false;
    }


    // generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId,
        "games": games
    }


    // send back the client connect
    connection.send(JSON.stringify(payLoad));



})

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(8).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => S4().toLowerCase();
 