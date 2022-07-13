const { response } = require("express");
const http = require("http");
const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"))
// app.get("/", (req, res) => res.sendFile("/index.html", { root: __dirname }))
app.listen(9091, () => console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer()
let PORT = process.env.PORT || 9090;
httpServer.listen(PORT, () => console.log("listening... on 9090"))

// hashmap clients
const clients = {};
const games = {};
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
    connection.on("close", () => console.log("closed!!"));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        // I have received a message from the client
        console.log(result)

        if(result.method === "create") {
            const clientId = result.clientId;
            player1 = clientId;
            const board = result.board;
            const gameId = guid();
            board1 = board;
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
            const gameId = result.gameId;
            const game = games[gameId];
            const board = result.board;
            board2 = board;

            if(gameId === '' || game.clients.length >= 2) {
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
            const game = games[gameId];
            const turn = result.turn;
            const currPiece = result.currPiece;
            const myPieces = result.myPieces;
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
                "myPieces": myPieces
            }

            const payLoad2 = {
                "clientId": clientId,
                "method": "play",
                "game": game,
                "player": "2",
                "board" : board2,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces
            }

            const payLoad3 = {
                "clientId": clientId,
                "method": "updateBoard",
                "game": game,
                "player": "1",
                "board" : board1,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces
            }

            const payLoad4 = {
                "clientId": clientId,
                "method": "updateBoard",
                "game": game,
                "player": "2",
                "board" : board2,
                "turn": turn,
                "currPiece": currPiece,
                "myPieces": myPieces
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


    // generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }


    // send back the client connect
    connection.send(JSON.stringify(payLoad))

})

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 
