// HTML elements
let clientId = null;
let gameId = null;
let board = null;
let games = null;
// let HOST = location.origin.replace(/^http/, 'ws')
let ws = new WebSocket(HOST)
let ws = new WebSocket("ws://localhost:9090")
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const divPlayers = document.getElementById("divPlayers");
const divRooms = document.getElementById("divRooms");
const divBoard = document.getElementById("divBoard");
const showTxtGameId = document.getElementById("showTxtGameId");
const txtWinner = document.getElementById("txtWinner");
const main = document.getElementById("main");

// player properties
let turn = null;
let currPiece = null;
var myPieces = null;
var addBlank = [];

// wiring events
btnJoin.addEventListener("click", e => {

    if(gameId === null) {
        gameId = txtGameId.value;
    }

    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId,
        "player": "2",
        "board": createInitBoard("2")
    }

    ws.send(JSON.stringify(payLoad));

});
btnCreate.addEventListener("click", e => {

    const payLoad = {
        "method": "create",
        "clientId": clientId,
        "player": "1",
        "board": createInitBoard("1")
    }

    ws.send(JSON.stringify(payLoad));
});


 

ws.onmessage = message => {
    // message.data
    const response = JSON.parse(message.data)
    console.log(response)

    // connect
    if(response.method === "connect") {
        clientId = response.clientId;
        games = response.games;
        console.log("Client id Set successfully " + clientId)

        showRooms(games);
    }

    // create
    if(response.method === "create") {
        let gameId = response.game.id
        console.log("game successfully create with id " + response.game.id);
        let game = response.game;
        let board = response.board;
        if(board == null) {
            board = createInitBoard("1");
        }
        let player = response.player;
        let myPieces = [[1, 2, 3, 4, 5, 6, 7, 8], 
                        [9, 10, 11, 12, 13, 14, 15, 16]];
        createBoard(game, board, player, myPieces);
    }

    // join
    if(response.method === "join") {
        let game = response.game;
        let board = response.board;
        let player = response.player;

        let myPieces = [[1, 2, 3, 4, 5, 6, 7, 8], 
                        [9, 10, 11, 12, 13, 14, 15, 16]];
        createBoard(game, board, player, myPieces, null);
        play(game, board, player, null, null, myPieces)
    }

    if(response.method === "play") {
        let game = response.game;
        let board = response.board;
        let player = response.player;
        let turn = response.turn;
        let currPiece = response.currPiece;
        myPieces = response.myPieces;
        let winner = response.winner;
        if(winner !== 0) {
            if(parseInt(player) === winner) {
                txtWinner.innerHTML = "You win!!"
            }
            else {
                txtWinner.innerHTML = "You Lose!!"
            }
        }
        createBoard(game, board, player, myPieces, currPiece);
        if(winner === 0) {
            play(game, board, player, turn, currPiece, myPieces);
        }
        
    }
    if(response.method === "updateBoard") {
        let game = response.game;
        let board = response.board;
        let player = response.player;
        let winner = response.winner;
        if(winner !== 0) {
            if(parseInt(player) === winner) {
                txtWinner.innerHTML = "You win!!"
            }
            else {
                txtWinner.innerHTML = "You Lose!!"
            }
        }
        myPieces = response.myPieces;
        createBoard(game, board, player, myPieces, null);
    }
    if(response.method === "refresh") {
        location.reload();
    }
}

function showRooms(games) {

    while(divRooms.firstChild){
        divRooms.removeChild(divRooms.firstChild);
    }
    let count = 1;
    for (const [key, value] of Object.entries(games)) {
        let nameRoom = document.createElement('p');
        nameRoom.innerHTML = "Room " + key + " (" + games[key].clients.length + "/2)" +"&nbsp&nbsp&nbsp&nbsp";
        count++;
        let btnJoinRoom = document.createElement('button');
        let inline = document.createElement('div');
        btnJoinRoom.setAttribute("class", "button-24");
        btnJoinRoom.id = "btnJoinRoom" + key;
        btnJoinRoom.innerHTML = "Join";
        let br = document.createElement('br');
        divRooms.appendChild(nameRoom);
        divRooms.appendChild(btnJoinRoom);
        divRooms.appendChild(br);

        divRooms.setAttribute("class", "inline");
        // console.log(`${key}: ${value}`);
    }
    
    if(games !== null) {
        for (const [key, value] of Object.entries(games)) {
            document.getElementById("btnJoinRoom" + key).addEventListener("click", e => {
                console.log("click join room " + key);
                const payLoad = {
                    "method": "join",
                    "clientId": clientId,
                    "gameId": key,
                    "player": "2",
                    "board": createInitBoard("2")
                }
                ws.send(JSON.stringify(payLoad));
            });
        }
    }
    
    
}

function play(game, board, player, turn, currPiece, myPieces) {
    console.log(clientId)
    console.log("player " + player + " turn " + turn);
    if(turn === null && currPiece === null) {
        // let myPieces = [[1, 2, 3, 4, 5, 6, 7, 8], 
        //                 [9, 10, 11, 12, 13, 14, 15, 16]];
        myPieces[parseInt(player) - 1].forEach(p => {
            document.getElementById('b' + p).addEventListener("click", e => {
                console.log('currPiece is b' + p);
                const payLoad1 = {
                    "clientId": clientId,
                    "method": "play",
                    "turn": player,
                    "gameId": game.id,
                    "board1": board,
                    "board2": flipBoard(board),
                    "currPiece": p,
                    "myPieces": myPieces
                }

                const payLoad2 = {
                    "clientId": clientId,
                    "method": "play",
                    "turn": player,
                    "gameId": game.id,
                    "board1": flipBoard(board),
                    "board2": board,
                    "currPiece": p,
                    "myPieces": myPieces
                }

                if(player == "1") {
                    ws.send(JSON.stringify(payLoad1));
                }
                else {
                    ws.send(JSON.stringify(payLoad2));
                } 
            })
        })    
    }
    if(turn !== null) {
        myPieces[parseInt(turn) - 1].forEach(p => {
            document.getElementById('b' + p).addEventListener("click", e => {
                console.log('currPiece is b' + p);
                const payLoad1 = {
                    "clientId": clientId,
                    "method": "play",
                    "turn": turn,
                    "gameId": game.id,
                    "board1": board,
                    "board2": flipBoard(board),
                    "currPiece": p,
                    "myPieces": myPieces
                }

                const payLoad2 = {
                    "clientId": clientId,
                    "method": "play",
                    "turn": turn,
                    "gameId": game.id,
                    "board1": flipBoard(board),
                    "board2": board,
                    "currPiece": p,
                    "myPieces": myPieces
                }
                
                if(player === "1") {
                    ws.send(JSON.stringify(payLoad1));
                }
                else{
                    ws.send(JSON.stringify(payLoad2));
                }
            })
        })
    }
    if(turn !== null && currPiece !== null) {
        let valPiece, currPieceI, currPieceJ, blank = [];
        for(let i = 0; i < 8; i++) {
            for(let j = 0; j < 8; j++) {
                if(board[i][j] === currPiece) {
                    currPieceI = i;
                    currPieceJ = j;
                    valPiece = board[i][j];
                    break;
                    i = 9;
                }
            }
        }

        
        for(let i = currPieceI, j = currPieceJ - 1; j >= 0; j--) {
            if(!myPieces[0].includes(board[i][j]) && !myPieces[1].includes(board[i][j])) {
                blank.push(board[i][j]);
            }
            else {
                break;
            }
        }
        for(let i = currPieceI, j = currPieceJ + 1; j < 8; j++) {
            if(!myPieces[0].includes(board[i][j]) && !myPieces[1].includes(board[i][j])) {
                blank.push(board[i][j]);
            }
            else {
                break;
            }
        }

        // check blank top down
        for(let i = currPieceI - 1, j = currPieceJ; i >= 0; i--) {
            if(!myPieces[0].includes(board[i][j]) && !myPieces[1].includes(board[i][j])) {
                blank.push(board[i][j]);
            }
            else {
                break;
            }
        }
        for(let i = currPieceI + 1, j = currPieceJ; i < 8; i++) {
            if(!myPieces[0].includes(board[i][j]) && !myPieces[1].includes(board[i][j])) {
                blank.push(board[i][j]);
            }
            else {
                break;
            }
        }
        

        blank.forEach(k => {
            document.getElementById('b' + k).addEventListener("click", e => {
                console.log("click blank")
                for(let i = 0; i < 8; i++) {
                    for(let j = 0; j < 8; j++) {
                        if(board[i][j] === k) {
                            board[i][j] = valPiece;
                            board[currPieceI][currPieceJ] = k;
                            console.log("valPiece " + valPiece);
                            console.log("board[i][j] " + board[i][j]);
                            result = checkPin(board, i, j, myPieces, valPiece);
                            board = result[0];
                            myPieces = result[1];
                            break;
                            i = 9;
                        }
                    }
                }
                
                const payLoad1 = {
                    "clientId": clientId,
                    "method": "play",
                    "turn": String(Math.abs(parseInt(turn) - 2) + 1),
                    "gameId": game.id,
                    "board1": board,
                    "board2": flipBoard(board),
                    "currPiece": null,
                    "myPieces": myPieces
                }

                const payLoad2 = {
                    "clientId": clientId,
                    "method": "play",
                    "turn": String(Math.abs(parseInt(turn) - 2) + 1),
                    "gameId": game.id,
                    "board1": flipBoard(board),
                    "board2": board,
                    "currPiece": null,
                    "myPieces": myPieces
                }

                if(player == "1") {
                    ws.send(JSON.stringify(payLoad1));
                }
                else {
                    ws.send(JSON.stringify(payLoad2));
                } 
            })
        })
    }
    
}

function removePiece(val, myPieces) {
    let pieces1 = [1, 2, 3, 4, 5, 6, 7, 8];
    let pieces2 = [9, 10, 11, 12, 13, 14, 15, 16];
    if(pieces1.includes(val)) {
        for(let i = 0; i < myPieces[0].length; i++) {
            if(val === myPieces[0][i]) {
                myPieces[0].splice(i, 1);
                break;
            }
        }
    }
    else {
        for(let i = 0; i < myPieces[1].length; i++) {
            if(val === myPieces[1][i]) {
                myPieces[1].splice(i, 1);
                break;
            }
        }
    }

    return myPieces;
}


function checkPin(board, x, y, myPieces, valPiece) {
    console.log('Pinnn!!')
    let pieces1 = [1, 2, 3, 4, 5, 6, 7, 8];
    let pieces2 = [9, 10, 11, 12, 13, 14, 15, 16];
    for(let i = 0; i < 8; i++) {
        for(let j = 0; j < 8; j++) {
            if(board[i][j] === valPiece) {
                x = i;
                y = j;
                break;
                i = 9;
            }
        }
    }
    let currI = board[x][y], currP, currPE;
    currI = valPiece;
    console.log("currI " + currI);
    console.log("board[x][y] " + board[x][y]);
    if(myPieces[0].includes(currI)) {
        currP = 0;
        currPE = 1;
    }
    else if(myPieces[1].includes(currI)){
        currP = 1;
        currPE = 0;
    }
    console.log("currP =" + currP);
    console.log("currPE =" + currPE);

    let between = [];

    // check between left right
    let checkBefore = 0;
    for(let i = x, j = y - 1; j >= 0; j--) {
        if(!myPieces[currP].includes(board[i][j]) && myPieces[currPE].includes(board[i][j])) {
            console.log("check between left");
            between.push(board[i][j]);
            checkBefore++;
            break;
        }
        else if(board[i][j] < 0) {
            break;
        }
    }
    for(let i = x, j = y + 1; j < 8; j++) {
        if(!myPieces[currP].includes(board[i][j]) && myPieces[currPE].includes(board[i][j])) {
            console.log("check between right");
            between.push(board[i][j]);
            checkBefore++;
            break;
        }
        else if(board[i][j] < 0) {
            break;
        }
    }
    if(checkBefore !== 2) {
        between = [];
    }
    let tmpBetween = between;
    // check between top down
    checkBefore = 0;
    for(let i = x - 1, j = y; i >= 0; i--) {
        if(!myPieces[currP].includes(board[i][j]) && myPieces[currPE].includes(board[i][j])) {
            console.log("check between top");
            between.push(board[i][j]);
            checkBefore++;
            break;
        }
        else if(board[i][j] < 0) {
            break;
        }
    }
    for(let i = x + 1, j = y; i < 8; i++) {
        if(!myPieces[currP].includes(board[i][j]) && myPieces[currPE].includes(board[i][j])) {
            console.log("check between down");
            between.push(board[i][j]);
            checkBefore++;
            break;
        }
        else if(board[i][j] < 0) {
            break;
        }
    }
    if(checkBefore !== 2) {
        between = tmpBetween;
    }

    // check top
    let tmp = [];
    for(let i = x - 1, j = y; i >= 0; i--) {
        console.log("check top" + board[i][j]);
        if(board[i][j] < 0) {
            break;
        }
        if(myPieces[currPE].includes(board[i][j])) {
            tmp.push(board[i][j]);
        }
        else {
            for(let k = 0, l = j; k < 8; k++) {
                if(tmp.includes(board[k][l])) {
                    console.log('Pinnn top');
                    myPieces = removePiece(board[k][l], myPieces);
                    board[k][l] *= -1;
                    addBlank.push(board[k][l]);
                }
            }
        }
    }

    // check down
    tmp = [];
    for(let i = x + 1, j = y; i < 8; i++) {
        console.log("check down" + board[i][j]);
        if(board[i][j] < 0) {
            break;
        }
        console.log("myPieces[currPE]" + myPieces[currPE]);
        if(myPieces[currPE].includes(board[i][j])) {
            tmp.push(board[i][j]);
        }
        else {
            console.log('tmp');
            console.log(tmp);
            for(let k = 0, l = j; k < 8; k++) {
                if(tmp.includes(board[k][l])) {
                    console.log('Pinnn down');
                    myPieces = removePiece(board[k][l], myPieces);
                    board[k][l] *= -1;
                    addBlank.push(board[k][l]);
                }
            }
        }
    }

    // check left
    tmp = [];
    for(let i = x, j = y - 1; j >= 0; j--) {
        console.log("check left" + board[i][j]);
        if(board[i][j] < 0) {
            break;
        }
        if(myPieces[currPE].includes(board[i][j])) {
            tmp.push(board[i][j]);
        }
        else {
            for(let k = i, l = 0; l < 8; l++) {
                if(tmp.includes(board[k][l])) {
                    console.log('Pinnn left');
                    myPieces = removePiece(board[k][l], myPieces);
                    board[k][l] *= -1;
                    addBlank.push(board[k][l]);
                }
            }
        }
    }

    // check right
    tmp = [];
    for(let i = x, j = y + 1; j < 8; j++) {
        console.log("check right" + board[i][j]);
        if(board[i][j] < 0) {
            break;
        }
        if(myPieces[currPE].includes(board[i][j])) {
            tmp.push(board[i][j]);
        }
        else {
            for(let k = i, l = 0; l < 8; l++) {
                if(tmp.includes(board[k][l])) {
                    console.log('Pinnn right');
                    myPieces = removePiece(board[k][l], myPieces);
                    board[k][l] *= -1;
                    addBlank.push(board[k][l]);
                }
            }
        }
    }

    // remove between
    if(between.length === 2) {
        for(let i = 0; i < 8; i++) {
            for(let j = 0; j < 8; j++) {
                if(between.includes(board[i][j])) {
                    console.log('Pinnn between');
                    myPieces = removePiece(board[i][j], myPieces);
                    board[i][j] *= -1;
                    addBlank.push(board[i][j]);
                }
            }
        }
    }
    let result = [];
    result.push(board);
    result.push(myPieces);

    return result;
}


function createInitBoard(player) {
    let initBoard = [];
    initBoard.push([9, 10, 11, 12, 13, 14, 15, 16]);
    let row = [];
    for(let i = -17; i >= -64; i--) {
        row.push(i);
        if(Math.abs(i) % 8 == 0) {
            initBoard.push(row);
            row = []
        }
    }
    initBoard.push([1, 2, 3, 4, 5, 6, 7, 8]);
    if(player === '1') {
        return initBoard;
    }
    else {
        return flipBoard(initBoard);
    }
    
}

function flipBoard(board) {
    let newBoard = [];
    for(let i = 7; i >= 0; i--) {
        let row = [];
        for(let j = 7; j >= 0; j--) {
            row.push(board[i][j]);
        }
        newBoard.push(row);
    }
    return newBoard;
}

function createBoard(game, board, player, myPieces, currPiece) {

    while(divRooms.firstChild){
        divRooms.removeChild(divRooms.firstChild);
        divRooms.setAttribute("class", "");
    }

    while(divPlayers.firstChild){
            divPlayers.removeChild(divPlayers.firstChild);
    }
    game.clients.forEach(c => {   
        const d = document.createElement("div");
        d.style.with = "200px";
        d.textContent = "player " + c.player;
        divPlayers.appendChild(d);
    })
    showTxtGameId.innerHTML = game.id;


    while(divBoard.firstChild){
        divBoard.removeChild(divBoard.firstChild);
    }   
    divBoard.setAttribute("class", "table-responsive");

    divBoard.appendChild(tableCreate(8, 8, player, board, myPieces, currPiece));
  
}




function tableCreate(row, col, player, board, myPieces, currPiece){
    
    let tbl  = document.createElement('table');
    tbl.style.width = '800px';
    tbl.style.height = '800px';
    tbl.style.border = '1px solid black';
    tbl.setAttribute("class", "table");

    for(let i = 0; i < row; i++){
        let tr = tbl.insertRow();
        for(let j = 0; j < col; j++){
                let td = tr.insertCell();
                td.style.border = '1px solid black';
                td.style.width = '100px';
                td.style.height = '100px';
                td.setAttribute("id", "b" + board[i][j]);
                
                if(myPieces[0].includes(board[i][j])) {
                    // let piece = document.createElement('img');
                    // piece.setAttribute("src", "assets/p1.png");
                    let piece = document.createElement('p');
                    // piece.setAttribute("height", "100");
                    // piece.setAttribute("width", "100");
                    piece.setAttribute("id", "b" + board[i][j]);
                    if(board[i][j] === currPiece) {
                        piece.setAttribute("class", "red-piece-click");
                    }
                    else {
                        piece.setAttribute("class", "red-piece");
                    }

                    td.appendChild(piece);
                    p1 = document.getElementById("b1");
                }
                else if(myPieces[1].includes(board[i][j])) {
                    // let piece = document.createElement('img');
                    let piece = document.createElement('p');
                    // piece.setAttribute("src", "assets/p2.png");
                    // piece.setAttribute("height", "100");
                    // piece.setAttribute("width", "100");
                    piece.setAttribute("id", "b" + board[i][j]);
                    if(board[i][j] === currPiece) {
                        piece.setAttribute("class", "black-piece-click");
                    }
                    else {
                        piece.setAttribute("class", "black-piece");
                    }
                    td.appendChild(piece);
                }
                
        
        }     
    }
    return tbl;
}
